import { useAuth } from "../../../context/AuthContext";
import { courseSections, isCourseSectionReady } from "../../../data/courseSections";
import clsx from "clsx";
import { currentPath, toPath } from "../../../utils/slug";
import styles from "./Sidebar.module.scss";

type SidebarProps = {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
};

type NavigationIcon = "home" | "courses" | "tasks" | "guide" | "errors" | "course" | "login" | "ai";

type NavigationLink = {
  href: string;
  label: string;
  icon: NavigationIcon;
};

const primaryLinks: NavigationLink[] = [
  { href: "/", label: "Главная", icon: "home" },
  { href: "/courses", label: "Курсы", icon: "courses" },
  { href: "/tasks", label: "Задачи", icon: "tasks" },
];

const learningLinks: NavigationLink[] = [
  { href: "/guide", label: "Как учиться", icon: "guide" },
  { href: "/common-errors", label: "Частые ошибки", icon: "errors" },
];

function isLinkActive(path: string, href: string) {
  if (href === "/") return path === "/";

  return path.startsWith(href);
}

function SidebarIcon({ icon }: { icon: NavigationIcon }) {
  if (icon === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4.75 10.5 12 4.75l7.25 5.75" />
        <path d="M6.75 9.5v8.75h10.5V9.5" />
        <path d="M10 18.25v-5h4v5" />
      </svg>
    );
  }

  if (icon === "courses") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M7 5.25h8.5a2 2 0 0 1 2 2v11.5H8a2.5 2.5 0 0 1 0-5h9.5" />
        <path d="M7 5.25v8.5" />
        <path d="M10 8.5h4" />
      </svg>
    );
  }

  if (icon === "tasks") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8 6.75h10" />
        <path d="M8 12h10" />
        <path d="M8 17.25h10" />
        <path d="m3.75 6.75.75.75 1.5-1.75" />
        <path d="m3.75 12 .75.75L6 11" />
        <path d="m3.75 17.25.75.75L6 16.25" />
      </svg>
    );
  }

  if (icon === "guide") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 5.25v13.5" />
        <path d="M5.5 7.25c2.7 0 4.7.65 6.5 2 1.8-1.35 3.8-2 6.5-2v10.5c-2.7 0-4.7.65-6.5 2-1.8-1.35-3.8-2-6.5-2Z" />
      </svg>
    );
  }

  if (icon === "errors") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 7.25v5.25" />
        <path d="M12 16.75h.01" />
        <path d="M10.4 4.9 3.6 17.05a1.7 1.7 0 0 0 1.48 2.55h13.84a1.7 1.7 0 0 0 1.48-2.55L13.6 4.9a1.84 1.84 0 0 0-3.2 0Z" />
      </svg>
    );
  }

  if (icon === "course") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6.75 5.25h9.5a2 2 0 0 1 2 2v11.5H8a2.5 2.5 0 0 1 0-5h10.25" />
        <path d="M6.75 5.25v8.5" />
        <path d="m11.25 9.25-1.5 1.5 1.5 1.5" />
        <path d="m14.75 9.25 1.5 1.5-1.5 1.5" />
      </svg>
    );
  }

  if (icon === "ai") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 4.75 13.65 9 18 10.65 13.65 12.3 12 16.75 10.35 12.3 6 10.65 10.35 9Z" />
        <path d="M18.25 4.75v3.5" />
        <path d="M20 6.5h-3.5" />
        <path d="M5.75 15.75v3.5" />
        <path d="M7.5 17.5H4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9.75 7.25 14.5 12l-4.75 4.75" />
      <path d="M14 12H3.75" />
      <path d="M14.5 5.25h3.75a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H14.5" />
    </svg>
  );
}

function SidebarToggleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4.75" y="5.25" width="14.5" height="13.5" rx="2.25" />
      <path d="M10 5.25v13.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m7.25 7.25 9.5 9.5" />
      <path d="m16.75 7.25-9.5 9.5" />
    </svg>
  );
}

function SidebarLink({
  href,
  icon,
  isCollapsed,
  label,
  onNavigate,
}: NavigationLink & {
  isCollapsed: boolean;
  onNavigate: () => void;
}) {
  const path = currentPath();
  const isActive = isLinkActive(path, href);

  return (
    <a
      aria-current={isActive ? "page" : undefined}
      aria-label={isCollapsed ? label : undefined}
      className={clsx(styles.link, isActive && styles.active)}
      href={toPath(href)}
      title={isCollapsed ? label : undefined}
      onClick={onNavigate}
    >
      <span className={styles.linkIcon} aria-hidden="true">
        <SidebarIcon icon={icon} />
      </span>
      <span className={styles.linkLabel}>{label}</span>
    </a>
  );
}

function ProfileBlock({
  isCollapsed,
  onNavigate,
}: {
  isCollapsed: boolean;
  onNavigate: () => void;
}) {
  const { isAuthenticated, user } = useAuth();
  const avatarLetter = user?.username.trim().charAt(0).toUpperCase() || "U";

  if (!isAuthenticated) {
    return (
      <div className={styles.profileActions}>
        <a
          className={styles.profileLink}
          href={toPath("/login")}
          aria-label={isCollapsed ? "Войти" : undefined}
          title={isCollapsed ? "Войти" : undefined}
          onClick={onNavigate}
        >
          <span className={styles.profileAvatar} aria-hidden="true">
            <SidebarIcon icon="login" />
          </span>
          <span className={styles.profileText}>
            <strong>Войти</strong>
            <small>Сохранить прогресс</small>
          </span>
        </a>
      </div>
    );
  }

  return (
    <a
      className={styles.profileLink}
      href={toPath("/profile")}
      aria-label={isCollapsed ? user?.username ?? "Профиль" : undefined}
      title={isCollapsed ? user?.username ?? "Профиль" : undefined}
      onClick={onNavigate}
    >
      <span className={styles.profileAvatar} aria-hidden="true">
        {avatarLetter}
      </span>
      <span className={styles.profileText}>
        <strong>{user?.username ?? "Профиль"}</strong>
        <small>Профиль и прогресс</small>
      </span>
    </a>
  );
}

export function Sidebar({
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onToggleCollapse,
}: SidebarProps) {
  const path = currentPath();
  const readyCourseSections = courseSections.filter(isCourseSectionReady);
  const readySectionsCount = readyCourseSections.length;

  function handleNavigate() {
    onCloseMobile();
  }

  function openAiAssistant() {
    window.dispatchEvent(new Event("uchicode-open-ai"));
    onCloseMobile();
  }

  return (
    <aside
      id="app-sidebar"
      className={clsx(
        styles.root,
        isCollapsed && styles.collapsed,
        isMobileOpen && styles.mobileOpen,
      )}
      aria-label="Навигация Uchicode"
    >
      <div className={styles.header}>
        <a
          className={styles.brand}
          href={toPath("/")}
          aria-label="Uchicode — на главную"
          onClick={handleNavigate}
        >
          <img className={styles.brandMark} src="/brand/uchicode-icon.png" alt="" aria-hidden="true" />
          <span className={styles.brandText} aria-hidden="true">
            <span className={styles.brandTextLead}>uchi</span>
            <span className={styles.brandTextAccent}>code</span>
            <span className={styles.brandTextDomain}>.ru</span>
          </span>
        </a>

        <button
          className={styles.collapsedBrandButton}
          type="button"
          aria-label="Развернуть меню"
          title="Развернуть меню"
          onClick={onToggleCollapse}
        >
          <img className={styles.brandIcon} src="/brand/uchicode-icon.png" alt="" aria-hidden="true" />
          <span className={styles.collapsedBrandToggle}>
            <SidebarToggleIcon />
          </span>
        </button>

        <button
          className={styles.collapseButton}
          type="button"
          aria-label={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
          aria-pressed={isCollapsed}
          title={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
          onClick={onToggleCollapse}
        >
          <SidebarToggleIcon />
        </button>

        <button
          className={styles.mobileCloseButton}
          type="button"
          aria-label="Закрыть навигацию"
          onClick={onCloseMobile}
        >
          <CloseIcon />
        </button>
      </div>

      <div className={styles.scrollArea}>
        <nav className={styles.navGroup} aria-label="Основная навигация">
          <span className={styles.groupTitle}>Основное</span>
          {primaryLinks.map((link) => (
            <SidebarLink
              key={link.href}
              {...link}
              isCollapsed={isCollapsed}
              onNavigate={handleNavigate}
            />
          ))}
        </nav>

        <nav className={styles.navGroup} aria-label="Обучение">
          <span className={styles.groupTitle}>Обучение</span>
          {learningLinks.map((link) => (
            <SidebarLink
              key={link.href}
              {...link}
              isCollapsed={isCollapsed}
              onNavigate={handleNavigate}
            />
          ))}
        </nav>

        <section className={styles.courseBlock} aria-labelledby="current-course-title">
          <span className={styles.groupTitle}>Текущий курс</span>
          <a
            className={clsx(
              styles.courseCard,
              isLinkActive(path, "/course") && styles.courseCardActive,
            )}
            href={toPath("/course")}
            aria-label={isCollapsed ? "ООП C++" : undefined}
            title={isCollapsed ? "ООП C++" : undefined}
            onClick={handleNavigate}
          >
            <span className={styles.courseMark} aria-hidden="true">
              <SidebarIcon icon="course" />
            </span>
            <span className={styles.courseInfo}>
              <strong id="current-course-title">ООП C++</strong>
              <small>{readySectionsCount} открытых разделов</small>
            </span>
          </a>
        </section>
      </div>

      <div className={styles.footer}>
        <button
          className={styles.aiButton}
          type="button"
          aria-label={isCollapsed ? "AI помощник" : undefined}
          title={isCollapsed ? "AI помощник" : undefined}
          onClick={openAiAssistant}
        >
          <span className={styles.linkIcon} aria-hidden="true">
            <SidebarIcon icon="ai" />
          </span>
          <span className={styles.linkLabel}>AI помощник</span>
        </button>
        <ProfileBlock isCollapsed={isCollapsed} onNavigate={handleNavigate} />
      </div>
    </aside>
  );
}
