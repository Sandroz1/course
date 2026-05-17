import { type ReactNode, useEffect, useMemo, useState } from "react";

import { AccountMenu } from "./AccountMenu/AccountMenu";
import { AiAssistant } from "../../features/ai-assistant";
import { courseSections } from "../../data/courseSections";
import { tasks } from "../../data/tasks";
import { classNames } from "../../shared/lib/classNames";
import { currentPath } from "../../utils/slug";
import { SearchBox } from "./SearchBox/SearchBox";
import { Sidebar } from "./Sidebar/Sidebar";
import { ThemeSwitcher } from "./ThemeSwitcher/ThemeSwitcher";
import styles from "./AppLayout.module.scss";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "uchicode.sidebar.collapsed";

type RouteContext = {
  eyebrow: string;
  title: string;
  detail?: string;
};

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

function getRouteContext(path: string): RouteContext {
  if (path === "/") {
    return { eyebrow: "Uchicode", title: "Главная" };
  }

  if (path === "/courses") {
    return { eyebrow: "Навигация", title: "Курсы" };
  }

  if (path === "/course" || path === "/courses/oop-cpp") {
    return { eyebrow: "Курс", title: "ООП C++", detail: "Карта разделов" };
  }

  if (path.startsWith("/course/")) {
    const slug = path.replace("/course/", "");
    const section = courseSections.find((item) => item.slug === slug);

    return {
      eyebrow: "ООП C++",
      title: section ? `${section.number}. ${section.title}` : "Раздел курса",
      detail: "Теория и практика",
    };
  }

  if (path === "/tasks") {
    return { eyebrow: "Практика", title: "Задачи" };
  }

  if (path.startsWith("/tasks/")) {
    const taskId = path.replace("/tasks/", "");
    const task = tasks.find((item) => item.id === taskId);

    return {
      eyebrow: task?.section ?? "Практика",
      title: task?.title ?? "Задача",
      detail: task?.practicePath,
    };
  }

  if (path === "/guide") {
    return { eyebrow: "Обучение", title: "Как учиться" };
  }

  if (path === "/common-errors") {
    return { eyebrow: "Обучение", title: "Частые ошибки" };
  }

  if (path === "/profile") {
    return { eyebrow: "Аккаунт", title: "Профиль" };
  }

  if (path === "/login") {
    return { eyebrow: "Аккаунт", title: "Вход" };
  }

  if (path === "/register") {
    return { eyebrow: "Аккаунт", title: "Регистрация" };
  }

  return { eyebrow: "Uchicode", title: "Учебное приложение" };
}

function isWideRoute(path: string) {
  return path === "/tasks" || path.startsWith("/tasks/") || path === "/profile";
}

export function AppLayout({ children }: { children: ReactNode }) {
  const path = currentPath();
  const routeContext = useMemo(() => getRouteContext(path), [path]);
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
    <div className={classNames(styles.root, isSidebarCollapsed && styles.rootCollapsed)}>
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
          <div className={styles.context}>
            <span>{routeContext.eyebrow}</span>
            <strong>{routeContext.title}</strong>
            {routeContext.detail && <em>{routeContext.detail}</em>}
          </div>
          <div className={styles.searchSlot}>
            <SearchBox />
          </div>
          <div className={styles.topbarActions}>
            <ThemeSwitcher />
            <AccountMenu />
          </div>
        </header>

        <main className={classNames(styles.content, isWideRoute(path) && styles.contentWide)}>
          {children}
        </main>
        <AiAssistant />
      </div>
    </div>
  );
}
