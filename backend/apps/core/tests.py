from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.ai.models import AiDailyUsage, AiGlobalDailyUsage
from apps.ai.services import AiProviderResult, UpstreamAiError


User = get_user_model()


class HealthApiTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_health_endpoint(self):
        response = self.client.get("/api/health/", HTTP_HOST="localhost")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["service"], "uchicode-api")


class AuthApiTests(APITestCase):
    trusted_origin = "http://localhost:5173"

    def setUp(self):
        cache.clear()

    def register(self, username="alex", password="StrongPass123!"):
        return self.client.post(
            "/api/auth/register/",
            {
                "username": username,
                "phone": "+79991234567",
                "password": password,
                "password2": password,
            },
            format="json",
            HTTP_HOST="localhost",
        )

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def assert_refresh_cookie(self, response):
        self.assertIn(settings.AUTH_REFRESH_COOKIE_NAME, response.cookies)
        cookie = response.cookies[settings.AUTH_REFRESH_COOKIE_NAME]
        self.assertTrue(cookie.value)
        self.assertTrue(cookie["httponly"])

    def test_register_success(self):
        response = self.register()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertNotIn("refresh", response.data["tokens"])
        self.assert_refresh_cookie(response)
        self.assertNotIn("password", response.data["user"])

    def test_register_duplicate_username(self):
        User.objects.create_user(username="alex", password="StrongPass123!")

        response = self.register()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data["fields"])

    def test_register_password_mismatch(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "alex",
                "phone": "+79991234567",
                "password": "StrongPass123!",
                "password2": "OtherPass123!",
            },
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password2", response.data["fields"])

    def test_login_success(self):
        User.objects.create_user(username="alex", password="StrongPass123!")

        response = self.client.post(
            "/api/auth/login/",
            {"username": "alex", "password": "StrongPass123!"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertNotIn("refresh", response.data["tokens"])
        self.assert_refresh_cookie(response)
        self.assertNotIn("password", response.data["user"])

    def test_login_wrong_password(self):
        User.objects.create_user(username="alex", password="StrongPass123!")

        response = self.client.post(
            "/api/auth/login/",
            {"username": "alex", "password": "WrongPass123!"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["message"], "Неверный логин или пароль.")

    def test_me_without_token_returns_401(self):
        response = self.client.get("/api/me/", HTTP_HOST="localhost")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_with_token_returns_user(self):
        user = User.objects.create_user(username="alex", password="StrongPass123!")
        self.authenticate(user)

        response = self.client.get("/api/me/", HTTP_HOST="localhost")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "alex")

    def test_patch_me_cannot_set_staff_flags(self):
        user = User.objects.create_user(username="alex", password="StrongPass123!")
        self.authenticate(user)

        response = self.client.patch(
            "/api/me/",
            {
                "phone": "+79991234567",
                "is_staff": True,
                "is_superuser": True,
                "is_phone_verified": True,
            },
            format="json",
            HTTP_HOST="localhost",
        )
        user.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_phone_verified)
        self.assertEqual(user.phone, "+79991234567")

    def test_patch_me_phone_change_resets_phone_verification(self):
        user = User.objects.create_user(
            username="alex",
            password="StrongPass123!",
            phone="+79990000000",
            is_phone_verified=True,
        )
        self.authenticate(user)

        response = self.client.patch(
            "/api/me/",
            {"phone": "+79991234567"},
            format="json",
            HTTP_HOST="localhost",
        )
        user.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(user.phone, "+79991234567")
        self.assertFalse(user.is_phone_verified)
        self.assertFalse(response.data["is_phone_verified"])

    def test_change_password_wrong_current_password(self):
        user = User.objects.create_user(username="alex", password="StrongPass123!")
        self.authenticate(user)

        response = self.client.post(
            "/api/auth/change-password/",
            {
                "currentPassword": "WrongPass123!",
                "newPassword": "NewStrongPass123!",
                "newPassword2": "NewStrongPass123!",
            },
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("currentPassword", response.data["fields"])

    def test_change_password_success(self):
        user = User.objects.create_user(username="alex", password="StrongPass123!")
        self.authenticate(user)

        response = self.client.post(
            "/api/auth/change-password/",
            {
                "currentPassword": "StrongPass123!",
                "newPassword": "NewStrongPass123!",
                "newPassword2": "NewStrongPass123!",
            },
            format="json",
            HTTP_HOST="localhost",
        )
        user.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(user.check_password("NewStrongPass123!"))
        self.assertFalse(user.check_password("StrongPass123!"))

    def test_change_password_invalidates_existing_jwt(self):
        User.objects.create_user(username="alex", password="StrongPass123!")
        login_response = self.client.post(
            "/api/auth/login/",
            {"username": "alex", "password": "StrongPass123!"},
            format="json",
            HTTP_HOST="localhost",
        )
        old_access_token = login_response.data["tokens"]["access"]

        response = self.client.post(
            "/api/auth/change-password/",
            {
                "currentPassword": "StrongPass123!",
                "newPassword": "NewStrongPass123!",
                "newPassword2": "NewStrongPass123!",
            },
            format="json",
            HTTP_HOST="localhost",
            HTTP_AUTHORIZATION=f"Bearer {old_access_token}",
        )
        refresh_response = self.client.post(
            "/api/auth/token/refresh/",
            {},
            format="json",
            HTTP_HOST="localhost",
            HTTP_ORIGIN=self.trusted_origin,
        )
        me_response = APIClient().get(
            "/api/me/",
            HTTP_HOST="localhost",
            HTTP_AUTHORIZATION=f"Bearer {old_access_token}",
        )
        next_login_response = self.client.post(
            "/api/auth/login/",
            {"username": "alex", "password": "NewStrongPass123!"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(me_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(next_login_response.status_code, status.HTTP_200_OK)

    def test_logout_blacklists_refresh_token(self):
        User.objects.create_user(username="alex", password="StrongPass123!")
        login_response = self.client.post(
            "/api/auth/login/",
            {"username": "alex", "password": "StrongPass123!"},
            format="json",
            HTTP_HOST="localhost",
        )
        refresh_token = login_response.cookies[settings.AUTH_REFRESH_COOKIE_NAME].value

        response = self.client.post(
            "/api/auth/logout/",
            {},
            format="json",
            HTTP_HOST="localhost",
            HTTP_ORIGIN=self.trusted_origin,
        )
        refresh_response = self.client.post(
            "/api/auth/token/refresh/",
            {"refresh": refresh_token},
            format="json",
            HTTP_HOST="localhost",
            HTTP_ORIGIN=self.trusted_origin,
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(response.cookies[settings.AUTH_REFRESH_COOKIE_NAME].value, "")
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_uses_http_only_cookie(self):
        User.objects.create_user(username="alex", password="StrongPass123!")
        self.client.post(
            "/api/auth/login/",
            {"username": "alex", "password": "StrongPass123!"},
            format="json",
            HTTP_HOST="localhost",
        )

        response = self.client.post(
            "/api/auth/token/refresh/",
            {},
            format="json",
            HTTP_HOST="localhost",
            HTTP_ORIGIN=self.trusted_origin,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertNotIn("refresh", response.data)
        self.assert_refresh_cookie(response)

    def test_refresh_rejects_cookie_without_origin(self):
        User.objects.create_user(username="alex", password="StrongPass123!")
        self.client.post(
            "/api/auth/login/",
            {"username": "alex", "password": "StrongPass123!"},
            format="json",
            HTTP_HOST="localhost",
        )

        response = self.client.post(
            "/api/auth/token/refresh/",
            {},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_refresh_rejects_cookie_with_untrusted_origin(self):
        User.objects.create_user(username="alex", password="StrongPass123!")
        self.client.post(
            "/api/auth/login/",
            {"username": "alex", "password": "StrongPass123!"},
            format="json",
            HTTP_HOST="localhost",
        )

        response = self.client.post(
            "/api/auth/token/refresh/",
            {},
            format="json",
            HTTP_HOST="localhost",
            HTTP_ORIGIN="https://evil.example",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_logout_rejects_cookie_without_origin(self):
        User.objects.create_user(username="alex", password="StrongPass123!")
        self.client.post(
            "/api/auth/login/",
            {"username": "alex", "password": "StrongPass123!"},
            format="json",
            HTTP_HOST="localhost",
        )

        response = self.client.post(
            "/api/auth/logout/",
            {},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AiApiValidationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username="verified",
            password="StrongPass123!",
            phone="+79991234567",
            is_phone_verified=True,
        )

    def authenticate(self, user=None):
        self.client.force_authenticate(user=user or self.user)

    @patch("apps.ai.views.call_qwen")
    def test_ai_requires_authentication(self, mocked_call_qwen):
        response = self.client.post(
            "/api/ai/chat/",
            {"question": "Что такое class?"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        mocked_call_qwen.assert_not_called()

    @patch("apps.ai.views.call_qwen")
    def test_ai_requires_verified_phone(self, mocked_call_qwen):
        user = User.objects.create_user(username="alex", password="StrongPass123!")
        self.authenticate(user)

        response = self.client.post(
            "/api/ai/chat/",
            {"question": "Что такое class?"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        mocked_call_qwen.assert_not_called()

    def test_ai_validation_empty_question(self):
        self.authenticate()

        response = self.client.post(
            "/api/ai/chat/",
            {"question": ""},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("question", response.data["fields"])

    def test_ai_validation_too_long_question(self):
        self.authenticate()

        response = self.client.post(
            "/api/ai/chat/",
            {"question": "x" * 2001},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("question", response.data["fields"])

    def test_ai_validation_invalid_history_role(self):
        self.authenticate()

        response = self.client.post(
            "/api/ai/chat/",
            {
                "question": "Что не так?",
                "history": [{"role": "system", "content": "internal"}],
            },
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("history", response.data["fields"])

    @patch("apps.ai.views.call_qwen", return_value="Ответ")
    def test_ai_success_uses_service_without_external_request(self, mocked_call_qwen):
        self.authenticate()

        response = self.client.post(
            "/api/ai/chat/",
            {"question": "Что такое class?"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["answer"], "Ответ")
        self.assertEqual(response.data["remainingRequests"], 14)
        self.assertEqual(response.data["usage"]["limit"], 15)
        self.assertEqual(response.data["usage"]["used"], 1)
        self.assertEqual(response.data["usage"]["remaining"], 14)
        mocked_call_qwen.assert_called_once()

    @patch(
        "apps.ai.views.call_qwen",
        return_value=AiProviderResult("ok", prompt_tokens=4, completion_tokens=6, total_tokens=10),
    )
    def test_ai_success_records_provider_token_usage(self, mocked_call_qwen):
        self.authenticate()

        response = self.client.post(
            "/api/ai/chat/",
            {"question": "class?"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["answer"], "ok")
        self.assertEqual(response.data["usage"]["tokens"]["prompt"], 4)
        self.assertEqual(response.data["usage"]["tokens"]["completion"], 6)
        self.assertEqual(response.data["usage"]["tokens"]["total"], 10)
        self.assertEqual(AiDailyUsage.objects.get(user=self.user).total_tokens_count, 10)
        self.assertEqual(AiGlobalDailyUsage.objects.get().total_tokens_count, 10)
        mocked_call_qwen.assert_called_once()

    @patch("apps.ai.views.call_qwen", return_value="Ответ")
    def test_ai_verified_user_gets_429_after_burst_limit(self, mocked_call_qwen):
        self.authenticate()

        for _index in range(10):
            response = self.client.post(
                "/api/ai/chat/",
                {"question": "class?"},
                format="json",
                HTTP_HOST="localhost",
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post(
            "/api/ai/chat/",
            {"question": "class?"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(mocked_call_qwen.call_count, 10)

    @patch("apps.ai.throttles.AiUserBurstThrottle.rate", "100/min", create=True)
    @patch("apps.ai.throttles.AiGlobalBurstThrottle.rate", "100/min", create=True)
    @patch("apps.ai.views.call_qwen", return_value="Ответ")
    def test_ai_verified_user_is_limited_to_15_requests_per_day(self, mocked_call_qwen):
        self.authenticate()

        for index in range(15):
            response = self.client.post(
                "/api/ai/chat/",
                {"question": "Что такое class?"},
                format="json",
                HTTP_HOST="localhost",
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data["remainingRequests"], 14 - index)

        response = self.client.post(
            "/api/ai/chat/",
            {"question": "Что такое class?"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(response.data["remainingRequests"], 0)
        self.assertEqual(response.data["usage"]["limit"], 15)
        self.assertEqual(response.data["usage"]["used"], 15)
        self.assertEqual(response.data["usage"]["remaining"], 0)
        self.assertEqual(mocked_call_qwen.call_count, 15)

    @override_settings(AI_GLOBAL_DAILY_REQUEST_LIMIT=2)
    @patch("apps.ai.throttles.AiUserBurstThrottle.rate", "100/min", create=True)
    @patch("apps.ai.throttles.AiGlobalBurstThrottle.rate", "100/min", create=True)
    @patch("apps.ai.views.call_qwen", return_value="ok")
    def test_ai_global_daily_limit_blocks_after_shared_budget(self, mocked_call_qwen):
        self.authenticate()

        for _index in range(2):
            response = self.client.post(
                "/api/ai/chat/",
                {"question": "class?"},
                format="json",
                HTTP_HOST="localhost",
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post(
            "/api/ai/chat/",
            {"question": "class?"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(response.data["usage"]["limit"], 2)
        self.assertEqual(response.data["usage"]["used"], 2)
        self.assertEqual(response.data["usage"]["remaining"], 0)
        self.assertEqual(mocked_call_qwen.call_count, 2)

    @patch("apps.ai.views.call_qwen", side_effect=UpstreamAiError("AI-сервис временно недоступен."))
    def test_ai_upstream_error_does_not_consume_daily_limit(self, mocked_call_qwen):
        self.authenticate()

        response = self.client.post(
            "/api/ai/chat/",
            {"question": "Что такое class?"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(AiDailyUsage.objects.get(user=self.user).requests_count, 0)
        self.assertEqual(AiGlobalDailyUsage.objects.get().requests_count, 0)
        mocked_call_qwen.assert_called_once()
