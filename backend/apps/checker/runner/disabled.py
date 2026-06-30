from __future__ import annotations

from .contracts import RunnerDispatch, RunnerHealth, RunnerJob, RunnerResult


class DisabledRunnerUnavailable(RuntimeError):
    """Raised if disabled runner dispatch is called before integration exists."""


class DisabledRunner:
    """Fail-closed runner provider for the current no-execution stage."""

    reason = "runner_unavailable"

    def check_health(self) -> RunnerHealth:
        return RunnerHealth(
            available=False,
            reason=self.reason,
            metadata={"provider": "disabled_runner"},
        )

    def submit(self, _job: RunnerJob) -> RunnerDispatch:
        raise DisabledRunnerUnavailable("Checker execution is disabled.")

    def get_result(self, _external_job_id: str) -> RunnerResult | None:
        return None
