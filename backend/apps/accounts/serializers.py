from __future__ import annotations

import re

from django.contrib.auth import authenticate
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.hashers import check_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed

from .models import User
from .tokens import invalidate_user_tokens


PHONE_PATTERN = re.compile(r"^\+?[0-9][0-9\s().-]{4,31}$")


def normalize_phone(value: str | None) -> str | None:
    if value is None:
        return None

    phone = value.strip()
    if not phone:
        return None

    if not PHONE_PATTERN.fullmatch(phone):
        raise serializers.ValidationError("Введите телефон в понятном формате, например +79991234567.")

    return re.sub(r"[\s().-]", "", phone)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "phone", "is_phone_verified")


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password2 = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_username(self, value: str) -> str:
        username = value.strip()

        if not username:
            raise serializers.ValidationError("Введите логин.")

        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("Такой логин уже занят.")

        return username

    def validate_phone(self, value: str) -> str | None:
        phone = normalize_phone(value)

        if phone and User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError("Такой телефон уже используется.")

        return phone

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": ["Пароли не совпадают."]})

        try:
            validate_password(attrs["password"])
        except DjangoValidationError as error:
            raise serializers.ValidationError({"password": list(error.messages)}) from error

        return attrs

    def create(self, validated_data: dict) -> User:
        validated_data.pop("password2", None)
        password = validated_data.pop("password")

        return User.objects.create_user(password=password, **validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs: dict) -> dict:
        user = authenticate(
            request=self.context.get("request"),
            username=attrs.get("username", "").strip(),
            password=attrs.get("password"),
        )

        if user is None:
            raise AuthenticationFailed("Неверный логин или пароль.")

        if not user.is_active:
            raise AuthenticationFailed("Аккаунт отключён.")

        attrs["user"] = user
        return attrs


class ProfileUpdateSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ("phone",)

    def validate_phone(self, value: str | None) -> str | None:
        phone = normalize_phone(value)

        if phone and User.objects.exclude(pk=self.instance.pk).filter(phone=phone).exists():
            raise serializers.ValidationError("Такой телефон уже используется.")

        return phone

    def update(self, instance: User, validated_data: dict) -> User:
        if "phone" in validated_data:
            next_phone = validated_data["phone"]
            if instance.phone != next_phone:
                instance.is_phone_verified = False

        return super().update(instance, validated_data)


class PhoneSendCodeSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=32)

    def validate_phone(self, value: str) -> str:
        phone = normalize_phone(value)

        if not phone:
            raise serializers.ValidationError("Введите телефон.")

        user = self.context["request"].user
        if User.objects.exclude(pk=user.pk).filter(phone=phone).exists():
            raise serializers.ValidationError("Такой телефон уже используется другим пользователем.")

        return phone


class PhoneVerifySerializer(PhoneSendCodeSerializer):
    code = serializers.RegexField(
        regex=r"^\d{6}$",
        max_length=6,
        error_messages={"invalid": "Введите 6 цифр из SMS."},
    )


class ChangePasswordSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(write_only=True, trim_whitespace=False)
    newPassword = serializers.CharField(write_only=True, trim_whitespace=False)
    newPassword2 = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_currentPassword(self, value: str) -> str:
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError("Текущий пароль указан неверно.")

        return value

    def validate(self, attrs: dict) -> dict:
        user = self.context["request"].user
        new_password = attrs["newPassword"]

        if new_password != attrs["newPassword2"]:
            raise serializers.ValidationError({"newPassword2": ["Пароли не совпадают."]})

        if check_password(new_password, user.password):
            raise serializers.ValidationError({"newPassword": ["Новый пароль должен отличаться от текущего."]})

        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"newPassword": list(error.messages)}) from error

        return attrs

    def save(self, **kwargs) -> User:
        request = self.context["request"]
        user = request.user
        user.set_password(self.validated_data["newPassword"])
        user.save(update_fields=["password"])
        invalidate_user_tokens(user)
        django_request = getattr(request, "_request", request)
        if hasattr(django_request, "session"):
            update_session_auth_hash(django_request, user)
        return user
