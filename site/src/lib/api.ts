import type { ApiErrorPayload, ApiRequestOptions } from "../types/api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
export const ACCESS_TOKEN_STORAGE_KEY = "uchicodeAccessToken";
export const REFRESH_TOKEN_STORAGE_KEY = "uchicodeRefreshToken";

export class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload | null;

  constructor(status: number, message: string, payload: ApiErrorPayload | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
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

function getAccessToken() {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
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
  if (status === 429) return "Слишком много запросов. Подожди немного и попробуй снова.";
  if (status >= 500) return "Сервер временно недоступен. Попробуй позже.";

  return "Не удалось выполнить запрос.";
}

async function readPayload(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAccessToken();

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(path), {
    method: options.method ?? "GET",
    headers,
    signal: options.signal,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(response.status, payload), payload);
  }

  return payload as T;
}
