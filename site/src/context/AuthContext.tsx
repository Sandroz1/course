import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AUTH_CLEARED_EVENT,
  ApiError,
  apiRequest,
  getAccessToken,
  setAccessToken as setMemoryAccessToken,
} from "../lib/api";
import { clearLocalAiUsage } from "../lib/aiUsage";
import { clearCachedCourseProgress } from "../lib/progressApi";
import type {
  AuthResponse,
  AuthTokens,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from "../types/api";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const USER_SNAPSHOT_STORAGE_KEY = "uchicode.auth.user";
const LEGACY_REFRESH_TOKEN_STORAGE_KEY = "uchicodeRefreshToken";

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
    // Auth can continue without persistent storage.
  }
}

function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures in restricted browser modes.
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;

  const user = value as Partial<AuthUser>;

  return (
    typeof user.id === "number" &&
    typeof user.username === "string" &&
    (typeof user.phone === "string" || user.phone === null) &&
    typeof user.is_phone_verified === "boolean"
  );
}

function toUserSnapshot(user: AuthUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    phone: user.phone,
    is_phone_verified: user.is_phone_verified,
  };
}

function readUserSnapshot() {
  const raw = readStorage(USER_SNAPSHOT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return isAuthUser(parsed) ? toUserSnapshot(parsed) : null;
  } catch {
    return null;
  }
}

function writeUserSnapshot(user: AuthUser) {
  writeStorage(USER_SNAPSHOT_STORAGE_KEY, JSON.stringify(toUserSnapshot(user)));
}

function removeUserSnapshot() {
  removeStorage(USER_SNAPSHOT_STORAGE_KEY);
}

function extractTokens(response: AuthResponse): AuthTokens {
  const access = response.access ?? response.access_token ?? response.tokens?.access;

  if (!access) {
    throw new ApiError(500, "Сервер не вернул токены авторизации.");
  }

  return { access };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState(() => getAccessToken());
  const [user, setUser] = useState<AuthUser | null>(() => readUserSnapshot());
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    const userId = readUserSnapshot()?.id;

    setMemoryAccessToken(null);
    removeStorage(LEGACY_REFRESH_TOKEN_STORAGE_KEY);
    removeUserSnapshot();
    clearLocalAiUsage(userId);
    clearCachedCourseProgress();
    setAccessToken(null);
    setUser(null);
  }, []);

  const saveAuth = useCallback((tokens: AuthTokens, nextUser?: AuthUser) => {
    setMemoryAccessToken(tokens.access);
    removeStorage(LEGACY_REFRESH_TOKEN_STORAGE_KEY);
    setAccessToken(tokens.access);

    if (nextUser) {
      const snapshot = toUserSnapshot(nextUser);
      writeUserSnapshot(snapshot);
      setUser(snapshot);
    }
  }, []);

  useEffect(() => {
    window.addEventListener(AUTH_CLEARED_EVENT, clearAuth);

    return () => {
      window.removeEventListener(AUTH_CLEARED_EVENT, clearAuth);
    };
  }, [clearAuth]);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await apiRequest<AuthUser>("/me/");
      const snapshot = toUserSnapshot(profile);
      writeUserSnapshot(snapshot);
      setAccessToken(getAccessToken());
      setUser(snapshot);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuth();
      }

      throw error;
    }
  }, [clearAuth]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!accessToken && !readUserSnapshot()) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const profile = await apiRequest<AuthUser>("/me/");
        if (!cancelled) {
          const snapshot = toUserSnapshot(profile);
          writeUserSnapshot(snapshot);
          setAccessToken(getAccessToken());
          setUser(snapshot);
        }
      } catch (error) {
        if (!cancelled && error instanceof ApiError && error.status === 401) {
          clearAuth();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [accessToken, clearAuth]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await apiRequest<AuthResponse>("/auth/login/", {
        method: "POST",
        body: payload,
      });
      const tokens = extractTokens(response);
      saveAuth(tokens, response.user);

      if (!response.user) {
        await refreshProfile();
      }
    },
    [refreshProfile, saveAuth],
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const response = await apiRequest<AuthResponse>("/auth/register/", {
        method: "POST",
        body: payload,
      });
      const tokens = extractTokens(response);
      saveAuth(tokens, response.user);

      if (!response.user) {
        await refreshProfile();
      }
    },
    [refreshProfile, saveAuth],
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout/", {
        method: "POST",
      });
    } catch {
      // Local logout must still complete if the API is temporarily unavailable.
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken),
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [
      accessToken,
      isLoading,
      login,
      logout,
      refreshProfile,
      register,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
