import type { AiUsage } from "../types/api";

export const AI_DAILY_LIMIT = 15;
export const AI_USAGE_UPDATED_EVENT = "uchicode-ai-usage-updated";

const STORAGE_PREFIX = "uchicodeAiUsage";

type StoredAiUsage = {
  date: string;
  used: number;
  limit: number;
  resetAt?: string;
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowResetAt() {
  const reset = new Date();
  reset.setHours(24, 0, 0, 0);
  return reset.toISOString();
}

function storageKey(userId: number) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function emitUsageUpdated() {
  window.dispatchEvent(new Event(AI_USAGE_UPDATED_EVENT));
}

function readStoredUsage(userId: number): StoredAiUsage {
  const fallback = {
    date: todayKey(),
    used: 0,
    limit: AI_DAILY_LIMIT,
    resetAt: tomorrowResetAt(),
  };

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as Partial<StoredAiUsage>;
    if (parsed.date !== todayKey()) return fallback;

    return {
      date: parsed.date,
      used: typeof parsed.used === "number" ? Math.max(parsed.used, 0) : 0,
      limit: typeof parsed.limit === "number" ? parsed.limit : AI_DAILY_LIMIT,
      resetAt: typeof parsed.resetAt === "string" ? parsed.resetAt : fallback.resetAt,
    };
  } catch {
    return fallback;
  }
}

function writeStoredUsage(userId: number, usage: StoredAiUsage) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(usage));
  } catch {
    // Usage display is advisory; backend throttle remains the source of truth.
  }
}

export function clearLocalAiUsage(userId: number | undefined) {
  if (!userId) return;

  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch {
    // Ignore storage cleanup failures in restricted browser modes.
  }

  emitUsageUpdated();
}

function toUsage(stored: StoredAiUsage): AiUsage {
  const used = Math.min(Math.max(stored.used, 0), stored.limit);
  return {
    limit: stored.limit,
    used,
    remaining: Math.max(stored.limit - used, 0),
    resetAt: stored.resetAt,
  };
}

export function getLocalAiUsage(userId: number | undefined): AiUsage {
  if (!userId) {
    return {
      limit: AI_DAILY_LIMIT,
      used: 0,
      remaining: AI_DAILY_LIMIT,
      resetAt: tomorrowResetAt(),
    };
  }

  return toUsage(readStoredUsage(userId));
}

export function syncAiUsage(userId: number, serverUsage?: AiUsage): AiUsage {
  if (!serverUsage) {
    return getLocalAiUsage(userId);
  }

  const limit = serverUsage.limit || AI_DAILY_LIMIT;
  const used =
    typeof serverUsage.used === "number"
      ? serverUsage.used
      : Math.max(limit - serverUsage.remaining, 0);

  const stored = {
    date: todayKey(),
    used: Math.min(Math.max(used, 0), limit),
    limit,
    resetAt: serverUsage.resetAt || tomorrowResetAt(),
  };

  writeStoredUsage(userId, stored);
  emitUsageUpdated();
  return toUsage(stored);
}

export function recordAiSuccess(userId: number, serverUsage?: AiUsage): AiUsage {
  if (serverUsage) {
    return syncAiUsage(userId, serverUsage);
  }

  const current = readStoredUsage(userId);
  const next = {
    ...current,
    used: Math.min(current.used + 1, current.limit),
  };

  writeStoredUsage(userId, next);
  emitUsageUpdated();
  return toUsage(next);
}

export function markAiLimitReached(userId: number, serverUsage?: AiUsage): AiUsage {
  if (serverUsage) {
    return syncAiUsage(userId, {
      ...serverUsage,
      remaining: 0,
      used: serverUsage.used ?? serverUsage.limit,
    });
  }

  const current = readStoredUsage(userId);
  const next = {
    ...current,
    used: current.limit,
  };

  writeStoredUsage(userId, next);
  emitUsageUpdated();
  return toUsage(next);
}

export function formatAiUsage(usage: AiUsage) {
  return `Осталось ${usage.remaining} из ${usage.limit}`;
}
