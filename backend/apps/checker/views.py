from django.db import transaction
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .exceptions import CheckerUnavailable, Conflict
from .models import CheckerTaskVersion, Submission, TaskAttempt
from .serializers import (
    AttemptDraftSerializer,
    PublicTestCaseSerializer,
    SubmissionCreateSerializer,
    SubmissionSerializer,
    TaskAttemptSerializer,
)
from .services import checker_execution_available


class AttemptHistoryPagination(PageNumberPagination):
    page_size = 20
    max_page_size = 100
    page_size_query_param = "page_size"


def _current_task_version(task_id: str) -> CheckerTaskVersion | None:
    return (
        CheckerTaskVersion.objects.filter(task_id=task_id, is_enabled=True)
        .order_by("-task_version")
        .first()
    )


def _resolve_requested_version(task_id: str, requested_version: object) -> CheckerTaskVersion:
    if isinstance(requested_version, bool) or not isinstance(requested_version, int):
        raise ValidationError({"task_version": ["A positive integer is required."]})

    current = _current_task_version(task_id)
    if current is None:
        raise Http404

    if requested_version != current.task_version:
        raise Conflict(
            {
                "message": "Версия задачи устарела. Обновите страницу и сохраните черновик заново.",
                "current_task_version": current.task_version,
            }
        )

    return current


class CheckerAvailabilityView(APIView):
    permission_classes = [AllowAny]

    def get(self, _request, task_id: str):
        task_version = _current_task_version(task_id)
        if task_version is None:
            return Response(
                {
                    "task_id": task_id,
                    "available": False,
                    "reason": "not_supported",
                }
            )

        public_tests = task_version.test_cases.filter(is_hidden=False)
        execution_available = checker_execution_available()

        return Response(
            {
                "task_id": task_version.task_id,
                "available": execution_available,
                "reason": None if execution_available else "runner_unavailable",
                "task_version": task_version.task_version,
                "language": task_version.language,
                "limits": {
                    "source_bytes": task_version.source_limit_bytes,
                    "run_timeout_ms": task_version.run_timeout_ms,
                },
                "public_tests": PublicTestCaseSerializer(public_tests, many=True).data,
            }
        )


class TaskAttemptDraftView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "checker_draft"

    @transaction.atomic
    def put(self, request, task_id: str):
        requested_version = request.data.get("task_version")
        task_version = _resolve_requested_version(task_id, requested_version)
        serializer = AttemptDraftSerializer(
            data=request.data,
            context={"checker_task_version": task_version},
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        attempt = (
            TaskAttempt.objects.select_for_update()
            .filter(
                user=request.user,
                checker_task_version=task_version,
            )
            .exclude(status=TaskAttempt.Status.ARCHIVED)
            .first()
        )

        if attempt is None:
            attempt = TaskAttempt(
                user=request.user,
                checker_task_version=task_version,
            )

        attempt.code_snapshot = data["source_code"]
        attempt.note = data.get("note", "")
        attempt.save()

        return Response(TaskAttemptSerializer(attempt).data, status=status.HTTP_200_OK)


class TaskAttemptListView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "checker_read"

    def get(self, request, task_id: str):
        attempts = (
            TaskAttempt.objects.filter(user=request.user, task_id=task_id)
            .select_related("checker_task_version")
            .prefetch_related("submissions")
        )
        paginator = AttemptHistoryPagination()
        page = paginator.paginate_queryset(attempts, request, view=self)
        return paginator.get_paginated_response(TaskAttemptSerializer(page, many=True).data)


class SubmissionCreateView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "checker_submit"

    def post(self, request, attempt_id):
        attempt = (
            TaskAttempt.objects.filter(pk=attempt_id, user=request.user)
            .select_related("checker_task_version")
            .first()
        )
        if attempt is None:
            raise Http404

        task_version = _resolve_requested_version(attempt.task_id, request.data.get("task_version"))
        if task_version.pk != attempt.checker_task_version_id:
            raise Conflict("Версия попытки устарела. Создайте черновик для текущей версии задачи.")

        serializer = SubmissionCreateSerializer(
            data=request.data,
            context={"checker_task_version": task_version},
        )
        serializer.is_valid(raise_exception=True)

        # No Submission row is created until a reviewed runner integration exists.
        raise CheckerUnavailable()


class SubmissionDetailView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "checker_poll"

    def get(self, request, submission_id):
        submission = (
            Submission.objects.filter(pk=submission_id, attempt__user=request.user)
            .select_related("attempt", "attempt__checker_task_version")
            .first()
        )
        if submission is None:
            raise Http404

        if not checker_execution_available() and submission.status not in Submission.TERMINAL_STATUSES:
            raise CheckerUnavailable()

        return Response(SubmissionSerializer(submission).data)
