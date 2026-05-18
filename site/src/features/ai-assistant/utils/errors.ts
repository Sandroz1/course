import { ApiError } from "../../../lib/api";

export function getAiAccessMessage({
    isAuthenticated,
    isAuthLoading,
    isPhoneVerified,
}: {
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    isPhoneVerified: boolean;
}) {
    if (isAuthLoading) {
        return "Проверяем аккаунт...";
    }

    if (!isAuthenticated) {
        return "Войдите, чтобы использовать AI.";
    }

    if (!isPhoneVerified) {
        return "Подтвердите телефон в профиле.";
    }

    return "";
}

export function getAiErrorMessage(error: unknown) {
    if (!(error instanceof ApiError)) {
        return "Не удалось получить ответ от AI.";
    }

    if (error.status === 401) {
        return "Сессия истекла. Войдите снова.";
    }

    if (error.status === 403) {
        return "Подтвердите телефон в профиле.";
    }

    if (error.status === 429) {
        const retryText = error.retryAfterSeconds
            ? ` Попробуйте через ${error.retryAfterSeconds} с.`
            : "";
        return `${error.message || "Лимит запросов к AI исчерпан."}${retryText}`;
    }

    if (error.status >= 500 || error.status === 0) {
        return error.message || "AI-сервис временно недоступен.";
    }

    return error.message || "Не удалось получить ответ от AI.";
}
