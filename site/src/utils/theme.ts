export type ThemePreference = "system" | "light" | "dark" | "blue";
export type ResolvedTheme = Exclude<ThemePreference, "system">;

export const THEME_STORAGE_KEY = "cppLearnTheme";

export const themeLabels: Record<ThemePreference, string> = {
  system: "Системная",
  light: "Светлая",
  dark: "Тёмная",
  blue: "Синяя",
};

const themePreferences: ThemePreference[] = ["system", "light", "dark", "blue"];

export function isThemePreference(value: string | null): value is ThemePreference {
  return value !== null && themePreferences.includes(value as ThemePreference);
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : "system";
}

export function saveThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference;
  if (typeof window === "undefined") return "dark";

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") return;

  const resolvedTheme = resolveTheme(preference);
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.style.colorScheme = resolvedTheme === "light" ? "light" : "dark";
}
