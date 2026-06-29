from __future__ import annotations

import os
import shutil
import signal
import subprocess
import tempfile
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Literal

try:
    import resource as resource_module
except ImportError:  # pragma: no cover - Windows smoke path.
    resource_module = None

RunnerStatus = Literal[
    "accepted",
    "wrong_answer",
    "compile_error",
    "runtime_error",
    "time_limit",
    "output_limit",
    "internal_error",
]


SAFE_ENV = {
    "PATH": "/usr/bin:/bin",
    "LANG": "C.UTF-8",
    "LC_ALL": "C.UTF-8",
}


@dataclass(frozen=True)
class RunnerLimits:
    compile_timeout_seconds: float = 10.0
    run_timeout_seconds: float = 2.0
    output_limit_bytes: int = 64 * 1024
    memory_limit_bytes: int = 128 * 1024 * 1024


@dataclass(frozen=True)
class RunSpec:
    source_code: str
    stdin: str = ""
    expected_stdout: str = ""
    comparison: Literal["exact", "trimmed_lines"] = "exact"


@dataclass(frozen=True)
class RunnerResult:
    status: RunnerStatus
    exit_code: int | None
    stdout: str
    stderr: str
    compile_time_ms: int
    run_time_ms: int
    timed_out: bool
    output_truncated: bool
    error_message: str
    metadata: dict[str, str | int | bool] = field(default_factory=dict)

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


def runner_supported() -> tuple[bool, str]:
    if os.name != "posix":
        return False, "prototype execution requires Linux/POSIX process groups"
    if shutil.which("g++") is None:
        return False, "g++ is not available on PATH"
    return True, ""


def run_cpp(spec: RunSpec, limits: RunnerLimits | None = None, workspace_root: Path | str | None = None) -> RunnerResult:
    limits = limits or RunnerLimits()
    supported, reason = runner_supported()
    if not supported:
        return _result(
            "internal_error",
            error_message=reason,
            metadata={"supported": False, "network_isolation": "not_proven_by_harness"},
        )

    workspace_parent = Path(workspace_root) if workspace_root is not None else None
    workspace = Path(tempfile.mkdtemp(prefix="uchicode_runner_", dir=workspace_parent))

    compile_time_ms = 0
    try:
        (workspace / "main.cpp").write_text(spec.source_code, encoding="utf-8")

        compile_result, compile_time_ms = _compile(workspace, limits)
        if compile_result is not None:
            return compile_result

        run_result = _run_binary(workspace, spec, limits, compile_time_ms)
        if run_result.status in {"time_limit", "output_limit", "runtime_error", "internal_error"}:
            return run_result

        if _matches(spec.expected_stdout, run_result.stdout, spec.comparison):
            return _replace_status(run_result, "accepted")
        return _replace_status(run_result, "wrong_answer")
    except Exception as exc:  # pragma: no cover - defensive boundary for prototype failures.
        return _result(
            "internal_error",
            compile_time_ms=compile_time_ms,
            error_message=f"{type(exc).__name__}: {exc}",
            metadata={"supported": True, "network_isolation": "not_proven_by_harness"},
        )
    finally:
        shutil.rmtree(workspace, ignore_errors=True)


def _compile(workspace: Path, limits: RunnerLimits) -> tuple[RunnerResult | None, int]:
    command = ["g++", "-std=c++17", "-O0", "-pipe", "-Wall", "-Wextra", "-o", "main", "main.cpp"]
    started = time.monotonic()
    try:
        completed = subprocess.run(
            command,
            cwd=workspace,
            env=SAFE_ENV,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=limits.compile_timeout_seconds,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        compile_time_ms = _elapsed_ms(started)
        stdout, stdout_truncated = _decode_limited(exc.stdout or b"", limits.output_limit_bytes, workspace)
        stderr, stderr_truncated = _decode_limited(exc.stderr or b"", limits.output_limit_bytes, workspace)
        return (
            _result(
                "time_limit",
                stdout=stdout,
                stderr=stderr,
                compile_time_ms=compile_time_ms,
                timed_out=True,
                output_truncated=stdout_truncated or stderr_truncated,
                error_message="compile timeout",
            ),
            compile_time_ms,
        )

    compile_time_ms = _elapsed_ms(started)
    stdout, stdout_truncated = _decode_limited(completed.stdout, limits.output_limit_bytes, workspace)
    stderr, stderr_truncated = _decode_limited(completed.stderr, limits.output_limit_bytes, workspace)

    if completed.returncode != 0:
        return (
            _result(
                "compile_error",
                exit_code=completed.returncode,
                stdout=stdout,
                stderr=stderr,
                compile_time_ms=compile_time_ms,
                output_truncated=stdout_truncated or stderr_truncated,
                error_message="compiler returned non-zero exit code",
            ),
            compile_time_ms,
        )
    if stdout_truncated or stderr_truncated:
        return (
            _result(
                "output_limit",
                exit_code=completed.returncode,
                stdout=stdout,
                stderr=stderr,
                compile_time_ms=compile_time_ms,
                output_truncated=True,
                error_message="compiler output exceeded limit",
            ),
            compile_time_ms,
        )
    return None, compile_time_ms


def _run_binary(workspace: Path, spec: RunSpec, limits: RunnerLimits, compile_time_ms: int) -> RunnerResult:
    stdout_path = workspace / "stdout.txt"
    stderr_path = workspace / "stderr.txt"
    started = time.monotonic()
    proc: subprocess.Popen[bytes] | None = None

    try:
        with stdout_path.open("wb", buffering=0) as stdout_file, stderr_path.open("wb", buffering=0) as stderr_file:
            proc = subprocess.Popen(
                [str(workspace / "main")],
                cwd=workspace,
                env=SAFE_ENV,
                stdin=subprocess.PIPE,
                stdout=stdout_file,
                stderr=stderr_file,
                start_new_session=True,
                preexec_fn=_resource_limiter(limits),
            )
            if proc.stdin is not None:
                try:
                    proc.stdin.write(spec.stdin.encode("utf-8"))
                    proc.stdin.close()
                except BrokenPipeError:
                    pass

            deadline = started + limits.run_timeout_seconds
            while proc.poll() is None:
                if time.monotonic() >= deadline:
                    _kill_process_tree(proc)
                    return _finish_run(
                        "time_limit",
                        proc,
                        stdout_path,
                        stderr_path,
                        workspace,
                        limits,
                        compile_time_ms,
                        started,
                        timed_out=True,
                        error_message="run timeout",
                    )
                if _combined_size(stdout_path, stderr_path) > limits.output_limit_bytes:
                    _kill_process_tree(proc)
                    return _finish_run(
                        "output_limit",
                        proc,
                        stdout_path,
                        stderr_path,
                        workspace,
                        limits,
                        compile_time_ms,
                        started,
                        output_truncated=True,
                        error_message="runtime output exceeded limit",
                    )
                time.sleep(0.01)
    except Exception as exc:
        if proc is not None and proc.poll() is None:
            _kill_process_tree(proc)
        return _result(
            "internal_error",
            compile_time_ms=compile_time_ms,
            run_time_ms=_elapsed_ms(started),
            error_message=f"{type(exc).__name__}: {exc}",
            metadata={"supported": True, "network_isolation": "not_proven_by_harness"},
        )

    assert proc is not None
    stdout, stdout_truncated = _read_limited(stdout_path, limits.output_limit_bytes, workspace)
    stderr, stderr_truncated = _read_limited(stderr_path, limits.output_limit_bytes, workspace)
    output_truncated = stdout_truncated or stderr_truncated

    if output_truncated:
        return _result(
            "output_limit",
            exit_code=proc.returncode,
            stdout=stdout,
            stderr=stderr,
            compile_time_ms=compile_time_ms,
            run_time_ms=_elapsed_ms(started),
            output_truncated=True,
            error_message="runtime output exceeded limit",
        )

    if proc.returncode != 0:
        return _result(
            "runtime_error",
            exit_code=proc.returncode,
            stdout=stdout,
            stderr=stderr,
            compile_time_ms=compile_time_ms,
            run_time_ms=_elapsed_ms(started),
            error_message="program returned non-zero exit code",
        )

    return _result(
        "wrong_answer",
        exit_code=0,
        stdout=stdout,
        stderr=stderr,
        compile_time_ms=compile_time_ms,
        run_time_ms=_elapsed_ms(started),
        error_message="",
    )


def _finish_run(
    status: RunnerStatus,
    proc: subprocess.Popen[bytes],
    stdout_path: Path,
    stderr_path: Path,
    workspace: Path,
    limits: RunnerLimits,
    compile_time_ms: int,
    started: float,
    *,
    timed_out: bool = False,
    output_truncated: bool = False,
    error_message: str,
) -> RunnerResult:
    stdout, stdout_truncated = _read_limited(stdout_path, limits.output_limit_bytes, workspace)
    stderr, stderr_truncated = _read_limited(stderr_path, limits.output_limit_bytes, workspace)
    return _result(
        status,
        exit_code=proc.returncode,
        stdout=stdout,
        stderr=stderr,
        compile_time_ms=compile_time_ms,
        run_time_ms=_elapsed_ms(started),
        timed_out=timed_out,
        output_truncated=output_truncated or stdout_truncated or stderr_truncated,
        error_message=error_message,
    )


def _resource_limiter(limits: RunnerLimits):
    if resource_module is None:
        return None

    def limit_resources() -> None:
        resource_module.setrlimit(resource_module.RLIMIT_AS, (limits.memory_limit_bytes, limits.memory_limit_bytes))
        cpu_seconds = max(1, int(limits.run_timeout_seconds) + 1)
        resource_module.setrlimit(resource_module.RLIMIT_CPU, (cpu_seconds, cpu_seconds))

    return limit_resources


def _kill_process_tree(proc: subprocess.Popen[bytes]) -> None:
    try:
        os.killpg(proc.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    except Exception:
        proc.kill()
    try:
        proc.wait(timeout=1)
    except subprocess.TimeoutExpired:
        proc.kill()


def _combined_size(*paths: Path) -> int:
    total = 0
    for path in paths:
        try:
            total += path.stat().st_size
        except FileNotFoundError:
            pass
    return total


def _read_limited(path: Path, limit: int, workspace: Path) -> tuple[str, bool]:
    try:
        data = path.read_bytes()
    except FileNotFoundError:
        return "", False
    return _decode_limited(data, limit, workspace)


def _decode_limited(data: bytes, limit: int, workspace: Path) -> tuple[str, bool]:
    truncated = len(data) > limit
    if truncated:
        data = data[:limit]
    text = data.decode("utf-8", errors="replace")
    return _sanitize(text, workspace), truncated


def _sanitize(text: str, workspace: Path) -> str:
    return text.replace(str(workspace), "<workspace>")


def _matches(expected: str, actual: str, comparison: str) -> bool:
    expected = expected.replace("\r\n", "\n")
    actual = actual.replace("\r\n", "\n")
    if comparison == "trimmed_lines":
        return [line.rstrip() for line in expected.strip().splitlines()] == [
            line.rstrip() for line in actual.strip().splitlines()
        ]
    return actual == expected


def _replace_status(result: RunnerResult, status: RunnerStatus) -> RunnerResult:
    return RunnerResult(
        status=status,
        exit_code=result.exit_code,
        stdout=result.stdout,
        stderr=result.stderr,
        compile_time_ms=result.compile_time_ms,
        run_time_ms=result.run_time_ms,
        timed_out=result.timed_out,
        output_truncated=result.output_truncated,
        error_message="" if status == "accepted" else "output did not match expected stdout",
        metadata=result.metadata,
    )


def _result(
    status: RunnerStatus,
    *,
    exit_code: int | None = None,
    stdout: str = "",
    stderr: str = "",
    compile_time_ms: int = 0,
    run_time_ms: int = 0,
    timed_out: bool = False,
    output_truncated: bool = False,
    error_message: str = "",
    metadata: dict[str, str | int | bool] | None = None,
) -> RunnerResult:
    default_metadata: dict[str, str | int | bool] = {
        "prototype": True,
        "language": "cpp17",
        "network_isolation": "not_proven_by_harness",
    }
    if metadata:
        default_metadata.update(metadata)
    return RunnerResult(
        status=status,
        exit_code=exit_code,
        stdout=stdout,
        stderr=stderr,
        compile_time_ms=compile_time_ms,
        run_time_ms=run_time_ms,
        timed_out=timed_out,
        output_truncated=output_truncated,
        error_message=error_message,
        metadata=default_metadata,
    )


def _elapsed_ms(started: float) -> int:
    return int((time.monotonic() - started) * 1000)
