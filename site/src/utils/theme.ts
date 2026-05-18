export type ThemePreference = "system" | "light" | "dark" | "deep-dark" | "blue";
export type ResolvedTheme = Exclude<ThemePreference, "system">;

export const THEME_STORAGE_KEY = "cppLearnTheme";

export const themeLabels: Record<ThemePreference, string> = {
  system: "Системная",
  light: "Светлая",
  dark: "Тёмная",
  "deep-dark": "Очень тёмная",
  blue: "Синяя",
};

const themePreferences: ThemePreference[] = ["system", "light", "dark", "deep-dark", "blue"];

export function isThemePreference(value: string | null): value is ThemePreference {
  return value !== null && themePreferences.includes(value as ThemePreference);
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function saveThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Theme switching should keep working even when storage is unavailable.
  }
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference;
  if (typeof window === "undefined") return "deep-dark";

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "deep-dark";
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") return;

  const resolvedTheme = resolveTheme(preference);
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.style.colorScheme = resolvedTheme === "light" ? "light" : "dark";
}
