from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import IntegrityError
from rest_framework import status
from rest_framework.test import APITestCase

from .models import LessonProgress


User = get_user_model()


class LessonProgressApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="alex", password="StrongPass123!")
        self.client.force_authenticate(user=self.user)

    def test_lesson_progress_post_is_idempotent(self):
        payload = {
            "course_slug": "base-cpp",
            "lesson_slug": "basics",
        }

        first_response = self.client.post(
            "/api/progress/lessons/",
            payload,
            format="json",
            HTTP_HOST="localhost",
        )
        second_response = self.client.post(
            "/api/progress/lessons/",
            payload,
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            LessonProgress.objects.filter(
                user=self.user,
                course_slug="base-cpp",
                lesson_slug="basics",
            ).count(),
            1,
        )

    def test_lesson_progress_recovers_from_create_race(self):
        payload = {
            "course_slug": "base-cpp",
            "lesson_slug": "basics",
        }
        original_update_or_create = LessonProgress.objects.update_or_create
        calls = {"count": 0}

        def update_or_create_once_with_race(*args, **kwargs):
            calls["count"] += 1

            if calls["count"] == 1:
                LessonProgress.objects.create(
                    user=self.user,
                    course_slug=payload["course_slug"],
                    lesson_slug=payload["lesson_slug"],
                )
                raise IntegrityError("duplicate key value violates unique constraint")

            return original_update_or_create(*args, **kwargs)

        LessonProgress.objects.update_or_create = update_or_create_once_with_race

        try:
            response = self.client.post(
                "/api/progress/lessons/",
                payload | {"is_completed": True},
                format="json",
                HTTP_HOST="localhost",
            )
        finally:
            LessonProgress.objects.update_or_create = original_update_or_create

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_completed"])
        self.assertEqual(LessonProgress.objects.count(), 1)
