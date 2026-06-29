from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path

from tools.runner_prototype.runner import RunnerLimits, RunSpec, runner_supported, run_cpp


SUPPORTED, UNSUPPORTED_REASON = runner_supported()


@unittest.skipUnless(SUPPORTED, UNSUPPORTED_REASON)
class RunnerPrototypeTests(unittest.TestCase):
    def test_success(self) -> None:
        result = run_cpp(
            RunSpec(
                source_code="""
#include <iostream>
int main() {
    int value = 0;
    std::cin >> value;
    std::cout << value * 2 << "\\n";
}
""",
                stdin="21\n",
                expected_stdout="42\n",
            )
        )

        self.assertEqual(result.status, "accepted")
        self.assertEqual(result.exit_code, 0)
        self.assertFalse(result.timed_out)

    def test_wrong_answer(self) -> None:
        result = run_cpp(
            RunSpec(
                source_code="""
#include <iostream>
int main() {
    std::cout << "wrong\\n";
}
""",
                expected_stdout="right\n",
            )
        )

        self.assertEqual(result.status, "wrong_answer")

    def test_compile_error(self) -> None:
        result = run_cpp(RunSpec(source_code="int main( { return 0; }\n"))

        self.assertEqual(result.status, "compile_error")
        self.assertIn("error", result.stderr.lower())

    def test_runtime_error(self) -> None:
        result = run_cpp(RunSpec(source_code="int main() { return 7; }\n"))

        self.assertEqual(result.status, "runtime_error")
        self.assertEqual(result.exit_code, 7)

    def test_time_limit(self) -> None:
        result = run_cpp(
            RunSpec(source_code="int main() { while (true) {} }\n"),
            limits=RunnerLimits(run_timeout_seconds=0.2),
        )

        self.assertEqual(result.status, "time_limit")
        self.assertTrue(result.timed_out)

    def test_output_limit(self) -> None:
        result = run_cpp(
            RunSpec(
                source_code="""
#include <iostream>
int main() {
    while (true) {
        std::cout << "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    }
}
"""
            ),
            limits=RunnerLimits(run_timeout_seconds=1.0, output_limit_bytes=512),
        )

        self.assertEqual(result.status, "output_limit")
        self.assertTrue(result.output_truncated)
        self.assertLessEqual(len(result.stdout.encode("utf-8")), 512)

    def test_cleanup_after_success_failure_and_timeout(self) -> None:
        cases = [
            RunSpec(source_code="int main() { return 0; }\n"),
            RunSpec(source_code="int main( { return 0; }\n"),
            RunSpec(source_code="int main() { while (true) {} }\n"),
        ]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for spec in cases:
                run_cpp(spec, limits=RunnerLimits(run_timeout_seconds=0.2), workspace_root=root)
                self.assertEqual(list(root.iterdir()), [])

    def test_stderr_capture_is_bounded(self) -> None:
        result = run_cpp(
            RunSpec(
                source_code="""
#include <iostream>
int main() {
    std::cerr << "runtime stderr";
    return 5;
}
"""
            ),
            limits=RunnerLimits(output_limit_bytes=128),
        )

        self.assertEqual(result.status, "runtime_error")
        self.assertIn("runtime stderr", result.stderr)
        self.assertLessEqual(len(result.stderr.encode("utf-8")), 128)

    def test_parent_env_is_not_inherited(self) -> None:
        os.environ["UCHICODE_RUNNER_SECRET_SHOULD_NOT_LEAK"] = "secret-value"
        try:
            result = run_cpp(
                RunSpec(
                    source_code="""
#include <cstdlib>
#include <iostream>
int main() {
    const char* value = std::getenv("UCHICODE_RUNNER_SECRET_SHOULD_NOT_LEAK");
    std::cout << (value == nullptr ? "clean" : "leaked") << "\\n";
}
""",
                    expected_stdout="clean\n",
                )
            )
        finally:
            os.environ.pop("UCHICODE_RUNNER_SECRET_SHOULD_NOT_LEAK", None)

        self.assertEqual(result.status, "accepted")

    def test_metadata_has_no_workspace_path(self) -> None:
        result = run_cpp(RunSpec(source_code="int main() { return 0; }\n"))

        self.assertNotIn("/", " ".join(str(value) for value in result.metadata.values()))
        self.assertEqual(result.metadata["network_isolation"], "not_proven_by_harness")


if __name__ == "__main__":
    unittest.main()
