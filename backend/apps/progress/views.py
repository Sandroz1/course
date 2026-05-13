import time

from django.db import IntegrityError, OperationalError
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LessonProgress, TaskProgress, UserStudyState
from .serializers import (
    LessonProgressSerializer,
    ProgressOverviewSerializer,
    TaskProgressSerializer,
    UserStudyStateSerializer,
)

DATABASE_LOCK_RETRY_DELAYS = (0.05, 0.15, 0.3)


def _is_database_locked(error: OperationalError) -> bool:
    message = str(error).lower()
    return "database is locked" in message or "database table is locked" in message


def _save_existing_lesson_progress(user, data, defaults):
    progress = LessonProgress.objects.get(
        user=user,
        course_slug=data["course_slug"],
        lesson_slug=data["lesson_slug"],
    )

    for field, value in defaults.items():
        setattr(progress, field, value)

    progress.save(update_fields=[*defaults.keys(), "updated_at"])
    return progress


def _upsert_lesson_progress(user, data, defaults):
    attempts = len(DATABASE_LOCK_RETRY_DELAYS) + 1

    for attempt in range(attempts):
        try:
            progress, _created = LessonProgress.objects.update_or_create(
                user=user,
                course_slug=data["course_slug"],
                lesson_slug=data["lesson_slug"],
                defaults=defaults,
            )
            return progress
        except IntegrityError:
            if attempt < len(DATABASE_LOCK_RETRY_DELAYS):
                time.sleep(DATABASE_LOCK_RETRY_DELAYS[attempt])
                continue

            return _save_existing_lesson_progress(user, data, defaults)
        except OperationalError as exc:
            if _is_database_locked(exc) and attempt < len(DATABASE_LOCK_RETRY_DELAYS):
                time.sleep(DATABASE_LOCK_RETRY_DELAYS[attempt])
                continue

            raise

    return _save_existing_lesson_progress(user, data, defaults)


class ProgressOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        state = UserStudyState.objects.filter(user=request.user).first()
        lessons = LessonProgress.objects.filter(user=request.user)
        tasks = TaskProgress.objects.filter(user=request.user)

        serializer = ProgressOverviewSerializer(
            {
                "state": state,
                "lessons": lessons,
                "tasks": tasks,
            }
        )

        return Response(serializer.data)


class StudyStateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        state, _created = UserStudyState.objects.get_or_create(user=request.user)
        serializer = UserStudyStateSerializer(state, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        changed_fields = []

        for field, value in serializer.validated_data.items():
            if getattr(state, field) != value:
                setattr(state, field, value)
                changed_fields.append(field)

        if changed_fields:
            state.save(update_fields=[*changed_fields, "updated_at"])

        return Response(UserStudyStateSerializer(state).data)


class LessonProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LessonProgressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        defaults = {
            "last_opened_at": data.get("last_opened_at") or timezone.now(),
        }

        if "is_completed" in data:
            defaults["is_completed"] = data["is_completed"]

        progress = _upsert_lesson_progress(request.user, data, defaults)

        return Response(LessonProgressSerializer(progress).data)


class TaskProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TaskProgressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        if "status" not in data:
            progress, _created = TaskProgress.objects.get_or_create(
                user=request.user,
                task_id=data["task_id"],
                defaults={"status": TaskProgress.Status.NOT_STARTED},
            )

            return Response(TaskProgressSerializer(progress).data)

        progress, _created = TaskProgress.objects.update_or_create(
            user=request.user,
            task_id=data["task_id"],
            defaults={
                "status": data["status"],
            },
        )

        return Response(TaskProgressSerializer(progress).data)
