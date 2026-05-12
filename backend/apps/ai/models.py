from django.conf import settings
from django.db import models


class AiDailyUsage(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_daily_usage",
    )
    date = models.DateField()
    requests_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "date"],
                name="unique_ai_daily_usage_per_user",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "date"]),
        ]
        ordering = ["-date", "user_id"]

    def __str__(self) -> str:
        return f"{self.user_id}: {self.date} = {self.requests_count}"
