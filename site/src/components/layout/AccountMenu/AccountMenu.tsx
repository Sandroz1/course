import { useEffect, useRef, useState } from "react";

import { useAuth } from "../../../context/AuthContext";
import { navigateTo } from "../../../utils/navigation";
import { toPath } from "../../../utils/slug";
import styles from "./AccountMenu.module.scss";

export function AccountMenu() {
  const { isAuthenticated, logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const avatarLetter = user?.username.trim().charAt(0).toUpperCase() || "U";

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

  async function handleLogout() {
    setIsOpen(false);
    await logout();
    navigateTo("/", true);
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.guestActions} aria-label="Аккаунт">
        <a className={styles.loginLink} href={toPath("/login")}>
          Войти
        </a>
        <a className={styles.registerLink} href={toPath("/register")}>
          Регистрация
        </a>
      </div>
    );
  }

  if (!user) {
    return <div className={styles.loading}>Аккаунт</div>;
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        id="account-menu-trigger"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? "account-menu" : undefined}
        className={styles.trigger}
        type="button"
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className={styles.avatar} aria-hidden="true">
          {avatarLetter}
        </span>
        <span className={styles.username}>{user.username}</span>
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen && (
        <div
          id="account-menu"
          className={styles.menu}
          role="menu"
          aria-labelledby="account-menu-trigger"
        >
          <div className={styles.userSummary}>
            <span className={styles.summaryAvatar} aria-hidden="true">
              {avatarLetter}
            </span>
            <span>
              <strong>{user.username}</strong>
            </span>
          </div>
          <div className={styles.divider} />
          <a className={styles.menuItem} href={toPath("/profile")} role="menuitem" onClick={() => setIsOpen(false)}>
            Профиль
          </a>
          <button
            className={`${styles.menuItem} ${styles.logoutItem}`}
            type="button"
            role="menuitem"
            onClick={() => void handleLogout()}
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
