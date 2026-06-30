from __future__ import annotations

import re
from collections.abc import Mapping
from dataclasses import dataclass, field
from types import MappingProxyType
from typing import Literal, Protocol
from uuid import UUID


RunnerTerminalStatus = Literal[
    "accepted",
    "wrong_answer",
    "compile_error",
    "runtime_error",
    "time_limit",
    "output_limit",
    "internal_error",
]
RUNNER_TERMINAL_STATUSES: tuple[RunnerTerminalStatus, ...] = (
    "accepted",
    "wrong_answer",
    "compile_error",
    "runtime_error",
    "time_limit",
    "output_limit",
    "internal_error",
)
RunnerDispatchStatus = Literal["queued"]
RunnerLanguage = Literal["cpp17"]
RunnerComparisonMode = Literal["exact", "trimmed_lines", "tokens"]
SafeMetadataValue = str | int | float | bool | None
SafeMetadata = Mapping[str, SafeMetadataValue]


_SENSITIVE_METADATA_TERM = re.compile(
    r"source|source_code|stdin|input|expected|expected_output|stdout|stderr|stdio|hidden|test|payload|"
    r"compiler_output|runtime_output|secret|token|password|passwd|key|credential|env|database|"
    r"postgres|redis|django|openai|deploy|backup",
    re.IGNORECASE,
)
_ABSOLUTE_PATH_VALUE = re.compile(r"^(?:[A-Za-z]:[\\/]|/)")


def _ensure_positive(name: str, value: int) -> None:
    if value <= 0:
        raise ValueError(f"{name} must be positive.")


def safe_metadata(metadata: SafeMetadata | None) -> SafeMetadata:
    """Return metadata safe enough for adapter bookkeeping.

    Metadata is deliberately constrained because runner metadata may appear in
    debug logs or admin diagnostics. It must not carry env/secrets, production
    details, absolute paths, source, stdio, or hidden test payloads.
    """

    if not metadata:
        return MappingProxyType({})

    cleaned: dict[str, SafeMetadataValue] = {}
    for key, value in metadata.items():
        if _SENSITIVE_METADATA_TERM.search(key):
            raise ValueError("Runner metadata keys must not contain sensitive names.")
        if isinstance(value, str) and _ABSOLUTE_PATH_VALUE.search(value):
            raise ValueError("Runner metadata values must not contain absolute paths.")
        if isinstance(value, str) and _SENSITIVE_METADATA_TERM.search(value):
            raise ValueError("Runner metadata values must not contain sensitive names.")
        cleaned[str(key)] = value

    return MappingProxyType(cleaned)


@dataclass(frozen=True)
class RunnerLimits:
    compile_timeout_ms: int
    run_timeout_ms: int
    memory_limit_kb: int
    output_limit_bytes: int

    def __post_init__(self) -> None:
        _ensure_positive("compile_timeout_ms", self.compile_timeout_ms)
        _ensure_positive("run_timeout_ms", self.run_timeout_ms)
        _ensure_positive("memory_limit_kb", self.memory_limit_kb)
        _ensure_positive("output_limit_bytes", self.output_limit_bytes)


@dataclass(frozen=True)
class RunnerTestCase:
    input: str = field(repr=False)
    expected_output: str = field(repr=False)
    is_hidden: bool
    position: int
    weight: int = 1

    def __post_init__(self) -> None:
        if self.position < 0:
            raise ValueError("position must be non-negative.")
        _ensure_positive("weight", self.weight)


@dataclass(frozen=True)
class RunnerJob:
    submission_id: UUID
    task_id: str
    task_version: int
    language: RunnerLanguage
    comparison_mode: RunnerComparisonMode
    source_code: str = field(repr=False)
    limits: RunnerLimits
    tests: tuple[RunnerTestCase, ...] = field(repr=False)
    metadata: SafeMetadata = field(default_factory=dict)

    def __post_init__(self) -> None:
        _ensure_positive("task_version", self.task_version)
        object.__setattr__(self, "tests", tuple(self.tests))
        object.__setattr__(self, "metadata", safe_metadata(self.metadata))


@dataclass(frozen=True)
class RunnerDispatch:
    external_job_id: str
    status: RunnerDispatchStatus = "queued"
    metadata: SafeMetadata = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.status != "queued":
            raise ValueError("Runner dispatch status must be queued.")
        object.__setattr__(self, "metadata", safe_metadata(self.metadata))


@dataclass(frozen=True)
class RunnerResult:
    status: RunnerTerminalStatus
    exit_code: int | None = None
    stdout: str = field(default="", repr=False)
    stderr: str = field(default="", repr=False)
    compile_time_ms: int | None = None
    run_time_ms: int | None = None
    timed_out: bool = False
    output_truncated: bool = False
    error_message: str = field(default="", repr=False)
    passed_tests: int = 0
    failed_tests: int = 0
    total_tests: int = 0
    metadata: SafeMetadata = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.status not in RUNNER_TERMINAL_STATUSES:
            raise ValueError("Runner result status must be terminal and canonical.")
        if self.passed_tests < 0 or self.failed_tests < 0 or self.total_tests < 0:
            raise ValueError("test counters must be non-negative.")
        object.__setattr__(self, "metadata", safe_metadata(self.metadata))


@dataclass(frozen=True)
class RunnerHealth:
    available: bool
    reason: str | None = None
    metadata: SafeMetadata = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "metadata", safe_metadata(self.metadata))


class RunnerClient(Protocol):
    """Queue-ready contract for future runner providers.

    Implementations must not run inside the Django container. A future Piston
    client can implement this protocol only after the worker VM security gate
    passes and checker execution is explicitly enabled.
    """

    def check_health(self) -> RunnerHealth:
        """Return provider readiness without exposing secrets or infrastructure."""

    def submit(self, job: RunnerJob) -> RunnerDispatch:
        """Dispatch a validated job and return a provider-owned job id."""

    def get_result(self, external_job_id: str) -> RunnerResult | None:
        """Return a terminal result, or None while the provider job is pending."""
