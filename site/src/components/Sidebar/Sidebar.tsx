import { courseSections, isCourseSectionReady } from "../../data/courseSections";
import { statusMeta } from "../../data/status";
import { classNames } from "../../shared/lib/classNames";
import { currentPath, toPath } from "../../utils/slug";
import styles from "./Sidebar.module.scss";

const mainLinks = [
  { href: "/", label: "Главная" },
  { href: "/courses", label: "Курсы" },
  { href: "/tasks", label: "Задачи" },
  { href: "/guide", label: "Как учиться" },
  { href: "/common-errors", label: "Частые ошибки" },
  { href: "/check", label: "Самопроверка" },
];

export function Sidebar() {
  const path = currentPath();
  const showCourseSections = path === "/course" || path.startsWith("/course/");

  return (
    <aside className={styles.root}>
      <a className={styles.brand} href={toPath("/")}>
        Uchicode
      </a>

      <nav className={styles.nav} aria-label="Основная навигация">
        {mainLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? path === "/"
              : link.href === "/courses"
                ? path.startsWith("/courses") || path.startsWith("/course")
                : path.startsWith(link.href);
          return (
            <a
              aria-current={isActive ? "page" : undefined}
              className={classNames(styles.link, isActive && styles.active)}
              href={toPath(link.href)}
              key={link.href}
            >
              {link.label}
            </a>
          );
        })}
      </nav>

      {showCourseSections && (
        <>
          <div className={styles.sectionTitle}>Разделы курса</div>
          <nav className={styles.chapters} aria-label="Разделы курса">
            {courseSections.map((section) => {
              const sectionPath = `/course/${section.slug}`;
              const isActive = path === sectionPath;
              const isReady = isCourseSectionReady(section);
              return (
                <a
                  aria-current={isActive ? "page" : undefined}
                  className={classNames(
                    styles.chapterLink,
                    isActive && styles.active,
                    !isReady && styles.chapterInProgress,
                  )}
                  key={section.slug}
                  href={toPath(sectionPath)}
                >
                  <span className={styles.chapterNumber}>{section.number}</span>
                  <span className={styles.chapterTitle}>{section.title}</span>
                  {!isReady && <span className={styles.chapterStatus}>{statusMeta.soon.label}</span>}
                </a>
              );
            })}
          </nav>
        </>
      )}
    </aside>
  );
}
