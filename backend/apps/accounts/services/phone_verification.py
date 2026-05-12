from __future__ import annotations

import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError

from apps.accounts.models import PhoneVerificationCode, User


CODE_TTL_MINUTES = 10
MAX_ATTEMPTS = 5
SEND_COOLDOWN_SECONDS = 60


class SmsProviderUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "SMS provider недоступен."
    default_code = "sms_provider_unavailable"


def generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_code(code: str) -> str:
    return make_password(code)


def verify_code(raw_code: str, code_hash: str) -> bool:
    return check_password(raw_code, code_hash)


def get_client_ip(request) -> str | None:
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    return request.META.get("REMOTE_ADDR")


def _latest_code(user: User, phone: str) -> PhoneVerificationCode | None:
    return (
        PhoneVerificationCode.objects.filter(user=user, phone=phone, is_used=False)
        .order_by("-created_at")
        .first()
    )


def ensure_can_send_code(user: User, phone: str) -> None:
    latest_code = _latest_code(user, phone)

    if not latest_code:
        return

    elapsed = timezone.now() - latest_code.created_at
    if elapsed < timedelta(seconds=SEND_COOLDOWN_SECONDS):
        remaining = SEND_COOLDOWN_SECONDS - int(elapsed.total_seconds())
        raise ValidationError(
            {
                "message": "Код уже отправлен. Попробуйте повторить позже.",
                "retryAfterSeconds": max(remaining, 1),
            }
        )


def send_sms_code(phone: str, code: str) -> None:
    provider = getattr(settings, "SMS_PROVIDER", "console")
    message = f"Код подтверждения Uchicode: {code}"

    if provider == "console":
        if settings.DEBUG:
            print(f"[uchicode sms] {phone}: {code}")
            return

        raise SmsProviderUnavailable("SMS provider не настроен.")

    if provider == "smsru":
        send_smsru_code(phone, message)
        return

    if provider == "smsc":
        send_smsc_code(phone, message)
        return

    raise SmsProviderUnavailable("Неизвестный SMS provider.")


def _raise_if_sms_credentials_missing(*values: str | None) -> None:
    if not all(value and value.strip() for value in values):
        raise SmsProviderUnavailable("SMS provider не настроен.")


def _post_sms_provider(url: str, data: dict[str, str]) -> dict:
    try:
        import requests
    except ImportError as exc:
        raise SmsProviderUnavailable("SMS provider недоступен.") from exc

    try:
        response = requests.post(url, data=data, timeout=settings.SMS_TIMEOUT_SECONDS)
    except requests.RequestException as exc:
        raise SmsProviderUnavailable("SMS provider недоступен.") from exc

    if not response.ok:
        raise SmsProviderUnavailable("SMS provider временно недоступен.")

    try:
        payload = response.json()
    except ValueError as exc:
        raise SmsProviderUnavailable("SMS provider вернул некорректный ответ.") from exc

    if not isinstance(payload, dict):
        raise SmsProviderUnavailable("SMS provider вернул некорректный ответ.")

    return payload


def send_smsru_code(phone: str, message: str) -> None:
    _raise_if_sms_credentials_missing(settings.SMS_API_KEY)

    payload = _post_sms_provider(
        "https://sms.ru/sms/send",
        {
            "api_id": settings.SMS_API_KEY,
            "to": phone.lstrip("+"),
            "msg": message,
            "json": "1",
            "from": settings.SMS_FROM,
        },
    )

    if payload.get("status") != "OK":
        raise SmsProviderUnavailable("SMS provider не принял сообщение.")

    sms_payload = payload.get("sms", {})
    if isinstance(sms_payload, dict):
        phone_payload = sms_payload.get(phone.lstrip("+"))
        if isinstance(phone_payload, dict) and phone_payload.get("status") != "OK":
            raise SmsProviderUnavailable("SMS provider не принял сообщение.")


def send_smsc_code(phone: str, message: str) -> None:
    if settings.SMS_API_KEY:
        auth_data = {"apikey": settings.SMS_API_KEY}
    else:
        _raise_if_sms_credentials_missing(settings.SMS_LOGIN, settings.SMS_PASSWORD)
        auth_data = {"login": settings.SMS_LOGIN, "psw": settings.SMS_PASSWORD}

    payload = _post_sms_provider(
        "https://smsc.ru/sys/send.php",
        {
            **auth_data,
            "phones": phone,
            "mes": message,
            "sender": settings.SMS_FROM,
            "fmt": "3",
            "charset": "utf-8",
        },
    )

    if "error" in payload or "error_code" in payload:
        raise SmsProviderUnavailable("SMS provider не принял сообщение.")


def create_and_send_code(*, user: User, phone: str, request) -> PhoneVerificationCode:
    ensure_can_send_code(user, phone)
    code = generate_code()
    verification_code = PhoneVerificationCode.objects.create(
        user=user,
        phone=phone,
        code_hash=hash_code(code),
        expires_at=timezone.now() + timedelta(minutes=CODE_TTL_MINUTES),
        sent_ip=get_client_ip(request),
    )

    try:
        send_sms_code(phone, code)
    except Exception:
        verification_code.delete()
        raise

    return verification_code


def confirm_phone_code(*, user: User, phone: str, code: str) -> User:
    verification_code = _latest_code(user, phone)

    if not verification_code:
        raise ValidationError({"code": ["Сначала отправьте код подтверждения."]})

    now = timezone.now()

    if verification_code.expires_at <= now:
        verification_code.is_used = True
        verification_code.save(update_fields=["is_used"])
        raise ValidationError({"code": ["Код истёк. Отправьте новый код."]})

    if verification_code.attempts_count >= MAX_ATTEMPTS:
        raise ValidationError({"code": ["Слишком много попыток. Отправьте новый код."]})

    if not verify_code(code, verification_code.code_hash):
        verification_code.attempts_count += 1
        verification_code.save(update_fields=["attempts_count"])

        if verification_code.attempts_count >= MAX_ATTEMPTS:
            raise ValidationError({"code": ["Слишком много попыток. Отправьте новый код."]})

        raise ValidationError({"code": ["Неверный код."]})

    verification_code.is_used = True
    verification_code.save(update_fields=["is_used"])

    user.phone = phone
    user.is_phone_verified = True
    user.save(update_fields=["phone", "is_phone_verified"])

    return user
