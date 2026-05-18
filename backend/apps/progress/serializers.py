import re

from rest_framework import serializers

from .models import LessonProgress, TaskProgress, UserStudyState


PROGRESS_IDENTIFIER_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]*$")


def validate_progress_identifier(value: str, label: str, max_length: int) -> str:
    if value == "":
        return value

    if len(value) > max_length:
        raise serializers.ValidationError(f"{label} is too long.")

    if not PROGRESS_IDENTIFIER_PATTERN.fullmatch(value):
        raise serializers.ValidationError(f"{label} must contain only lowercase letters, numbers and hyphens.")

    return value


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

    def validate_course_slug(self, value: str) -> str:
        return validate_progress_identifier(value, "course_slug", 120)

    def validate_lesson_slug(self, value: str) -> str:
        return validate_progress_identifier(value, "lesson_slug", 160)


class TaskProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskProgress
        fields = ["task_id", "status", "updated_at"]
        read_only_fields = ["updated_at"]
        extra_kwargs = {
            "status": {"required": False},
        }

    def validate_task_id(self, value: str) -> str:
        return validate_progress_identifier(value, "task_id", 160)


class UserStudyStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStudyState
        fields = ["last_course_slug", "last_lesson_slug", "updated_at"]
        read_only_fields = ["updated_at"]

    def validate_last_course_slug(self, value: str) -> str:
        return validate_progress_identifier(value, "last_course_slug", 120)

    def validate_last_lesson_slug(self, value: str) -> str:
        return validate_progress_identifier(value, "last_lesson_slug", 160)


class ProgressOverviewSerializer(serializers.Serializer):
    state = UserStudyStateSerializer(allow_null=True)
    lessons = LessonProgressSerializer(many=True)
    tasks = TaskProgressSerializer(many=True)
