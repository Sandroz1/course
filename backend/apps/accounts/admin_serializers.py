from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import User
from .serializers import normalize_phone
from .tokens import invalidate_user_tokens


def is_last_superuser(user: User) -> bool:
    return bool(user.is_superuser and not User.objects.filter(is_superuser=True).exclude(pk=user.pk).exists())


def is_last_active_superuser(user: User) -> bool:
    return bool(
        user.is_superuser
        and user.is_active
        and not User.objects.filter(is_superuser=True, is_active=True).exclude(pk=user.pk).exists()
    )


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, trim_whitespace=False)
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "phone",
            "is_phone_verified",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
            "last_login",
            "password",
        )
        read_only_fields = ("id", "date_joined", "last_login")

    def validate_username(self, value: str) -> str:
        username = value.strip()

        if not username:
            raise serializers.ValidationError("Введите логин.")

        queryset = User.objects.filter(username__iexact=username)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Такой логин уже занят.")

        return username

    def validate_phone(self, value: str | None) -> str | None:
        phone = normalize_phone(value)

        if phone:
            queryset = User.objects.filter(phone=phone)
            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)

            if queryset.filter(is_phone_verified=True).exists():
                raise serializers.ValidationError("Такой телефон уже используется.")

        return phone

    def validate(self, attrs: dict) -> dict:
        request = self.context.get("request")
        actor = getattr(request, "user", None)
        instance = self.instance

        if instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": ["Введите пароль."]})

        if instance is not None and "password" in attrs:
            raise serializers.ValidationError({"password": ["Пароль меняется через reset-password."]})

        if actor and not actor.is_superuser and ("is_staff" in attrs or "is_superuser" in attrs):
            raise serializers.ValidationError({"message": "Только superuser может менять административные права."})

        if instance is not None and actor and instance.is_superuser and not actor.is_superuser:
            raise serializers.ValidationError({"message": "Только superuser может менять другого superuser."})

        if instance is not None and attrs.get("is_active") is False:
            if actor and instance.pk == actor.pk:
                raise serializers.ValidationError({"message": "Нельзя деактивировать собственный аккаунт."})

            if is_last_active_superuser(instance):
                raise serializers.ValidationError({"message": "Нельзя деактивировать последнего администратора."})

        if instance is not None and instance.is_superuser and attrs.get("is_superuser") is False:
            if is_last_superuser(instance):
                raise serializers.ValidationError({"message": "Нельзя снять права у последнего администратора."})

        next_phone = attrs.get("phone", instance.phone if instance is not None else None)
        next_is_phone_verified = attrs.get(
            "is_phone_verified",
            instance.is_phone_verified if instance is not None else False,
        )
        if next_phone and not next_is_phone_verified:
            raise serializers.ValidationError({"is_phone_verified": ["Телефон можно сохранить только подтверждённым."]})

        password = attrs.get("password")
        if password:
            try:
                validate_password(password)
            except DjangoValidationError as error:
                raise serializers.ValidationError({"password": list(error.messages)}) from error

        return attrs

    def create(self, validated_data: dict) -> User:
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)

    def update(self, instance: User, validated_data: dict) -> User:
        return super().update(instance, validated_data)


class AdminPasswordResetSerializer(serializers.Serializer):
    newPassword = serializers.CharField(write_only=True, trim_whitespace=False)
    newPassword2 = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs: dict) -> dict:
        if attrs["newPassword"] != attrs["newPassword2"]:
            raise serializers.ValidationError({"newPassword2": ["Пароли не совпадают."]})

        user = self.context["user"]
        try:
            validate_password(attrs["newPassword"], user=user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"newPassword": list(error.messages)}) from error

        return attrs

    def save(self, **kwargs) -> User:
        user = self.context["user"]
        user.set_password(self.validated_data["newPassword"])
        user.save(update_fields=["password"])
        invalidate_user_tokens(user)
        return user
