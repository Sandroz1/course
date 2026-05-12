from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import ChangePasswordView, LoginView, LogoutView, PhoneSendCodeView, PhoneVerifyView, RegisterView


urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("phone/send-code/", PhoneSendCodeView.as_view(), name="auth-phone-send-code"),
    path("phone/verify/", PhoneVerifyView.as_view(), name="auth-phone-verify"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
]
