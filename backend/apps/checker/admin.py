from django.contrib import admin
from django.db.models import Count, Q

from .models import CheckerTaskVersion, Submission, TaskAttempt, TestCase


class TestCaseInline(admin.StackedInline):
    model = TestCase
    extra = 0
    fields = (
        "position",
        "is_hidden",
        "weight",
        "input",
        "expected_output",
        "explanation",
    )
    ordering = ("position", "id")
    show_change_link = True

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.is_locked:
            return (
                "input",
                "expected_output",
                "is_hidden",
                "weight",
                "explanation",
                "position",
            )
        return ()

    def has_add_permission(self, request, obj=None):
        return bool(obj and not obj.is_locked)

    def has_delete_permission(self, request, obj=None):
        return bool(obj and not obj.is_locked)


@admin.register(CheckerTaskVersion)
class CheckerTaskVersionAdmin(admin.ModelAdmin):
    actions = None
    inlines = (TestCaseInline,)
    list_display = (
        "task_id",
        "task_version",
        "course_slug",
        "lesson_slug",
        "language",
        "is_enabled",
        "readiness",
        "test_count",
        "public_test_count",
        "hidden_test_count",
        "enabled_at",
    )
    list_filter = ("is_enabled", "language", "comparison_mode", "course_slug")
    search_fields = ("task_id", "course_slug", "lesson_slug")
    readonly_fields = ("readiness", "enabled_at", "created_at", "updated_at")
    ordering = ("task_id", "-task_version")
    fieldsets = (
        (
            "Task identity",
            {
                "fields": (
                    "task_id",
                    "task_version",
                    "course_slug",
                    "lesson_slug",
                    "readiness",
                )
            },
        ),
        (
            "Checker contract",
            {
                "fields": (
                    "language",
                    "comparison_mode",
                    "source_limit_bytes",
                    "compile_timeout_ms",
                    "run_timeout_ms",
                    "memory_limit_kb",
                    "output_limit_bytes",
                )
            },
        ),
        ("Publication", {"fields": ("is_enabled", "enabled_at")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .annotate(
                _test_count=Count("test_cases"),
                _public_test_count=Count(
                    "test_cases",
                    filter=Q(test_cases__is_hidden=False),
                ),
                _hidden_test_count=Count(
                    "test_cases",
                    filter=Q(test_cases__is_hidden=True),
                ),
            )
        )

    def get_readonly_fields(self, request, obj=None):
        fields = list(super().get_readonly_fields(request, obj))
        if obj and obj.is_locked:
            fields.extend(CheckerTaskVersion.IMMUTABLE_FIELDS)
        return tuple(fields)

    def has_delete_permission(self, request, obj=None):
        if obj and obj.is_locked:
            return False
        return super().has_delete_permission(request, obj)

    def _count(self, obj, attr: str, *, hidden: bool | None = None) -> int:
        annotated = getattr(obj, attr, None)
        if annotated is not None:
            return annotated
        queryset = obj.test_cases.all()
        if hidden is not None:
            queryset = queryset.filter(is_hidden=hidden)
        return queryset.count()

    @admin.display(description="Readiness")
    def readiness(self, obj):
        if obj is None:
            return "save before adding tests"
        if obj.is_enabled:
            return "enabled"
        if self._count(obj, "_test_count") == 0:
            return "missing tests"
        if self._count(obj, "_public_test_count", hidden=False) == 0:
            return "hidden-only draft"
        return "draft ready"

    @admin.display(description="Tests", ordering="_test_count")
    def test_count(self, obj):
        return self._count(obj, "_test_count")

    @admin.display(description="Public", ordering="_public_test_count")
    def public_test_count(self, obj):
        return self._count(obj, "_public_test_count", hidden=False)

    @admin.display(description="Hidden", ordering="_hidden_test_count")
    def hidden_test_count(self, obj):
        return self._count(obj, "_hidden_test_count", hidden=True)


@admin.register(TaskAttempt)
class TaskAttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "task_id", "task_version", "status", "updated_at")
    list_filter = ("status", "course_slug")
    search_fields = ("user__username", "task_id", "course_slug", "lesson_slug")

    def get_readonly_fields(self, request, obj=None):
        return tuple(field.name for field in self.model._meta.fields)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "task_id",
        "task_version",
        "status",
        "language",
        "created_at",
        "finished_at",
    )
    list_filter = ("status", "language")
    search_fields = ("id", "attempt__task_id", "attempt__user__username")
    ordering = ("-created_at",)

    @admin.display(description="User", ordering="attempt__user__username")
    def user(self, obj):
        return obj.attempt.user

    @admin.display(description="Task", ordering="attempt__task_id")
    def task_id(self, obj):
        return obj.attempt.task_id

    @admin.display(description="Version", ordering="attempt__task_version")
    def task_version(self, obj):
        return obj.attempt.task_version

    def get_readonly_fields(self, request, obj=None):
        return tuple(field.name for field in self.model._meta.fields)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return bool(obj) and super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(TestCase)
class TestCaseAdmin(admin.ModelAdmin):
    actions = None
    fields = (
        "task_version",
        "position",
        "is_hidden",
        "weight",
        "input",
        "expected_output",
        "explanation",
    )
    list_display = ("task_id", "task_version_number", "position", "visibility", "weight")
    list_filter = ("is_hidden", "task_version__is_enabled", "task_version__language")
    search_fields = ("task_version__task_id", "task_version__course_slug", "task_version__lesson_slug")
    ordering = ("task_version__task_id", "task_version__task_version", "position", "id")

    @admin.display(description="Task", ordering="task_version__task_id")
    def task_id(self, obj):
        return obj.task_version.task_id

    @admin.display(description="Version", ordering="task_version__task_version")
    def task_version_number(self, obj):
        return obj.task_version.task_version

    @admin.display(description="Visibility", ordering="is_hidden")
    def visibility(self, obj):
        return "hidden" if obj.is_hidden else "public"

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.task_version.is_locked:
            return (
                "task_version",
                "input",
                "expected_output",
                "is_hidden",
                "weight",
                "explanation",
                "position",
            )
        return ()

    def has_delete_permission(self, request, obj=None):
        if obj and obj.task_version.is_locked:
            return False
        return super().has_delete_permission(request, obj)
