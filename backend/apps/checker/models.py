import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxLengthValidator, MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


MAX_SOURCE_BYTES = 64 * 1024
MAX_NOTE_LENGTH = 2_000
MAX_RESULT_OUTPUT_BYTES = 64 * 1024
MAX_TEST_DATA_LENGTH = 64 * 1024

identifier_validator = RegexValidator(
    regex=r"^[a-z0-9][a-z0-9-]*$",
    message="Use lowercase letters, numbers and hyphens only.",
)


def utf8_size(value: str) -> int:
    return len(value.encode("utf-8"))


class CheckerTaskVersion(models.Model):
    class Language(models.TextChoices):
        CPP17 = "cpp17", "C++17"

    class ComparisonMode(models.TextChoices):
        EXACT = "exact", "Exact"
        TRIMMED_LINES = "trimmed_lines", "Trimmed lines"
        TOKENS = "tokens", "Tokens"

    IMMUTABLE_FIELDS = (
        "task_id",
        "task_version",
        "course_slug",
        "lesson_slug",
        "language",
        "comparison_mode",
        "source_limit_bytes",
        "compile_timeout_ms",
        "run_timeout_ms",
        "memory_limit_kb",
        "output_limit_bytes",
    )

    task_id = models.CharField(max_length=160, validators=[identifier_validator])
    task_version = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    course_slug = models.CharField(max_length=120, validators=[identifier_validator])
    lesson_slug = models.CharField(max_length=160, validators=[identifier_validator])
    language = models.CharField(max_length=16, choices=Language.choices, default=Language.CPP17)
    comparison_mode = models.CharField(
        max_length=32,
        choices=ComparisonMode.choices,
        default=ComparisonMode.EXACT,
    )
    is_enabled = models.BooleanField(default=False)
    source_limit_bytes = models.PositiveIntegerField(
        default=MAX_SOURCE_BYTES,
        validators=[MinValueValidator(1), MaxValueValidator(MAX_SOURCE_BYTES)],
    )
    compile_timeout_ms = models.PositiveIntegerField(
        default=10_000,
        validators=[MinValueValidator(100), MaxValueValidator(60_000)],
    )
    run_timeout_ms = models.PositiveIntegerField(
        default=2_000,
        validators=[MinValueValidator(100), MaxValueValidator(30_000)],
    )
    memory_limit_kb = models.PositiveIntegerField(
        default=128 * 1024,
        validators=[MinValueValidator(16 * 1024), MaxValueValidator(512 * 1024)],
    )
    output_limit_bytes = models.PositiveIntegerField(
        default=MAX_RESULT_OUTPUT_BYTES,
        validators=[MinValueValidator(1), MaxValueValidator(MAX_RESULT_OUTPUT_BYTES)],
    )
    enabled_at = models.DateTimeField(null=True, blank=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["task_id", "task_version"],
                name="unique_checker_task_version",
            ),
            models.UniqueConstraint(
                fields=["task_id"],
                condition=Q(is_enabled=True),
                name="unique_enabled_checker_task",
            ),
        ]
        indexes = [
            models.Index(fields=["task_id", "is_enabled"]),
            models.Index(fields=["course_slug", "lesson_slug"]),
        ]
        ordering = ["task_id", "-task_version"]

    def __str__(self) -> str:
        return f"{self.task_id} v{self.task_version}"

    @property
    def is_locked(self) -> bool:
        if self.enabled_at is not None or self.is_enabled:
            return True

        if not self.pk:
            return False

        return self.attempts.filter(submissions__isnull=False).exists()

    def clean(self):
        super().clean()

        original = None
        if self.pk:
            original = type(self).objects.filter(pk=self.pk).first()

        if original and original.is_locked:
            changed_fields = [
                field
                for field in self.IMMUTABLE_FIELDS
                if getattr(original, field) != getattr(self, field)
            ]
            if changed_fields:
                raise ValidationError(
                    {field: "Enabled or used task versions are immutable." for field in changed_fields}
                )

        if self.is_enabled:
            if not self.pk:
                raise ValidationError({"is_enabled": "Save the version and add tests before enabling it."})
            if not self.test_cases.exists():
                raise ValidationError({"is_enabled": "At least one test case is required."})

    def save(self, *args, **kwargs):
        self.full_clean()
        if self.is_enabled and self.enabled_at is None:
            self.enabled_at = timezone.now()
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.is_locked:
            raise ValidationError("Enabled or used task versions cannot be deleted.")
        return super().delete(*args, **kwargs)


class TaskAttempt(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        IN_PROGRESS = "in_progress", "In progress"
        ACCEPTED = "accepted", "Accepted"
        ARCHIVED = "archived", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="checker_attempts",
    )
    checker_task_version = models.ForeignKey(
        CheckerTaskVersion,
        on_delete=models.PROTECT,
        related_name="attempts",
    )
    task_id = models.CharField(max_length=160, editable=False)
    task_version = models.PositiveIntegerField(editable=False)
    course_slug = models.CharField(max_length=120, editable=False)
    lesson_slug = models.CharField(max_length=160, editable=False)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.DRAFT)
    code_snapshot = models.TextField(
        blank=True,
        validators=[MaxLengthValidator(MAX_SOURCE_BYTES)],
    )
    note = models.TextField(blank=True, validators=[MaxLengthValidator(MAX_NOTE_LENGTH)])
    result_summary = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "task_id", "task_version"],
                condition=~Q(status="archived"),
                name="unique_active_attempt_per_task_version",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "task_id", "task_version"]),
            models.Index(fields=["user", "status"]),
        ]
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"{self.user_id}: {self.task_id} v{self.task_version}"

    def clean(self):
        super().clean()

        if self.pk:
            original = type(self).objects.filter(pk=self.pk).only(
                "user_id",
                "checker_task_version_id",
            ).first()
            if original and (
                original.user_id != self.user_id
                or original.checker_task_version_id != self.checker_task_version_id
            ):
                raise ValidationError("Attempt owner and task version are immutable.")

        if self.checker_task_version_id:
            task_version = self.checker_task_version
            if utf8_size(self.code_snapshot) > task_version.source_limit_bytes:
                raise ValidationError({"code_snapshot": "Source code exceeds the task limit."})

    def save(self, *args, **kwargs):
        task_version = self.checker_task_version
        self.task_id = task_version.task_id
        self.task_version = task_version.task_version
        self.course_slug = task_version.course_slug
        self.lesson_slug = task_version.lesson_slug
        self.full_clean()
        return super().save(*args, **kwargs)


class Submission(models.Model):
    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        COMPILING = "compiling", "Compiling"
        RUNNING = "running", "Running"
        ACCEPTED = "accepted", "Accepted"
        WRONG_ANSWER = "wrong_answer", "Wrong answer"
        COMPILE_ERROR = "compile_error", "Compile error"
        RUNTIME_ERROR = "runtime_error", "Runtime error"
        TIME_LIMIT = "time_limit", "Time limit"
        OUTPUT_LIMIT = "output_limit", "Output limit"
        INTERNAL_ERROR = "internal_error", "Internal error"

    TERMINAL_STATUSES = frozenset(
        {
            Status.ACCEPTED,
            Status.WRONG_ANSWER,
            Status.COMPILE_ERROR,
            Status.RUNTIME_ERROR,
            Status.TIME_LIMIT,
            Status.OUTPUT_LIMIT,
            Status.INTERNAL_ERROR,
        }
    )
    ALLOWED_TRANSITIONS = {
        Status.QUEUED: {Status.COMPILING, Status.INTERNAL_ERROR},
        Status.COMPILING: {Status.RUNNING, Status.COMPILE_ERROR, Status.INTERNAL_ERROR},
        Status.RUNNING: TERMINAL_STATUSES,
    }
    IMMUTABLE_FIELDS = ("attempt_id", "language", "source_code")
    RESULT_FIELDS = (
        "status",
        "compiler_output",
        "runtime_output",
        "passed_tests",
        "failed_tests",
        "total_tests",
        "execution_time_ms",
        "memory_used_kb",
        "started_at",
        "finished_at",
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attempt = models.ForeignKey(TaskAttempt, on_delete=models.PROTECT, related_name="submissions")
    language = models.CharField(
        max_length=16,
        choices=CheckerTaskVersion.Language.choices,
        default=CheckerTaskVersion.Language.CPP17,
    )
    source_code = models.TextField(validators=[MaxLengthValidator(MAX_SOURCE_BYTES)])
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.QUEUED)
    compiler_output = models.TextField(blank=True)
    runtime_output = models.TextField(blank=True)
    passed_tests = models.PositiveIntegerField(default=0)
    failed_tests = models.PositiveIntegerField(default=0)
    total_tests = models.PositiveIntegerField(default=0)
    execution_time_ms = models.PositiveIntegerField(null=True, blank=True)
    memory_used_kb = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["attempt", "-created_at"]),
            models.Index(fields=["status", "created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.id}: {self.status}"

    def clean(self):
        super().clean()

        task_version = self.attempt.checker_task_version
        if utf8_size(self.source_code) > task_version.source_limit_bytes:
            raise ValidationError({"source_code": "Source code exceeds the task limit."})

        output_size = utf8_size(self.compiler_output) + utf8_size(self.runtime_output)
        if output_size > task_version.output_limit_bytes:
            raise ValidationError("Stored result output exceeds the task limit.")

        original = type(self).objects.filter(pk=self.pk).first() if self.pk else None
        if original is None:
            if self.status != self.Status.QUEUED:
                raise ValidationError({"status": "New submissions must start in the queued state."})
            return

        changed_immutable = [
            field for field in self.IMMUTABLE_FIELDS if getattr(original, field) != getattr(self, field)
        ]
        if changed_immutable:
            raise ValidationError(
                {field: "Submission snapshots are immutable." for field in changed_immutable}
            )

        if original.status in self.TERMINAL_STATUSES:
            changed_result = [
                field for field in self.RESULT_FIELDS if getattr(original, field) != getattr(self, field)
            ]
            if changed_result:
                raise ValidationError("Terminal submission results are immutable.")
            return

        if self.status != original.status:
            allowed = self.ALLOWED_TRANSITIONS.get(original.status, set())
            if self.status not in allowed:
                raise ValidationError({"status": "Invalid submission status transition."})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class TestCase(models.Model):
    task_version = models.ForeignKey(
        CheckerTaskVersion,
        on_delete=models.CASCADE,
        related_name="test_cases",
    )
    input = models.TextField(blank=True, validators=[MaxLengthValidator(MAX_TEST_DATA_LENGTH)])
    expected_output = models.TextField(validators=[MaxLengthValidator(MAX_TEST_DATA_LENGTH)])
    is_hidden = models.BooleanField(default=True)
    weight = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    explanation = models.TextField(blank=True, validators=[MaxLengthValidator(2_000)])
    position = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["task_version", "position"],
                name="unique_test_position_per_task_version",
            ),
        ]
        ordering = ["position", "id"]

    def __str__(self) -> str:
        visibility = "hidden" if self.is_hidden else "public"
        return f"{self.task_version} test {self.position} ({visibility})"

    def clean(self):
        super().clean()
        if self.task_version_id and self.task_version.is_locked:
            raise ValidationError("Tests for enabled or used task versions are immutable.")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.task_version.is_locked:
            raise ValidationError("Tests for enabled or used task versions cannot be deleted.")
        return super().delete(*args, **kwargs)
