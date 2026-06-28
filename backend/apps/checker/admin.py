from django.contrib import admin

from .models import CheckerTaskVersion, Submission, TaskAttempt, TestCase


class TestCaseInline(admin.StackedInline):
    model = TestCase
    extra = 0

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.is_locked:
            return ("input", "expected_output", "is_hidden", "weight", "explanation", "position")
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
        "enabled_at",
    )
    list_filter = ("is_enabled", "language", "comparison_mode", "course_slug")
    search_fields = ("task_id", "course_slug", "lesson_slug")
    readonly_fields = ("enabled_at", "created_at", "updated_at")

    def get_readonly_fields(self, request, obj=None):
        fields = list(super().get_readonly_fields(request, obj))
        if obj and obj.is_locked:
            fields.extend(CheckerTaskVersion.IMMUTABLE_FIELDS)
        return tuple(fields)

    def has_delete_permission(self, request, obj=None):
        if obj and obj.is_locked:
            return False
        return super().has_delete_permission(request, obj)


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
    list_display = ("id", "attempt", "status", "language", "created_at", "finished_at")
    list_filter = ("status", "language")
    search_fields = ("id", "attempt__task_id", "attempt__user__username")

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
    list_display = ("task_version", "position", "is_hidden", "weight")
    list_filter = ("is_hidden", "task_version__language")
    search_fields = ("task_version__task_id",)

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.task_version.is_locked:
            return ("task_version", "input", "expected_output", "is_hidden", "weight", "explanation", "position")
        return ()

    def has_delete_permission(self, request, obj=None):
        if obj and obj.task_version.is_locked:
            return False
        return super().has_delete_permission(request, obj)
