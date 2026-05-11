from __future__ import annotations

from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .admin_serializers import (
    AdminPasswordResetSerializer,
    AdminUserSerializer,
    is_last_active_superuser,
    is_last_superuser,
)
from .models import User
from .permissions import IsAdminUserOnly


def _as_bool(value: str | None) -> bool | None:
    if value is None:
        return None

    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True

    if normalized in {"0", "false", "no", "off"}:
        return False

    return None


class AdminUserPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminUserViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUserOnly]
    pagination_class = AdminUserPagination
    lookup_field = "id"
    ordering_fields = {
        "id",
        "username",
        "phone",
        "is_active",
        "is_staff",
        "is_superuser",
        "is_phone_verified",
        "date_joined",
        "last_login",
    }

    def get_queryset(self):
        queryset = User.objects.all().order_by("id")
        params = self.request.query_params

        search = params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(phone__icontains=search)
            )

        for field in ("is_active", "is_staff", "is_phone_verified"):
            value = _as_bool(params.get(field))
            if value is not None:
                queryset = queryset.filter(**{field: value})

        ordering = params.get("ordering", "").strip()
        if ordering:
            requested_fields = []
            for item in ordering.split(","):
                item = item.strip()
                field_name = item[1:] if item.startswith("-") else item
                if field_name in self.ordering_fields:
                    requested_fields.append(item)

            if requested_fields:
                queryset = queryset.order_by(*requested_fields)

        return queryset

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise ValidationError({"message": "Нельзя удалить собственный аккаунт."})

        if is_last_superuser(instance):
            raise ValidationError({"message": "Нельзя удалить последнего администратора."})

        instance.delete()

    @action(detail=True, methods=["post"])
    def activate(self, request, id=None):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=["is_active"])

        return Response(
            {
                "message": "Пользователь активирован.",
                "user": self.get_serializer(user).data,
            }
        )

    @action(detail=True, methods=["post"])
    def deactivate(self, request, id=None):
        user = self.get_object()

        if user.pk == request.user.pk:
            raise ValidationError({"message": "Нельзя деактивировать собственный аккаунт."})

        if is_last_active_superuser(user):
            raise ValidationError({"message": "Нельзя деактивировать последнего администратора."})

        if user.is_superuser and not request.user.is_superuser:
            raise PermissionDenied("Только superuser может деактивировать другого superuser.")

        user.is_active = False
        user.save(update_fields=["is_active"])

        return Response(
            {
                "message": "Пользователь деактивирован.",
                "user": self.get_serializer(user).data,
            }
        )

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, id=None):
        user = self.get_object()

        if user.is_superuser and not request.user.is_superuser:
            raise PermissionDenied("Только superuser может менять пароль другого superuser.")

        serializer = AdminPasswordResetSerializer(data=request.data, context={"user": user})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({"message": "Пароль изменён."}, status=status.HTTP_200_OK)
