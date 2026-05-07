import { useEffect, useState } from "react";
import {
  applyThemePreference,
  getStoredThemePreference,
  saveThemePreference,
  themeLabels,
  type ThemePreference,
} from "../utils/theme";

const themeOptions: ThemePreference[] = ["system", "light", "dark", "blue"];

export function ThemeSwitcher() {
  const [preference, setPreference] = useState<ThemePreference>(() => getStoredThemePreference());

  useEffect(() => {
    applyThemePreference(preference);
    saveThemePreference(preference);

    if (preference !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyThemePreference("system");
    media.addEventListener("change", onChange);

    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  return (
    <label className="theme-switcher">
      <span>Тема</span>
      <select
        value={preference}
        onChange={(event) => setPreference(event.target.value as ThemePreference)}
        aria-label="Выбор темы оформления"
      >
        {themeOptions.map((option) => (
          <option key={option} value={option}>
            {themeLabels[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
