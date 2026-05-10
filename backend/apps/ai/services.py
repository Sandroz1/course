from dataclasses import dataclass
from typing import Any

from django.conf import settings
from rest_framework import status


SYSTEM_PROMPT = """
Ты помощник на учебном сайте по C++.
Отвечай по-русски.
Объясняй просто, но технически точно.
Учитывай, что ученица новичок.
Если вопрос связан с выделенным текстом, сначала объясни именно выделенный фрагмент.
Если в коде есть ошибка, покажи: что не так, почему, как исправить.
Не выдумывай факты о проекте.
Не давай слишком длинный ответ без необходимости.
""".strip()


@dataclass
class UpstreamAiError(Exception):
    message: str
    status_code: int = status.HTTP_502_BAD_GATEWAY


def build_qwen_messages(question: str, selected_text: str = "", history: list[dict[str, str]] | None = None):
    safe_history = history or []
    user_content = (
        f"Выделенный текст:\n{selected_text}\n\nВопрос:\n{question}"
        if selected_text
        else question
    )

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        *safe_history,
        {"role": "user", "content": user_content},
    ]


def sanitize_upstream_error(status_code: int | None = None) -> UpstreamAiError:
    if status_code in {401, 403}:
        return UpstreamAiError(
            "AI provider rejected the request. Check server configuration.",
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if status_code == 429:
        return UpstreamAiError(
            "AI provider rate limit was reached. Try again later.",
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return UpstreamAiError(
        "AI provider is temporarily unavailable.",
        status.HTTP_502_BAD_GATEWAY,
    )


def extract_answer(payload: dict[str, Any]) -> str:
    answer = payload.get("choices", [{}])[0].get("message", {}).get("content", "")

    if not isinstance(answer, str) or not answer.strip():
        raise UpstreamAiError("AI provider returned an empty response.")

    return answer.strip()


def call_qwen(messages: list[dict[str, str]]) -> str:
    if not settings.QWEN_API_KEY:
        raise UpstreamAiError(
            "AI service is not configured. Set QWEN_API_KEY on the server.",
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        import requests
    except ImportError as exc:
        raise UpstreamAiError(
            "AI service dependency is not installed.",
            status.HTTP_503_SERVICE_UNAVAILABLE,
        ) from exc

    try:
        response = requests.post(
            f"{settings.QWEN_BASE_URL.rstrip('/')}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.QWEN_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.QWEN_MODEL,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 1200,
            },
            timeout=settings.QWEN_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        raise UpstreamAiError(
            "AI provider is temporarily unavailable.",
            status.HTTP_502_BAD_GATEWAY,
        ) from exc

    if not response.ok:
        raise sanitize_upstream_error(response.status_code)

    try:
        payload = response.json()
    except ValueError as exc:
        raise UpstreamAiError("AI provider returned invalid JSON.") from exc

    return extract_answer(payload)

