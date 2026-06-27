from django.conf import settings

from .models import CheckerTaskVersion


# This stage intentionally has no runner integration. Both conditions must become
# true in a later reviewed change before the public API can advertise execution.
RUNNER_INTEGRATION_AVAILABLE = False


def checker_execution_available() -> bool:
    return RUNNER_INTEGRATION_AVAILABLE and bool(settings.CHECKER_EXECUTION_ENABLED)


def checker_task_requires_accepted_submission(task_id: str) -> bool:
    return CheckerTaskVersion.objects.filter(task_id=task_id, is_enabled=True).exists()
