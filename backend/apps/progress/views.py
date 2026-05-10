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
        serializer.save()

        return Response(serializer.data)


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

        progress, _created = LessonProgress.objects.update_or_create(
            user=request.user,
            course_slug=data["course_slug"],
            lesson_slug=data["lesson_slug"],
            defaults=defaults,
        )

        return Response(LessonProgressSerializer(progress).data)


class TaskProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TaskProgressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        progress, _created = TaskProgress.objects.update_or_create(
            user=request.user,
            task_id=data["task_id"],
            defaults={
                "status": data.get("status", TaskProgress.Status.IN_PROGRESS),
            },
        )

        return Response(TaskProgressSerializer(progress).data)

