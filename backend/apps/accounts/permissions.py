from rest_framework import permissions


class IsAdminUserOnly(permissions.BasePermission):
    message = "Недостаточно прав."

    def has_permission(self, request, _view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser))
