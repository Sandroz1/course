from rest_framework.permissions import BasePermission


class IsPhoneVerified(BasePermission):
    message = "Для AI-помощника подтвердите номер телефона в профиле."

    def has_permission(self, request, _view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_phone_verified)
