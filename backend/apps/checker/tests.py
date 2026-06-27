from django.contrib.auth import get_user_model
from django.contrib.admin.sites import AdminSite
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.test import RequestFactory, TestCase as DjangoTestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.progress.models import TaskProgress

from .admin import CheckerTaskVersionAdmin, TaskAttemptAdmin, TestCaseAdmin
from .models import CheckerTaskVersion, Submission, TaskAttempt, TestCase as CheckerTestCase


User = get_user_model()


def create_task_version(
    *,
    task_id: str = "00-03-input-age",
    task_version: int = 1,
    enable: bool = True,
    source_limit_bytes: int = 64 * 1024,
    hidden_output: str | None = None,
) -> CheckerTaskVersion:
    version = CheckerTaskVersion.objects.create(
        task_id=task_id,
        task_version=task_version,
        course_slug="oop-cpp",
        lesson_slug="basics",
        comparison_mode=CheckerTaskVersion.ComparisonMode.TOKENS,
        source_limit_bytes=source_limit_bytes,
    )
    CheckerTestCase.objects.create(
        task_version=version,
        input="18\n",
        expected_output="18\n",
        is_hidden=False,
        explanation="Выведено считанное значение.",
        position=0,
    )
    if hidden_output is not None:
        CheckerTestCase.objects.create(
            task_version=version,
            input="100\n",
            expected_output=hidden_output,
            is_hidden=True,
            explanation="private explanation",
            position=1,
        )
    if enable:
        version.is_enabled = True
        version.save()
        version.refresh_from_db()
    return version


class CheckerModelTests(DjangoTestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="checker-user", password="StrongPass123!")

    def test_enabled_version_and_tests_are_immutable(self):
        version = create_task_version()
        test_case = version.test_cases.get(position=0)

        version.comparison_mode = CheckerTaskVersion.ComparisonMode.EXACT
        with self.assertRaises(ValidationError):
            version.save()

        test_case.expected_output = "changed\n"
        with self.assertRaises(ValidationError):
            test_case.save()
        with self.assertRaises(ValidationError):
            test_case.delete()

    def test_first_submission_locks_never_enabled_version(self):
        version = create_task_version(enable=False)
        attempt = TaskAttempt.objects.create(
            user=self.user,
            checker_task_version=version,
            code_snapshot="int main() { return 0; }",
        )
        Submission.objects.create(
            attempt=attempt,
            source_code=attempt.code_snapshot,
        )

        version.lesson_slug = "classes"
        with self.assertRaises(ValidationError):
            version.save()

    def test_only_one_non_archived_attempt_per_user_and_version(self):
        version = create_task_version()
        TaskAttempt.objects.create(
            user=self.user,
            checker_task_version=version,
            code_snapshot="int main() { return 0; }",
        )

        with self.assertRaises(ValidationError):
            TaskAttempt.objects.create(
                user=self.user,
                checker_task_version=version,
                code_snapshot="int main() { return 1; }",
            )

    def test_submission_snapshot_and_terminal_result_are_immutable(self):
        version = create_task_version()
        attempt = TaskAttempt.objects.create(
            user=self.user,
            checker_task_version=version,
            code_snapshot="int main() { return 0; }",
        )
        submission = Submission.objects.create(
            attempt=attempt,
            source_code=attempt.code_snapshot,
        )

        submission.status = Submission.Status.COMPILING
        submission.save()
        submission.status = Submission.Status.RUNNING
        submission.save()
        submission.status = Submission.Status.PASSED
        submission.passed_tests = 1
        submission.total_tests = 1
        submission.save()

        submission.source_code = "int main() { return 1; }"
        with self.assertRaises(ValidationError):
            submission.save()

        submission.refresh_from_db()
        submission.runtime_output = "changed"
        with self.assertRaises(ValidationError):
            submission.save()

    def test_submission_must_start_queued(self):
        version = create_task_version()
        attempt = TaskAttempt.objects.create(
            user=self.user,
            checker_task_version=version,
            code_snapshot="int main() { return 0; }",
        )

        with self.assertRaises(ValidationError):
            Submission.objects.create(
                attempt=attempt,
                source_code=attempt.code_snapshot,
                status=Submission.Status.PASSED,
            )

    def test_admin_records_and_locked_definitions_cannot_be_bulk_deleted(self):
        request = RequestFactory().get("/admin/")
        request.user = User.objects.create_superuser(
            username="checker-admin",
            password="StrongPass123!",
        )
        site = AdminSite()

        version_admin = CheckerTaskVersionAdmin(CheckerTaskVersion, site)
        test_case_admin = TestCaseAdmin(CheckerTestCase, site)
        attempt_admin = TaskAttemptAdmin(TaskAttempt, site)

        self.assertNotIn("delete_selected", version_admin.get_actions(request))
        self.assertNotIn("delete_selected", test_case_admin.get_actions(request))
        self.assertFalse(attempt_admin.has_add_permission(request))
        self.assertFalse(attempt_admin.has_delete_permission(request))
        self.assertEqual(
            set(attempt_admin.get_readonly_fields(request)),
            {field.name for field in TaskAttempt._meta.fields},
        )


class CheckerApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="alex", password="StrongPass123!")
        self.other_user = User.objects.create_user(username="maria", password="StrongPass123!")
        self.version = create_task_version(hidden_output="100\n")

    def authenticate(self, user=None):
        self.client.force_authenticate(user=user or self.user)

    def save_draft(self, *, user=None, source_code="int main() { return 0; }"):
        self.authenticate(user)
        return self.client.put(
            f"/api/checker/tasks/{self.version.task_id}/attempt/",
            {
                "task_version": self.version.task_version,
                "source_code": source_code,
                "note": "first draft",
            },
            format="json",
            HTTP_HOST="localhost",
        )

    def test_guest_availability_reports_runner_unavailable_without_hidden_tests(self):
        response = self.client.get(
            f"/api/checker/tasks/{self.version.task_id}/availability/",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["available"])
        self.assertEqual(response.data["reason"], "runner_unavailable")
        self.assertEqual(response.data["task_version"], self.version.task_version)
        self.assertEqual(len(response.data["public_tests"]), 1)
        self.assertNotIn("is_hidden", response.data["public_tests"][0])
        self.assertNotIn("100", str(response.data))
        self.assertNotIn("private explanation", str(response.data))

    def test_draft_save_is_idempotent_and_uses_server_slugs(self):
        first_response = self.save_draft()
        second_response = self.save_draft(source_code="int main() { return 1; }")

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(first_response.data["id"], second_response.data["id"])
        self.assertEqual(second_response.data["course_slug"], self.version.course_slug)
        self.assertEqual(second_response.data["lesson_slug"], self.version.lesson_slug)
        self.assertEqual(TaskAttempt.objects.filter(user=self.user).count(), 1)

    def test_draft_can_save_empty_source(self):
        response = self.save_draft(source_code="")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["code_snapshot"], "")

    def test_attempt_list_returns_only_current_user_attempts(self):
        self.save_draft()
        TaskAttempt.objects.create(
            user=self.other_user,
            checker_task_version=self.version,
            code_snapshot="int main() { return 2; }",
        )

        response = self.client.get(
            f"/api/checker/tasks/{self.version.task_id}/attempts/",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["task_id"], self.version.task_id)
        self.assertEqual(response.data["results"][0]["submission_ids"], [])

    def test_foreign_attempt_and_submission_return_404(self):
        other_attempt = TaskAttempt.objects.create(
            user=self.other_user,
            checker_task_version=self.version,
            code_snapshot="int main() { return 0; }",
        )
        other_submission = Submission.objects.create(
            attempt=other_attempt,
            source_code=other_attempt.code_snapshot,
        )
        other_submission.status = Submission.Status.SYSTEM_ERROR
        other_submission.save()
        self.authenticate()

        create_response = self.client.post(
            f"/api/checker/attempts/{other_attempt.id}/submissions/",
            {
                "task_version": self.version.task_version,
                "source_code": other_attempt.code_snapshot,
            },
            format="json",
            HTTP_HOST="localhost",
        )
        detail_response = self.client.get(
            f"/api/checker/submissions/{other_submission.id}/",
            HTTP_HOST="localhost",
        )

        self.assertEqual(create_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_stale_task_version_returns_409(self):
        self.save_draft()
        self.version.is_enabled = False
        self.version.save()
        current_version = create_task_version(
            task_id=self.version.task_id,
            task_version=2,
        )

        response = self.client.put(
            f"/api/checker/tasks/{self.version.task_id}/attempt/",
            {
                "task_version": 1,
                "source_code": "int main() { return 0; }",
            },
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(current_version.task_version, 2)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_source_size_limit_returns_413(self):
        limited_version = create_task_version(
            task_id="limited-source",
            source_limit_bytes=8,
        )
        self.authenticate()

        response = self.client.put(
            f"/api/checker/tasks/{limited_version.task_id}/attempt/",
            {
                "task_version": limited_version.task_version,
                "source_code": "123456789",
            },
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        self.assertFalse(TaskAttempt.objects.filter(task_id=limited_version.task_id).exists())

    def test_submission_returns_503_without_creating_submission_or_progress(self):
        draft_response = self.save_draft()
        attempt = TaskAttempt.objects.get(pk=draft_response.data["id"])
        self.authenticate()

        response = self.client.post(
            f"/api/checker/attempts/{attempt.id}/submissions/",
            {
                "task_version": self.version.task_version,
                "source_code": attempt.code_snapshot,
            },
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(Submission.objects.count(), 0)
        self.assertFalse(TaskProgress.objects.filter(user=self.user, task_id=self.version.task_id).exists())

    def test_checker_enabled_task_cannot_be_marked_solved_manually(self):
        self.authenticate()

        response = self.client.post(
            "/api/progress/tasks/",
            {
                "task_id": self.version.task_id,
                "status": TaskProgress.Status.SOLVED,
            },
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data["fields"])
        self.assertFalse(TaskProgress.objects.filter(user=self.user, task_id=self.version.task_id).exists())

    def test_active_submission_status_is_not_exposed_without_runner(self):
        attempt = TaskAttempt.objects.create(
            user=self.user,
            checker_task_version=self.version,
            code_snapshot="int main() { return 0; }",
        )
        submission = Submission.objects.create(
            attempt=attempt,
            source_code=attempt.code_snapshot,
        )
        self.authenticate()

        response = self.client.get(
            f"/api/checker/submissions/{submission.id}/",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertNotIn("queued", str(response.data))
