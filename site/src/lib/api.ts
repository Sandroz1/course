import type { AiUsage, ApiErrorPayload, ApiRequestOptions } from "../types/api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
export const ACCESS_TOKEN_STORAGE_KEY = "uchicodeAccessToken";
export const REFRESH_TOKEN_STORAGE_KEY = "uchicodeRefreshToken";
export const AUTH_CLEARED_EVENT = "uchicode-auth-cleared";

const AUTH_REFRESH_PATH = "/api/auth/token/refresh/";
const AUTH_REFRESH_DISABLED_PATHS = new Set([
  "/api/auth/login/",
  "/api/auth/register/",
  "/api/auth/logout/",
  AUTH_REFRESH_PATH,
]);
const AUTH_TOKENLESS_PATHS = new Set(AUTH_REFRESH_DISABLED_PATHS);
const ACCESS_REFRESH_SKEW_SECONDS = 30;

let refreshAccessPromise: Promise<string> | null = null;

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string[]>;
  payload: ApiErrorPayload | null;
  retryAfterSeconds?: number;

  constructor(status: number, message: string, payload: ApiErrorPayload | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.fields = extractFields(payload);
    this.retryAfterSeconds = extractRetryAfterSeconds(payload);
  }
}

export function isApiConfigured() {
  return Boolean(API_BASE_URL);
}

function buildApiUrl(path: string) {
  if (!API_BASE_URL) {
    throw new ApiError(0, "API не настроен. Укажи VITE_API_BASE_URL в site/.env.local.");
  }

  const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

function normalizePath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath.split("?")[0];
}

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Auth requests can still proceed; persistence is best-effort.
  }
}

function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures in restricted browser modes.
  }
}

function getAccessToken() {
  return readStorage(ACCESS_TOKEN_STORAGE_KEY);
}

function getRefreshToken() {
  return readStorage(REFRESH_TOKEN_STORAGE_KEY);
}

function clearStoredAuth() {
  removeStorage(ACCESS_TOKEN_STORAGE_KEY);
  removeStorage(REFRESH_TOKEN_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
}

function pickString(payload: ApiErrorPayload | null, keys: string[]) {
  if (!payload) return "";

  for (const key of keys) {
    const value = payload[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function getJwtExpiration(token: string) {
  const payload = token.split(".")[1];

  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = JSON.parse(window.atob(padded)) as { exp?: unknown };

    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

function isAccessTokenExpiringSoon(token: string) {
  const expiresAt = getJwtExpiration(token);

  if (!expiresAt) return false;

  const now = Math.floor(Date.now() / 1000);
  return expiresAt <= now + ACCESS_REFRESH_SKEW_SECONDS;
}

function getErrorMessage(status: number, payload: ApiErrorPayload | null) {
  const serverMessage =
    typeof payload?.detail === "string"
      ? payload.detail
      : typeof payload?.message === "string"
        ? payload.message
        : typeof payload?.error === "string"
          ? payload.error
          : "";

  if (serverMessage) return serverMessage;

  if (payload) {
    for (const [field, value] of Object.entries(payload)) {
      if (Array.isArray(value) && value.length > 0) {
        return `${field}: ${value.join(" ")}`;
      }

      if (typeof value === "string" && value.trim()) {
        return `${field}: ${value}`;
      }
    }
  }

  if (status === 400) return "Проверь данные запроса.";
  if (status === 401) return "Нужно войти в аккаунт.";
  if (status === 429) {
    const usage = normalizeUsage(payload?.usage);
    if (usage?.remaining === 0) return "Лимит запросов на сегодня исчерпан.";
    return "Слишком много запросов. Подожди немного и попробуй снова.";
  }
  if (status === 501) return "Серверная функция ещё не подключена или временно недоступна.";
  if (status >= 500) return "Сервер временно недоступен. Попробуй позже.";

  return "Не удалось выполнить запрос.";
}

function extractRetryAfterSeconds(payload: ApiErrorPayload | null) {
  const value = payload?.retryAfterSeconds ?? payload?.retryAfter ?? payload?.retry_after;
  return typeof value === "number" && Number.isFinite(value) ? Math.max(Math.ceil(value), 1) : undefined;
}

function parseRetryAfterHeader(value: string | null) {
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.max(Math.ceil(seconds), 1);
  }

  const dateMs = Date.parse(value);
  if (!Number.isNaN(dateMs)) {
    return Math.max(Math.ceil((dateMs - Date.now()) / 1000), 1);
  }

  return undefined;
}

function parseHeaderInt(value: string | null) {
  if (!value) return undefined;

  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? number : undefined;
}

function normalizeUsage(value: unknown): AiUsage | undefined {
  if (!value || typeof value !== "object") return undefined;

  const usage = value as Partial<AiUsage>;
  const limit = typeof usage.limit === "number" ? usage.limit : undefined;
  const remaining = typeof usage.remaining === "number" ? usage.remaining : undefined;

  if (limit === undefined || remaining === undefined) return undefined;

  return {
    limit,
    remaining,
    used: typeof usage.used === "number" ? usage.used : Math.max(limit - remaining, 0),
    resetAt: typeof usage.resetAt === "string" ? usage.resetAt : undefined,
    retryAfterSeconds:
      typeof usage.retryAfterSeconds === "number" && Number.isFinite(usage.retryAfterSeconds)
        ? Math.max(Math.ceil(usage.retryAfterSeconds), 1)
        : undefined,
  };
}

function enrichPayloadFromHeaders(response: Response, payload: ApiErrorPayload | null) {
  const retryAfterSeconds = parseRetryAfterHeader(response.headers.get("Retry-After"));
  const limit = parseHeaderInt(response.headers.get("X-RateLimit-Limit"));
  const remaining = parseHeaderInt(response.headers.get("X-RateLimit-Remaining"));
  const resetAt = response.headers.get("X-RateLimit-Reset") || undefined;
  const nextPayload: ApiErrorPayload = payload ? { ...payload } : {};

  if (retryAfterSeconds !== undefined && typeof nextPayload.retryAfterSeconds !== "number") {
    nextPayload.retryAfterSeconds = retryAfterSeconds;
  }

  if (limit !== undefined && remaining !== undefined && !nextPayload.usage) {
    nextPayload.usage = {
      limit,
      remaining,
      used: Math.max(limit - remaining, 0),
      resetAt,
      retryAfterSeconds,
    };
  }

  const normalizedUsage = normalizeUsage(nextPayload.usage);
  if (normalizedUsage) {
    nextPayload.usage = normalizedUsage;
  }

  return Object.keys(nextPayload).length > 0 ? nextPayload : null;
}

function extractFields(payload: ApiErrorPayload | null): Record<string, string[]> | undefined {
  if (!payload) return undefined;

  if (payload.fields && typeof payload.fields === "object") {
    return payload.fields;
  }

  const fields: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (["detail", "error", "fields", "message", "retryAfter", "retry_after", "retryAfterSeconds", "usage"].includes(key)) continue;

    if (Array.isArray(value)) {
      fields[key] = value.map(String);
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      fields[key] = [value];
    }
  }

  return Object.keys(fields).length > 0 ? fields : undefined;
}

async function readPayload(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  let payload: ApiErrorPayload | null = null;

  if (contentType.includes("application/json")) {
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = null;
    }
  }

  return enrichPayloadFromHeaders(response, payload);
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearStoredAuth();
    throw new ApiError(401, "Сессия истекла. Войди снова.");
  }

  if (!refreshAccessPromise) {
    refreshAccessPromise = (async () => {
      let response: Response;

      try {
        response = await fetch(buildApiUrl(AUTH_REFRESH_PATH), {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch {
        throw new ApiError(
          0,
          "Не удалось подключиться к серверу. Проверь, запущен ли backend.",
        );
      }

      const payload = await readPayload(response);

      if (!response.ok) {
        clearStoredAuth();
        const message =
          response.status === 401
            ? "Сессия истекла. Войди снова."
            : getErrorMessage(response.status, payload);
        throw new ApiError(response.status, message, payload);
      }

      const nextAccess = pickString(payload, ["access", "access_token"]);
      const nextRefresh = pickString(payload, ["refresh", "refresh_token"]);

      if (!nextAccess) {
        clearStoredAuth();
        throw new ApiError(500, "Сервер не вернул новый токен авторизации.");
      }

      writeStorage(ACCESS_TOKEN_STORAGE_KEY, nextAccess);

      if (nextRefresh) {
        writeStorage(REFRESH_TOKEN_STORAGE_KEY, nextRefresh);
      }

      return nextAccess;
    })().finally(() => {
      refreshAccessPromise = null;
    });
  }

  return refreshAccessPromise;
}

function shouldTryRefresh(path: string, options: ApiRequestOptions) {
  if (options.skipAuthRefresh || AUTH_REFRESH_DISABLED_PATHS.has(normalizePath(path))) {
    return false;
  }

  return Boolean(getRefreshToken());
}

async function getUsableAccessToken(path: string, options: ApiRequestOptions) {
  if (AUTH_TOKENLESS_PATHS.has(normalizePath(path))) {
    return null;
  }

  const token = getAccessToken();

  if (token && shouldTryRefresh(path, options) && isAccessTokenExpiringSoon(token)) {
    return refreshAccessToken();
  }

  return token;
}

async function sendRequest(path: string, options: ApiRequestOptions, accessToken?: string | null) {
  const headers = new Headers(options.headers);
  const token = accessToken === undefined ? getAccessToken() : accessToken;

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), {
      method: options.method ?? "GET",
      headers,
      signal: options.signal,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(
      0,
      "Не удалось подключиться к серверу. Проверь, запущен ли backend.",
    );
  }

  const payload = await readPayload(response);

  return { response, payload };
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = await getUsableAccessToken(path, options);
  let { response, payload } = await sendRequest(path, options, token);

  if (response.status === 401 && shouldTryRefresh(path, options)) {
    const nextAccess = await refreshAccessToken();
    ({ response, payload } = await sendRequest(path, options, nextAccess));
  }

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(response.status, payload), payload);
  }

  return payload as T;
}
