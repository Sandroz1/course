from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db import models

from .managers import UserManager


class User(AbstractUser):
    phone = models.CharField(max_length=32, unique=True, blank=True, null=True)
    is_phone_verified = models.BooleanField(default=False)
    auth_token_version = models.PositiveIntegerField(default=0)

    objects = UserManager()

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(phone__isnull=True) | models.Q(is_phone_verified=True),
                name="phone_requires_verification",
            ),
        ]

    def __str__(self) -> str:
        return self.username


class PhoneVerificationCode(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="phone_verification_codes",
    )
    phone = models.CharField(max_length=32)
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts_count = models.PositiveSmallIntegerField(default=0)
    is_used = models.BooleanField(default=False)
    sent_ip = models.GenericIPAddressField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "phone", "created_at"]),
            models.Index(fields=["expires_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.user_id}: {self.phone}"
