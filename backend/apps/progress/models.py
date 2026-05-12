from django.conf import settings
from django.db import models


class LessonProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lesson_progress",
    )
    course_slug = models.CharField(max_length=120)
    lesson_slug = models.CharField(max_length=160)
    is_completed = models.BooleanField(default=False)
    last_opened_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "course_slug", "lesson_slug"],
                name="unique_lesson_progress_per_user",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "course_slug"]),
            models.Index(fields=["user", "lesson_slug"]),
        ]
        ordering = ["course_slug", "lesson_slug"]

    def __str__(self) -> str:
        return f"{self.user_id}: {self.course_slug}/{self.lesson_slug}"


class TaskProgress(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Not started"
        IN_PROGRESS = "in_progress", "In progress"
        SOLVED = "solved", "Solved"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="task_progress",
    )
    task_id = models.CharField(max_length=160)
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.NOT_STARTED,
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "task_id"],
                name="unique_task_progress_per_user",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "task_id"]),
            models.Index(fields=["user", "status"]),
        ]
        ordering = ["task_id"]

    def __str__(self) -> str:
        return f"{self.user_id}: {self.task_id} = {self.status}"


class UserStudyState(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_state",
    )
    last_course_slug = models.CharField(max_length=120, blank=True)
    last_lesson_slug = models.CharField(max_length=160, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user_id"]

    def __str__(self) -> str:
        return f"{self.user_id}: {self.last_course_slug}/{self.last_lesson_slug}"

