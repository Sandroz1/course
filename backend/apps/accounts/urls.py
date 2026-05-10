from django.urls import path

from .views import LoginPlaceholderView, RegisterPlaceholderView


urlpatterns = [
    path("register/", RegisterPlaceholderView.as_view(), name="auth-register"),
    path("login/", LoginPlaceholderView.as_view(), name="auth-login"),
]
