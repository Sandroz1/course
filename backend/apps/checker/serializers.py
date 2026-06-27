from rest_framework import serializers

from .exceptions import PayloadTooLarge
from .models import MAX_NOTE_LENGTH, CheckerTaskVersion, Submission, TaskAttempt, TestCase, utf8_size


def validate_source_size(source_code: str, task_version: CheckerTaskVersion) -> str:
    if utf8_size(source_code) > task_version.source_limit_bytes:
        raise PayloadTooLarge()
    return source_code


class PublicTestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = ["input", "expected_output", "weight", "explanation", "position"]


class AttemptDraftSerializer(serializers.Serializer):
    task_version = serializers.IntegerField(min_value=1)
    source_code = serializers.CharField(allow_blank=True, trim_whitespace=False)
    note = serializers.CharField(
        allow_blank=True,
        required=False,
        max_length=MAX_NOTE_LENGTH,
        trim_whitespace=False,
    )

    def validate_source_code(self, value: str) -> str:
        return validate_source_size(value, self.context["checker_task_version"])


class TaskAttemptSerializer(serializers.ModelSerializer):
    submission_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        read_only=True,
        source="submissions",
    )

    class Meta:
        model = TaskAttempt
        fields = [
            "id",
            "task_id",
            "task_version",
            "course_slug",
            "lesson_slug",
            "status",
            "code_snapshot",
            "note",
            "result_summary",
            "submission_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class SubmissionCreateSerializer(serializers.Serializer):
    task_version = serializers.IntegerField(min_value=1)
    source_code = serializers.CharField(allow_blank=False, trim_whitespace=False)

    def validate_source_code(self, value: str) -> str:
        return validate_source_size(value, self.context["checker_task_version"])


class SubmissionSerializer(serializers.ModelSerializer):
    task_id = serializers.CharField(source="attempt.task_id", read_only=True)
    task_version = serializers.IntegerField(source="attempt.task_version", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "task_id",
            "task_version",
            "language",
            "status",
            "compiler_output",
            "runtime_output",
            "passed_tests",
            "failed_tests",
            "total_tests",
            "execution_time_ms",
            "memory_used_kb",
            "created_at",
            "started_at",
            "finished_at",
        ]
        read_only_fields = fields
