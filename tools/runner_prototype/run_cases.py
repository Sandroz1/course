from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from tools.runner_prototype.runner import RunnerLimits, RunSpec, runner_supported, run_cpp


@dataclass(frozen=True)
class Case:
    name: str
    spec: RunSpec
    expected_status: str
    limits: RunnerLimits = RunnerLimits()


CASES = [
    Case(
        name="success",
        spec=RunSpec(
            source_code="""
#include <iostream>
int main() {
    int value = 0;
    std::cin >> value;
    std::cout << value * 2 << "\\n";
    return 0;
}
""",
            stdin="21\n",
            expected_stdout="42\n",
        ),
        expected_status="accepted",
    ),
    Case(
        name="wrong_answer",
        spec=RunSpec(
            source_code="""
#include <iostream>
int main() {
    std::cout << "wrong\\n";
    return 0;
}
""",
            expected_stdout="right\n",
        ),
        expected_status="wrong_answer",
    ),
    Case(
        name="compile_error",
        spec=RunSpec(source_code="int main( { return 0; }\n"),
        expected_status="compile_error",
    ),
    Case(
        name="runtime_error",
        spec=RunSpec(source_code="int main() { return 7; }\n"),
        expected_status="runtime_error",
    ),
    Case(
        name="time_limit",
        spec=RunSpec(source_code="int main() { while (true) {} }\n"),
        expected_status="time_limit",
        limits=RunnerLimits(run_timeout_seconds=0.2),
    ),
    Case(
        name="output_limit",
        spec=RunSpec(
            source_code="""
#include <iostream>
int main() {
    while (true) {
        std::cout << "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    }
}
""",
        ),
        expected_status="output_limit",
        limits=RunnerLimits(run_timeout_seconds=1.0, output_limit_bytes=512),
    ),
    Case(
        name="env_not_inherited",
        spec=RunSpec(
            source_code="""
#include <cstdlib>
#include <iostream>
int main() {
    const char* value = std::getenv("UCHICODE_RUNNER_SECRET_SHOULD_NOT_LEAK");
    std::cout << (value == nullptr ? "clean" : "leaked") << "\\n";
    return 0;
}
""",
            expected_stdout="clean\n",
        ),
        expected_status="accepted",
    ),
]


def main() -> int:
    supported, reason = runner_supported()
    if not supported:
        print(json.dumps({"supported": False, "reason": reason}, indent=2))
        return 0

    results = []
    failed = False
    for case in CASES:
        result = run_cpp(case.spec, limits=case.limits)
        passed = result.status == case.expected_status
        failed = failed or not passed
        results.append(
            {
                "name": case.name,
                "expected_status": case.expected_status,
                "status": result.status,
                "passed": passed,
                "timed_out": result.timed_out,
                "output_truncated": result.output_truncated,
                "compile_time_ms": result.compile_time_ms,
                "run_time_ms": result.run_time_ms,
                "error_message": result.error_message,
            }
        )

    print(json.dumps({"supported": True, "cases": results}, indent=2))
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
