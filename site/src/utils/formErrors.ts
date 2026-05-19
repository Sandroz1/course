import { ApiError } from "../lib/api";

export type FieldErrorMap<T extends string> = Partial<Record<T, string[]>>;

const rawErrorPatterns = [
  /\b[A-Za-z]+Error:/,
  /\b(exception|traceback|stack trace)\b/i,
  /\b(integrity|type|value|key)error\b/i,
  /\bSQLSTATE\b/i,
  /^[a-zA-Z0-9_.-]+:\s/,
];

const friendlyMessagePatterns: Array<[RegExp, string]> = [
  [/не совпад|do not match|match/i, "Пароли не совпадают."],
  [/уже занят|already.*(exist|taken|used)/i, "Такой логин уже занят."],
  [/текущий пароль.*невер|current password.*(incorrect|wrong)/i, "Текущий пароль неверный."],
  [/authentication credentials were not provided|token.*(invalid|expired)|not valid for any token/i, "Нужно войти в аккаунт."],
  [/trusted origin|referer|csrf/i, "Не удалось выполнить запрос."],
  [/должен отличаться|different from current/i, "Новый пароль должен отличаться от текущего."],
  [/слишком корот|too short/i, "Пароль слишком короткий."],
  [/слишком похож|too similar/i, "Пароль слишком похож на логин."],
  [/слишком прост|too common|common/i, "Пароль слишком простой."],
  [/только из цифр|entirely numeric|only numeric/i, "Пароль не должен состоять только из цифр."],
  [/обязатель|required|blank|empty/i, "Заполните поле."],
  [/неверный логин|invalid credentials|unable to log in|no active account/i, "Неверный логин или пароль."],
];

function normalizeText(value: unknown) {
  if (Array.isArray(value)) {
    return normalizeText(value[0]);
  }

  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function isUnmappedEnglishText(text: string) {
  return /[a-z]/i.test(text) && !/[а-яё]/i.test(text);
}

function toFriendlyText(value: unknown, fallback: string) {
  const text = normalizeText(value);

  if (!text) return fallback;

  const mappedMessage = friendlyMessagePatterns.find(([pattern]) => pattern.test(text))?.[1];
  if (mappedMessage) return mappedMessage;

  if (
    text.length > 110 ||
    isUnmappedEnglishText(text) ||
    rawErrorPatterns.some((pattern) => pattern.test(text))
  ) {
    return fallback;
  }

  return text;
}

export function firstFieldError<T extends string>(errors: FieldErrorMap<T>, field: T) {
  return errors[field]?.[0] ?? "";
}

export function hasFieldErrors<T extends string>(errors: FieldErrorMap<T>) {
  return Object.values(errors).some((messages) => Array.isArray(messages) && Boolean(messages[0]));
}

export function getApiFieldErrors<T extends string>(
  error: unknown,
  allowedFields: readonly T[],
  fallbacks: Record<T, string>,
): FieldErrorMap<T> {
  if (!(error instanceof ApiError) || !error.fields) return {};

  return allowedFields.reduce<FieldErrorMap<T>>((nextErrors, field) => {
    const rawMessage = normalizeText(error.fields?.[field]);
    if (!rawMessage) return nextErrors;

    const message = toFriendlyText(rawMessage, fallbacks[field]);

    if (message) {
      nextErrors[field] = [message];
    }

    return nextErrors;
  }, {});
}

export function getFriendlyFormError(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback;

  if (error.status === 0) return "Не удалось подключиться к серверу.";
  if (error.status === 403) return "Недостаточно прав.";
  if (error.status === 429) return "Слишком много попыток. Попробуйте позже.";
  if (error.status >= 500) return "Сервер временно недоступен. Попробуйте позже.";

  return toFriendlyText(error.message, fallback);
}
