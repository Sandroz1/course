from __future__ import annotations

import math
from typing import Any

from rest_framework import status
from rest_framework.exceptions import ErrorDetail, Throttled
from rest_framework.response import Response
from rest_framework.views import exception_handler


def _plain(value: Any) -> Any:
    if isinstance(value, ErrorDetail):
        return str(value)

    if isinstance(value, list):
        return [_plain(item) for item in value]

    if isinstance(value, dict):
        return {key: _plain(item) for key, item in value.items()}

    return value


def _first_message(fields: dict[str, Any]) -> str:
    for value in fields.values():
        if isinstance(value, list) and value:
            return str(value[0])

        if isinstance(value, str) and value:
            return value

    return "Проверь данные формы."


def api_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    response = exception_handler(exc, context)

    if response is None:
        return response

    data = _plain(response.data)
    payload: dict[str, Any] = {}

    if isinstance(data, dict):
        message = data.get("message") or data.get("detail") or data.get("error")

        if response.status_code == status.HTTP_400_BAD_REQUEST:
            fields = {
                key: value
                for key, value in data.items()
                if key not in {"message", "detail", "error", "non_field_errors", "retryAfterSeconds"}
            }
            non_field_errors = data.get("non_field_errors")

            if not message and isinstance(non_field_errors, list) and non_field_errors:
                message = str(non_field_errors[0])

            if fields:
                payload["fields"] = fields
                message = message or _first_message(fields)

        payload["message"] = str(message or "Не удалось выполнить запрос.")
        if isinstance(data.get("retryAfterSeconds"), (int, float)):
            payload["retryAfterSeconds"] = math.ceil(data["retryAfterSeconds"])
    elif isinstance(data, list) and data:
        payload["message"] = str(data[0])
    else:
        payload["message"] = "Не удалось выполнить запрос."

    if isinstance(exc, Throttled):
        payload["message"] = "Слишком много попыток. Попробуйте позже."
        if exc.wait is not None:
            payload["retryAfterSeconds"] = math.ceil(exc.wait)

    if response.status_code == status.HTTP_401_UNAUTHORIZED and payload.get("message") in {
        None,
        "",
        "Authentication credentials were not provided.",
        "Given token not valid for any token type",
        "Token is invalid or expired",
    }:
        payload["message"] = "Нужно войти в аккаунт."

    if response.status_code == status.HTTP_403_FORBIDDEN and payload.get("message") in {
        "You do not have permission to perform this action.",
        "Authentication credentials were not provided.",
    }:
        payload["message"] = "Недостаточно прав."

    response.data = payload
    return response
