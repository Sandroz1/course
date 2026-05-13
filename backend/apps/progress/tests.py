from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import IntegrityError
from rest_framework import status
from rest_framework.test import APITestCase

from .models import LessonProgress, TaskProgress, UserStudyState


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

    def test_lesson_progress_open_does_not_clear_completed(self):
        LessonProgress.objects.create(
            user=self.user,
            course_slug="base-cpp",
            lesson_slug="basics",
            is_completed=True,
        )

        response = self.client.post(
            "/api/progress/lessons/",
            {
                "course_slug": "base-cpp",
                "lesson_slug": "basics",
            },
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_completed"])
        self.assertTrue(
            LessonProgress.objects.get(
                user=self.user,
                course_slug="base-cpp",
                lesson_slug="basics",
            ).is_completed,
        )


class ProgressOverviewApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="alex", password="StrongPass123!")
        self.other_user = User.objects.create_user(username="maria", password="StrongPass123!")
        self.client.force_authenticate(user=self.user)

    def test_progress_overview_is_read_only(self):
        response = self.client.get("/api/progress/", HTTP_HOST="localhost")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(UserStudyState.objects.count(), 0)
        self.assertEqual(LessonProgress.objects.count(), 0)
        self.assertEqual(TaskProgress.objects.count(), 0)

    def test_progress_overview_returns_only_current_user_progress(self):
        TaskProgress.objects.create(
            user=self.user,
            task_id="cpp-oop-intro",
            status=TaskProgress.Status.IN_PROGRESS,
        )
        TaskProgress.objects.create(
            user=self.other_user,
            task_id="private-task",
            status=TaskProgress.Status.SOLVED,
        )

        response = self.client.get("/api/progress/", HTTP_HOST="localhost")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["tasks"]), 1)
        self.assertEqual(response.data["tasks"][0]["task_id"], "cpp-oop-intro")
        self.assertEqual(response.data["tasks"][0]["status"], TaskProgress.Status.IN_PROGRESS)


class StudyStateApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="alex", password="StrongPass123!")
        self.client.force_authenticate(user=self.user)

    def test_study_state_patch_same_values_does_not_write(self):
        state = UserStudyState.objects.create(
            user=self.user,
            last_course_slug="oop-cpp",
            last_lesson_slug="classes",
        )
        updated_at = state.updated_at

        response = self.client.patch(
            "/api/progress/state/",
            {
                "last_course_slug": "oop-cpp",
                "last_lesson_slug": "classes",
            },
            format="json",
            HTTP_HOST="localhost",
        )
        state.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(state.updated_at, updated_at)


class TaskProgressApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="alex", password="StrongPass123!")
        self.client.force_authenticate(user=self.user)

    def test_task_progress_without_status_does_not_mark_in_progress(self):
        payload = {"task_id": "cpp-oop-intro"}

        first_response = self.client.post(
            "/api/progress/tasks/",
            payload,
            format="json",
            HTTP_HOST="localhost",
        )
        second_response = self.client.post(
            "/api/progress/tasks/",
            payload,
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(first_response.data["status"], TaskProgress.Status.NOT_STARTED)
        self.assertEqual(
            TaskProgress.objects.filter(user=self.user, task_id="cpp-oop-intro").count(),
            1,
        )

    def test_task_progress_without_status_does_not_overwrite_solved(self):
        TaskProgress.objects.create(
            user=self.user,
            task_id="cpp-oop-intro",
            status=TaskProgress.Status.SOLVED,
        )

        response = self.client.post(
            "/api/progress/tasks/",
            {"task_id": "cpp-oop-intro"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], TaskProgress.Status.SOLVED)
        self.assertEqual(
            TaskProgress.objects.get(user=self.user, task_id="cpp-oop-intro").status,
            TaskProgress.Status.SOLVED,
        )

    def test_task_progress_explicit_status_updates(self):
        started_response = self.client.post(
            "/api/progress/tasks/",
            {
                "task_id": "cpp-oop-intro",
                "status": TaskProgress.Status.IN_PROGRESS,
            },
            format="json",
            HTTP_HOST="localhost",
        )
        solved_response = self.client.post(
            "/api/progress/tasks/",
            {
                "task_id": "cpp-oop-intro",
                "status": TaskProgress.Status.SOLVED,
            },
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(started_response.status_code, status.HTTP_200_OK)
        self.assertEqual(started_response.data["status"], TaskProgress.Status.IN_PROGRESS)
        self.assertEqual(solved_response.status_code, status.HTTP_200_OK)
        self.assertEqual(solved_response.data["status"], TaskProgress.Status.SOLVED)
        self.assertEqual(TaskProgress.objects.count(), 1)

    def test_anonymous_user_does_not_create_task_progress(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(
            "/api/progress/tasks/",
            {
                "task_id": "cpp-oop-intro",
                "status": TaskProgress.Status.IN_PROGRESS,
            },
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
        self.assertEqual(TaskProgress.objects.count(), 0)
