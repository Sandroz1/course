from __future__ import annotations

from .contracts import RunnerResult, RunnerTerminalStatus
from ..models import Submission


RUNNER_RESULT_TO_SUBMISSION_STATUS: dict[str, str] = {
    "accepted": Submission.Status.ACCEPTED,
    "wrong_answer": Submission.Status.WRONG_ANSWER,
    "compile_error": Submission.Status.COMPILE_ERROR,
    "runtime_error": Submission.Status.RUNTIME_ERROR,
    "time_limit": Submission.Status.TIME_LIMIT,
    "output_limit": Submission.Status.OUTPUT_LIMIT,
    "internal_error": Submission.Status.INTERNAL_ERROR,
}


def map_runner_status_to_submission_status(status: RunnerTerminalStatus | str) -> str:
    """Map a runner terminal result to canonical persisted checker status."""

    return RUNNER_RESULT_TO_SUBMISSION_STATUS.get(status, Submission.Status.INTERNAL_ERROR)


def map_runner_result_to_submission_status(result: RunnerResult) -> str:
    return map_runner_status_to_submission_status(result.status)
