from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import UserManager


class User(AbstractUser):
    phone = models.CharField(max_length=32, unique=True, blank=True, null=True)
    is_phone_verified = models.BooleanField(default=False)

    objects = UserManager()

    def __str__(self) -> str:
        return self.username

