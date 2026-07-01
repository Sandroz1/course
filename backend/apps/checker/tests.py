from uuid import UUID

from django.contrib.auth import get_user_model
from django.contrib.admin.sites import AdminSite
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.test import RequestFactory, TestCase as DjangoTestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.progress.models import TaskProgress

from .admin import CheckerTaskVersionAdmin, TaskAttemptAdmin, TestCaseAdmin, TestCaseInline
from .exceptions import CheckerUnavailable
from .models import CheckerTaskVersion, Submission, TaskAttempt, TestCase as CheckerTestCase
from .runner.contracts import RunnerDispatch, RunnerHealth, RunnerJob, RunnerLimits, RunnerResult, RunnerTestCase
from .runner.disabled import DisabledRunner, DisabledRunnerUnavailable
from .runner.mapping import RUNNER_RESULT_TO_SUBMISSION_STATUS, map_runner_status_to_submission_status
from .serializers import PublicTestCaseSerializer
from .services import create_checker_submission


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
        submission.status = Submission.Status.ACCEPTED
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
                status=Submission.Status.ACCEPTED,
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

    def test_checker_task_version_admin_readiness_counts_tests(self):
        request = RequestFactory().get("/admin/")
        request.user = User.objects.create_superuser(
            username="checker-admin-readiness",
            password="StrongPass123!",
        )
        version_admin = CheckerTaskVersionAdmin(CheckerTaskVersion, AdminSite())
        draft_version = CheckerTaskVersion.objects.create(
            task_id="admin-readiness",
            task_version=1,
            course_slug="oop-cpp",
            lesson_slug="basics",
        )

        self.assertEqual(version_admin.readiness(None), "save before adding tests")
        self.assertEqual(version_admin.readiness(draft_version), "missing tests")
        self.assertEqual(version_admin.test_count(draft_version), 0)
        self.assertEqual(version_admin.public_test_count(draft_version), 0)
        self.assertEqual(version_admin.hidden_test_count(draft_version), 0)

        CheckerTestCase.objects.create(
            task_version=draft_version,
            input="42\n",
            expected_output="42\n",
            is_hidden=True,
            position=0,
        )
        self.assertEqual(version_admin.readiness(draft_version), "hidden-only draft")
        self.assertEqual(version_admin.test_count(draft_version), 1)
        self.assertEqual(version_admin.public_test_count(draft_version), 0)
        self.assertEqual(version_admin.hidden_test_count(draft_version), 1)

        CheckerTestCase.objects.create(
            task_version=draft_version,
            input="18\n",
            expected_output="18\n",
            is_hidden=False,
            position=1,
        )
        self.assertEqual(version_admin.readiness(draft_version), "draft ready")
        self.assertEqual(version_admin.test_count(draft_version), 2)
        self.assertEqual(version_admin.public_test_count(draft_version), 1)
        self.assertEqual(version_admin.hidden_test_count(draft_version), 1)

        draft_version.is_enabled = True
        draft_version.save()
        self.assertEqual(version_admin.readiness(draft_version), "enabled")

        queryset_version = version_admin.get_queryset(request).get(pk=draft_version.pk)
        self.assertEqual(version_admin.test_count(queryset_version), 2)
        self.assertEqual(version_admin.public_test_count(queryset_version), 1)
        self.assertEqual(version_admin.hidden_test_count(queryset_version), 1)

    def test_locked_test_case_inline_is_readonly(self):
        request = RequestFactory().get("/admin/")
        request.user = User.objects.create_superuser(
            username="checker-inline-admin",
            password="StrongPass123!",
        )
        site = AdminSite()
        inline = TestCaseInline(CheckerTaskVersion, site)
        locked_version = create_task_version(task_id="inline-locked")
        draft_version = create_task_version(task_id="inline-draft", enable=False)

        self.assertFalse(inline.has_add_permission(request, locked_version))
        self.assertFalse(inline.has_delete_permission(request, locked_version))
        self.assertEqual(
            set(inline.get_readonly_fields(request, locked_version)),
            {"input", "expected_output", "is_hidden", "weight", "explanation", "position"},
        )
        self.assertTrue(inline.has_add_permission(request, draft_version))

    def test_public_test_case_serializer_redacts_hidden_payload_if_called_directly(self):
        version = create_task_version(task_id="serializer-redaction", hidden_output="secret\n")
        public_case = version.test_cases.get(is_hidden=False)
        hidden_case = version.test_cases.get(is_hidden=True)

        public_data = PublicTestCaseSerializer(public_case).data
        hidden_data = PublicTestCaseSerializer(hidden_case).data

        self.assertEqual(public_data["input"], "18\n")
        self.assertEqual(public_data["expected_output"], "18\n")
        self.assertEqual(hidden_data, {})
        self.assertNotIn("secret", str(hidden_data))


class RunnerAdapterContractTests(DjangoTestCase):
    def test_runner_status_mapping_returns_only_canonical_submission_statuses(self):
        current_statuses = {value for value, _label in Submission.Status.choices}
        legacy_statuses = {
            "passed",
            "failed",
            "compiler_error",
            "timeout",
            "system_error",
            "cancelled",
        }

        for runner_status, submission_status in RUNNER_RESULT_TO_SUBMISSION_STATUS.items():
            self.assertIn(submission_status, current_statuses, runner_status)
            self.assertNotIn(submission_status, legacy_statuses, runner_status)

    def test_unknown_runner_status_maps_to_internal_error(self):
        self.assertEqual(
            map_runner_status_to_submission_status("unexpected_provider_status"),
            Submission.Status.INTERNAL_ERROR,
        )

    def test_checker_unavailable_is_not_a_persisted_submission_status(self):
        current_statuses = {value for value, _label in Submission.Status.choices}

        self.assertNotIn("checker_unavailable", current_statuses)

    def test_legacy_status_names_are_not_current_checker_choices(self):
        current_statuses = {
            value
            for value, _label in (*TaskAttempt.Status.choices, *Submission.Status.choices)
        }

        self.assertFalse(
            current_statuses
            & {
                "passed",
                "failed",
                "compiler_error",
                "timeout",
                "system_error",
                "cancelled",
            }
        )

    def test_runner_metadata_rejects_sensitive_keys(self):
        denied_keys = (
            "source",
            "source_code",
            "stdin",
            "input",
            "expected",
            "expected_output",
            "stdout",
            "stderr",
            "stdio",
            "hidden",
            "test",
            "payload",
            "compiler_output",
            "runtime_output",
            "secret_token",
            "api_key",
            "database_url",
            "redis_host",
            "deploy_path",
        )

        for key in denied_keys:
            with self.subTest(key=key):
                with self.assertRaises(ValueError):
                    RunnerDispatch(
                        external_job_id="job-1",
                        metadata={key: "redacted"},
                    )

    def test_runner_metadata_rejects_sensitive_values_and_absolute_paths(self):
        denied_values = (
            "captured stdout",
            "expected output",
            "hidden test payload",
            "source code",
            "postgres connection",
            "deploy key",
            "C:\\runner\\job.log",
            "/runner/job.log",
        )

        for value in denied_values:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    RunnerResult(
                        status="internal_error",
                        metadata={"provider_note": value},
                    )

    def test_runner_metadata_allows_safe_names_and_values(self):
        health = RunnerHealth(
            available=True,
            metadata={
                "provider": "prototype",
                "attempt": 1,
                "sandbox_ready": True,
            },
        )

        self.assertEqual(health.metadata["provider"], "prototype")

    def test_runner_contract_repr_excludes_source_stdio_and_test_payloads(self):
        limits = RunnerLimits(
            compile_timeout_ms=10_000,
            run_timeout_ms=2_000,
            memory_limit_kb=128 * 1024,
            output_limit_bytes=64 * 1024,
        )
        test_case = RunnerTestCase(
            input="private input",
            expected_output="private output",
            is_hidden=True,
            position=0,
        )
        job = RunnerJob(
            submission_id=UUID("00000000-0000-0000-0000-000000000001"),
            task_id="00-03-input-age",
            task_version=1,
            language="cpp17",
            comparison_mode="tokens",
            source_code="int main() { return 0; }",
            limits=limits,
            tests=(test_case,),
        )
        result = RunnerResult(
            status="wrong_answer",
            stdout="private stdout",
            stderr="private stderr",
            error_message="private error",
        )

        combined_repr = f"{test_case!r} {job!r} {result!r}"
        self.assertNotIn("private input", combined_repr)
        self.assertNotIn("private output", combined_repr)
        self.assertNotIn("int main", combined_repr)
        self.assertNotIn("private stdout", combined_repr)
        self.assertNotIn("private stderr", combined_repr)
        self.assertNotIn("private error", combined_repr)

    def test_disabled_runner_reports_fail_closed_health(self):
        health = DisabledRunner().check_health()

        self.assertFalse(health.available)
        self.assertEqual(health.reason, "runner_unavailable")
        self.assertEqual(health.metadata["provider"], "disabled_runner")

    def test_disabled_runner_does_not_dispatch_jobs(self):
        limits = RunnerLimits(
            compile_timeout_ms=10_000,
            run_timeout_ms=2_000,
            memory_limit_kb=128 * 1024,
            output_limit_bytes=64 * 1024,
        )
        job = RunnerJob(
            submission_id=UUID("00000000-0000-0000-0000-000000000001"),
            task_id="00-03-input-age",
            task_version=1,
            language="cpp17",
            comparison_mode="tokens",
            source_code="int main() { return 0; }",
            limits=limits,
            tests=(),
        )
        runner = DisabledRunner()

        with self.assertRaises(DisabledRunnerUnavailable):
            runner.submit(job)

        self.assertIsNone(runner.get_result("job-1"))


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
        other_submission.status = Submission.Status.INTERNAL_ERROR
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

    def test_terminal_submission_returns_canonical_status(self):
        attempt = TaskAttempt.objects.create(
            user=self.user,
            checker_task_version=self.version,
            code_snapshot="int main() { return 0; }",
        )
        submission = Submission.objects.create(
            attempt=attempt,
            source_code=attempt.code_snapshot,
        )
        submission.status = Submission.Status.INTERNAL_ERROR
        submission.save()
        self.authenticate()

        response = self.client.get(
            f"/api/checker/submissions/{submission.id}/",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "internal_error")
        self.assertNotEqual(response.data["status"], "system_error")

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

    def test_submission_service_does_not_create_submission_when_runner_disabled(self):
        draft_response = self.save_draft()
        attempt = TaskAttempt.objects.get(pk=draft_response.data["id"])

        with self.assertRaises(CheckerUnavailable):
            create_checker_submission(
                attempt=attempt,
                task_version=self.version,
                source_code=attempt.code_snapshot,
            )

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
