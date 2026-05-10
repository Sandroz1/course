import { courseSections, isCourseSectionReady } from "../data/courseSections";
import { statusMeta } from "../data/status";
import { useAuth } from "../context/AuthContext";
import { currentPath, toPath } from "../utils/slug";

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
  const { isAuthenticated } = useAuth();
  const showCourseSections = path === "/course" || path.startsWith("/course/");
  const navLinks = [
    ...mainLinks,
    isAuthenticated ? { href: "/profile", label: "Профиль" } : { href: "/login", label: "Войти" },
  ];

  return (
    <aside className="sidebar">
      <a className="sidebar__brand" href={toPath("/")}>
        C++ учебник
      </a>

      <nav className="sidebar__nav" aria-label="Основная навигация">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? path === "/"
              : link.href === "/courses"
                ? path.startsWith("/courses") || path.startsWith("/course")
                : path.startsWith(link.href);
          return (
            <a
              aria-current={isActive ? "page" : undefined}
              className={isActive ? "is-active" : undefined}
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
          <div className="sidebar__section-title">Разделы курса</div>
          <nav className="sidebar__chapters" aria-label="Разделы курса">
            {courseSections.map((section) => {
              const sectionPath = `/course/${section.slug}`;
              const isActive = path === sectionPath;
              const isReady = isCourseSectionReady(section);
              return (
                <a
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    isActive ? "is-active" : "",
                    isReady ? "" : "sidebar__chapter--in-progress",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={section.slug}
                  href={toPath(sectionPath)}
                >
                  <span className="sidebar__chapter-number">{section.number}</span>
                  <span className="sidebar__chapter-title">{section.title}</span>
                  {!isReady && <span className="sidebar__chapter-status">{statusMeta.soon.label}</span>}
                </a>
              );
            })}
          </nav>
        </>
      )}
    </aside>
  );
}
