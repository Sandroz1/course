from django.contrib import admin

from .models import LessonProgress, TaskProgress, UserStudyState


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "course_slug", "lesson_slug", "is_completed", "last_opened_at", "updated_at")
    list_filter = ("course_slug", "is_completed")
    search_fields = ("user__username", "course_slug", "lesson_slug")


@admin.register(TaskProgress)
class TaskProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "task_id", "status", "updated_at")
    list_filter = ("status",)
    search_fields = ("user__username", "task_id")


@admin.register(UserStudyState)
class UserStudyStateAdmin(admin.ModelAdmin):
    list_display = ("user", "last_course_slug", "last_lesson_slug", "updated_at")
    search_fields = ("user__username", "last_course_slug", "last_lesson_slug")

