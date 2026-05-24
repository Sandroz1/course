from dataclasses import dataclass
from typing import Any

from django.conf import settings
from rest_framework import status


SYSTEM_PROMPT = """
Ты помощник на учебном сайте по C++.
Отвечай на русском языке.
Пиши кратко, понятно и без лишнего оформления.

Запрещено:
- начинать с "Конечно", "Давай", "Отлично";
- использовать emoji;
- использовать декоративные разделители "---";
- использовать заголовки "###", если ответ короткий;
- злоупотреблять жирным текстом;
- писать длинные вступления.

Разрешено:
- короткие абзацы;
- обычные списки;
- code blocks для кода;
- inline code для терминов C++.

Если пользователь выделил текст, объясни именно выделенный фрагмент.
Сначала дай суть, потом пример, потом короткий вывод.
Если в коде есть ошибка, покажи: что не так, почему, как исправить.
Не выдумывай факты о проекте.
Не давай слишком длинный ответ без необходимости.
""".strip()


@dataclass
class UpstreamAiError(Exception):
    message: str
    status_code: int = status.HTTP_502_BAD_GATEWAY


@dataclass(frozen=True)
class AiProviderResult:
    answer: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    @property
    def has_token_usage(self) -> bool:
        return any([self.prompt_tokens, self.completion_tokens, self.total_tokens])


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
            "AI-сервис временно недоступен.",
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if status_code == 429:
        return UpstreamAiError(
            "AI-сервис временно ограничил запросы. Попробуйте позже.",
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return UpstreamAiError(
        "AI-сервис временно недоступен.",
        status.HTTP_502_BAD_GATEWAY,
    )


def extract_answer(payload: dict[str, Any]) -> str:
    answer = payload.get("choices", [{}])[0].get("message", {}).get("content", "")

    if not isinstance(answer, str) or not answer.strip():
        raise UpstreamAiError("AI-сервис вернул пустой ответ.")

    return answer.strip()


def _positive_int(value: Any) -> int:
    return value if isinstance(value, int) and value > 0 else 0


def extract_token_usage(payload: dict[str, Any]) -> dict[str, int]:
    usage = payload.get("usage")
    if not isinstance(usage, dict):
        return {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    prompt_tokens = _positive_int(usage.get("prompt_tokens"))
    completion_tokens = _positive_int(usage.get("completion_tokens"))
    total_tokens = max(_positive_int(usage.get("total_tokens")), prompt_tokens + completion_tokens)

    return {
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": total_tokens,
    }


def call_qwen(messages: list[dict[str, str]]) -> AiProviderResult:
    api_key = (settings.QWEN_API_KEY or "").strip()

    if not api_key:
        raise UpstreamAiError(
            "AI-сервис временно не настроен.",
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        import requests
    except ImportError as exc:
        raise UpstreamAiError(
            "AI-сервис временно недоступен.",
            status.HTTP_503_SERVICE_UNAVAILABLE,
        ) from exc

    try:
        response = requests.post(
            f"{settings.QWEN_BASE_URL.rstrip('/')}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.QWEN_MODEL,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 900,
            },
            timeout=settings.QWEN_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        raise UpstreamAiError(
            "AI-сервис временно недоступен.",
            status.HTTP_502_BAD_GATEWAY,
        ) from exc

    if not response.ok:
        raise sanitize_upstream_error(response.status_code)

    try:
        payload = response.json()
    except ValueError as exc:
        raise UpstreamAiError("AI-сервис вернул некорректный ответ.") from exc

    return AiProviderResult(answer=extract_answer(payload), **extract_token_usage(payload))
