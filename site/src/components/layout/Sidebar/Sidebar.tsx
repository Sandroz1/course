import { useAuth } from "../../../context/AuthContext";
import { courseSections, isCourseSectionReady } from "../../../data/courseSections";
import { classNames } from "../../../shared/lib/classNames";
import { currentPath, toPath } from "../../../utils/slug";
import styles from "./Sidebar.module.scss";

type SidebarProps = {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
};

type NavigationLink = {
  href: string;
  label: string;
  shortLabel: string;
};

const primaryLinks: NavigationLink[] = [
  { href: "/", label: "Главная", shortLabel: "Г" },
  { href: "/courses", label: "Курсы", shortLabel: "К" },
  { href: "/tasks", label: "Задачи", shortLabel: "З" },
];

const learningLinks: NavigationLink[] = [
  { href: "/guide", label: "Как учиться", shortLabel: "У" },
  { href: "/common-errors", label: "Частые ошибки", shortLabel: "!" },
];

function isLinkActive(path: string, href: string) {
  if (href === "/") return path === "/";

  return path.startsWith(href);
}

function SidebarLink({
  href,
  isCollapsed,
  label,
  onNavigate,
  shortLabel,
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
      className={classNames(styles.link, isActive && styles.active)}
      href={toPath(href)}
      title={isCollapsed ? label : undefined}
      onClick={onNavigate}
    >
      <span className={styles.linkIcon} aria-hidden="true">
        {shortLabel}
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
            ↗
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
      className={classNames(
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
          <img className={styles.brandLogo} src="/brand/uchicode-logo.png" alt="Uchicode.ru" />
          <img className={styles.brandIcon} src="/brand/uchicode-icon.png" alt="" aria-hidden="true" />
        </a>

        <button
          className={styles.collapseButton}
          type="button"
          aria-label={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
          aria-pressed={isCollapsed}
          title={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
          onClick={onToggleCollapse}
        >
          <span aria-hidden="true">{isCollapsed ? "›" : "‹"}</span>
        </button>

        <button
          className={styles.mobileCloseButton}
          type="button"
          aria-label="Закрыть навигацию"
          onClick={onCloseMobile}
        >
          <span aria-hidden="true">×</span>
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
            className={classNames(
              styles.courseCard,
              isLinkActive(path, "/course") && styles.courseCardActive,
            )}
            href={toPath("/course")}
            aria-label={isCollapsed ? "ООП C++" : undefined}
            title={isCollapsed ? "ООП C++" : undefined}
            onClick={handleNavigate}
          >
            <span className={styles.courseMark} aria-hidden="true">
              C++
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
          aria-label={isCollapsed ? "Открыть AI помощник" : undefined}
          title={isCollapsed ? "AI помощник" : undefined}
          onClick={openAiAssistant}
        >
          <span className={styles.linkIcon} aria-hidden="true">
            AI
          </span>
          <span className={styles.linkLabel}>AI помощник</span>
        </button>
        <ProfileBlock isCollapsed={isCollapsed} onNavigate={handleNavigate} />
      </div>
    </aside>
  );
}
