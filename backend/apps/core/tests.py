from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

from apps.ai.models import AiDailyUsage
from apps.ai.services import UpstreamAiError


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

    def test_register_success(self):
        response = self.register()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
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

    def test_logout_blacklists_refresh_token(self):
        User.objects.create_user(username="alex", password="StrongPass123!")
        login_response = self.client.post(
            "/api/auth/login/",
            {"username": "alex", "password": "StrongPass123!"},
            format="json",
            HTTP_HOST="localhost",
        )
        refresh_token = login_response.data["tokens"]["refresh"]

        response = self.client.post(
            "/api/auth/logout/",
            {"refresh": refresh_token},
            format="json",
            HTTP_HOST="localhost",
        )
        refresh_response = self.client.post(
            "/api/auth/token/refresh/",
            {"refresh": refresh_token},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)


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
        mocked_call_qwen.assert_called_once()
