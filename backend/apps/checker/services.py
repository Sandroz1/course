from django.conf import settings

from .exceptions import CheckerUnavailable
from .models import CheckerTaskVersion, Submission, TaskAttempt
from .runner.contracts import RunnerClient, RunnerHealth
from .runner.disabled import DisabledRunner


# This stage intentionally has no executable runner integration. Both conditions
# must become true in a later reviewed change before the public API can advertise
# execution or create Submission rows.
RUNNER_INTEGRATION_AVAILABLE = False
_DISABLED_RUNNER = DisabledRunner()


def get_runner_client() -> RunnerClient:
    return _DISABLED_RUNNER


def get_runner_health() -> RunnerHealth:
    return get_runner_client().check_health()


def checker_execution_available() -> bool:
    if not RUNNER_INTEGRATION_AVAILABLE or not bool(settings.CHECKER_EXECUTION_ENABLED):
        return False

    return get_runner_health().available


def checker_unavailable_reason() -> str:
    return get_runner_health().reason or "runner_unavailable"


def create_checker_submission(
    *,
    attempt: TaskAttempt,
    task_version: CheckerTaskVersion,
    source_code: str,
) -> Submission:
    """Create a submission only after the execution gate has passed.

    Current behavior remains fail-closed: no Submission row is created until a
    real runner provider is reviewed, provisioned and explicitly enabled.
    """

    if not checker_execution_available():
        raise CheckerUnavailable()

    # Defensive fallback for this no-execution stage. A future runner adapter
    # change must replace this branch with validated dispatch logic.
    raise CheckerUnavailable()


def checker_task_requires_accepted_submission(task_id: str) -> bool:
    return CheckerTaskVersion.objects.filter(task_id=task_id, is_enabled=True).exists()
