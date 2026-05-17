import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  applyThemePreference,
  getStoredThemePreference,
  saveThemePreference,
  themeLabels,
  type ThemePreference,
} from "../../../utils/theme";
import styles from "./ThemeSwitcher.module.scss";

const themeOptions: ThemePreference[] = ["system", "light", "dark", "blue"];

export function ThemeSwitcher() {
  const [preference, setPreference] = useState<ThemePreference>(() => getStoredThemePreference());
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    applyThemePreference(preference);
    saveThemePreference(preference);

    if (preference !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyThemePreference("system");
    media.addEventListener("change", onChange);

    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function selectTheme(option: ThemePreference) {
    setPreference(option);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? "theme-switcher-options" : undefined}
        aria-label="Выбор темы оформления"
        onClick={() => setIsOpen((value) => !value)}
      >
        <span>{themeLabels[preference]}</span>
        <span className={styles.chevron} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id="theme-switcher-options"
          className={styles.menu}
          role="listbox"
          aria-label="Тема"
        >
          {themeOptions.map((option) => (
            <button
              key={option}
              className={clsx(styles.option, option === preference && styles.optionActive)}
              type="button"
              role="option"
              aria-selected={option === preference}
              onClick={() => selectTheme(option)}
            >
              {themeLabels[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
