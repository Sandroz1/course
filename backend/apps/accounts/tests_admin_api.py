from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient, APITestCase


User = get_user_model()


class AdminUserApiTests(APITestCase):
    trusted_origin = "http://localhost:5173"

    def setUp(self):
        cache.clear()
        self.staff = User.objects.create_user(username="staff", password="StrongPass123!", is_staff=True)
        self.user = User.objects.create_user(
            username="alex",
            password="StrongPass123!",
            phone="+79991234567",
            is_phone_verified=True,
        )

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_anonymous_cannot_open_admin_users(self):
        response = self.client.get("/api/admin/users/", HTTP_HOST="localhost")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_regular_user_cannot_open_admin_users(self):
        self.authenticate(self.user)

        response = self.client.get("/api/admin/users/", HTTP_HOST="localhost")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_user_can_open_users_list(self):
        self.authenticate(self.staff)

        response = self.client.get("/api/admin/users/", HTTP_HOST="localhost")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertGreaterEqual(response.data["count"], 2)
        self.assertNotIn("password", response.data["results"][0])

    def test_staff_user_can_retrieve_user(self):
        self.authenticate(self.staff)

        response = self.client.get(f"/api/admin/users/{self.user.id}/", HTTP_HOST="localhost")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.user.id)
        self.assertNotIn("password", response.data)

    def test_staff_user_cannot_patch_phone_and_active_status(self):
        self.authenticate(self.staff)

        response = self.client.patch(
            f"/api/admin/users/{self.user.id}/",
            {"phone": "+79990000000", "is_active": False},
            format="json",
            HTTP_HOST="localhost",
        )
        self.user.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.user.phone, "+79991234567")
        self.assertTrue(self.user.is_active)

    def test_superuser_can_patch_phone_and_active_status(self):
        superuser = User.objects.create_superuser(username="root", password="StrongPass123!")
        self.authenticate(superuser)

        response = self.client.patch(
            f"/api/admin/users/{self.user.id}/",
            {"phone": "+79990000000", "is_active": False},
            format="json",
            HTTP_HOST="localhost",
        )
        self.user.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.user.phone, "+79990000000")
        self.assertFalse(self.user.is_active)

    def test_regular_user_cannot_patch_another_user(self):
        other = User.objects.create_user(username="other", password="StrongPass123!")
        self.authenticate(self.user)

        response = self.client.patch(
            f"/api/admin/users/{other.id}/",
            {"phone": "+79990000000"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_delete_self(self):
        superuser = User.objects.create_superuser(username="root", password="StrongPass123!")
        self.authenticate(superuser)

        response = self.client.delete(f"/api/admin/users/{superuser.id}/", HTTP_HOST="localhost")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.filter(pk=superuser.pk).exists())

    def test_staff_cannot_deactivate_users(self):
        superuser = User.objects.create_superuser(username="root", password="StrongPass123!")
        self.authenticate(self.staff)

        response = self.client.post(
            f"/api/admin/users/{superuser.id}/deactivate/",
            format="json",
            HTTP_HOST="localhost",
        )
        superuser.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(superuser.is_active)

    def test_superuser_cannot_deactivate_last_superuser(self):
        superuser = User.objects.create_superuser(username="root", password="StrongPass123!")
        self.authenticate(superuser)

        response = self.client.post(
            f"/api/admin/users/{superuser.id}/deactivate/",
            format="json",
            HTTP_HOST="localhost",
        )
        superuser.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(superuser.is_active)

    def test_staff_cannot_reset_password(self):
        self.authenticate(self.staff)

        response = self.client.post(
            f"/api/admin/users/{self.user.id}/reset-password/",
            {
                "newPassword": "NewStrongPass123!",
                "newPassword2": "NewStrongPass123!",
            },
            format="json",
            HTTP_HOST="localhost",
        )
        self.user.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(self.user.check_password("StrongPass123!"))

    def test_reset_password_works(self):
        superuser = User.objects.create_superuser(username="root", password="StrongPass123!")
        self.authenticate(superuser)

        response = self.client.post(
            f"/api/admin/users/{self.user.id}/reset-password/",
            {
                "newPassword": "NewStrongPass123!",
                "newPassword2": "NewStrongPass123!",
            },
            format="json",
            HTTP_HOST="localhost",
        )
        self.user.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Пароль изменён.")
        self.assertNotIn("password", response.data)
        self.assertTrue(self.user.check_password("NewStrongPass123!"))

    def test_admin_password_reset_invalidates_existing_jwt(self):
        target_client = APIClient()
        login_response = target_client.post(
            "/api/auth/login/",
            {"username": "alex", "password": "StrongPass123!"},
            format="json",
            HTTP_HOST="localhost",
        )
        old_access_token = login_response.data["tokens"]["access"]

        superuser = User.objects.create_superuser(username="root", password="StrongPass123!")
        admin_client = APIClient()
        admin_client.force_authenticate(user=superuser)

        response = admin_client.post(
            f"/api/admin/users/{self.user.id}/reset-password/",
            {
                "newPassword": "NewStrongPass123!",
                "newPassword2": "NewStrongPass123!",
            },
            format="json",
            HTTP_HOST="localhost",
        )
        refresh_response = target_client.post(
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
        next_login_response = target_client.post(
            "/api/auth/login/",
            {"username": "alex", "password": "NewStrongPass123!"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(me_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(next_login_response.status_code, status.HTTP_200_OK)

    def test_admin_create_user_does_not_return_password(self):
        superuser = User.objects.create_superuser(username="root", password="StrongPass123!")
        self.authenticate(superuser)

        response = self.client.post(
            "/api/admin/users/",
            {
                "username": "newuser",
                "phone": "+79990001122",
                "is_phone_verified": True,
                "password": "NewStrongPass123!",
                "is_active": True,
                "is_staff": False,
            },
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", response.data)
        created_user = User.objects.get(username="newuser")
        self.assertTrue(created_user.check_password("NewStrongPass123!"))
