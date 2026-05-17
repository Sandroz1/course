import { type ReactNode, useEffect, useState } from "react";

import { AccountMenu } from "./AccountMenu/AccountMenu";
import { AiAssistant } from "../../features/ai-assistant";
import { useAuth } from "../../context/AuthContext";
import clsx from "clsx";
import { currentPath } from "../../utils/slug";
import { SearchBox } from "./SearchBox/SearchBox";
import { Sidebar } from "./Sidebar/Sidebar";
import { ThemeSwitcher } from "./ThemeSwitcher/ThemeSwitcher";
import styles from "./AppLayout.module.scss";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "uchicode.sidebar.collapsed";

function readStoredSidebarCollapsed() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function saveSidebarCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(value));
  } catch {
    // Sidebar state is a convenience preference; layout still works without storage.
  }
}

function isWideRoute(path: string) {
  return path === "/tasks" || path.startsWith("/tasks/");
}

export function AppLayout({ children }: { children: ReactNode }) {
  const path = currentPath();
  const { isAuthenticated } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(readStoredSidebarCollapsed);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    saveSidebarCollapsed(isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (!isMobileNavOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileNavOpen]);

  return (
    <div className={clsx(styles.root, isSidebarCollapsed && styles.rootCollapsed)}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
      />
      {isMobileNavOpen && (
        <button
          className={styles.mobileScrim}
          type="button"
          aria-label="Закрыть навигацию"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}
      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <button
            className={styles.mobileMenuButton}
            type="button"
            aria-label="Открыть навигацию"
            aria-controls="app-sidebar"
            aria-expanded={isMobileNavOpen}
            onClick={() => setIsMobileNavOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <div className={styles.searchSlot}>
            <SearchBox />
          </div>
          <div className={styles.topbarActions}>
            <ThemeSwitcher />
            {!isAuthenticated && <AccountMenu />}
          </div>
        </header>

        <main className={clsx(styles.content, isWideRoute(path) && styles.contentWide)}>
          {children}
        </main>
        <AiAssistant />
      </div>
    </div>
  );
}
