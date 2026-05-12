from rest_framework import serializers

from .models import LessonProgress, TaskProgress, UserStudyState


class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonProgress
        fields = [
            "course_slug",
            "lesson_slug",
            "is_completed",
            "last_opened_at",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]
        extra_kwargs = {
            "is_completed": {"required": False},
            "last_opened_at": {"required": False, "allow_null": True},
        }


class TaskProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskProgress
        fields = ["task_id", "status", "updated_at"]
        read_only_fields = ["updated_at"]
        extra_kwargs = {
            "status": {"required": False},
        }


class UserStudyStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStudyState
        fields = ["last_course_slug", "last_lesson_slug", "updated_at"]
        read_only_fields = ["updated_at"]


class ProgressOverviewSerializer(serializers.Serializer):
    state = UserStudyStateSerializer(allow_null=True)
    lessons = LessonProgressSerializer(many=True)
    tasks = TaskProgressSerializer(many=True)

