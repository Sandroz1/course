from django.conf import settings


# This stage intentionally has no runner integration. Both conditions must become
# true in a later reviewed change before the public API can advertise execution.
RUNNER_INTEGRATION_AVAILABLE = False


def checker_execution_available() -> bool:
    return RUNNER_INTEGRATION_AVAILABLE and bool(settings.CHECKER_EXECUTION_ENABLED)
