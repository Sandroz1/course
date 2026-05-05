import { courseSections } from "../data/courseSections";
import { currentPath, toPath } from "../utils/slug";

const mainLinks = [
  { href: "/", label: "Главная" },
  { href: "/course", label: "Курс" },
  { href: "/tasks", label: "Задачи" },
  { href: "/guide", label: "Как учиться" },
  { href: "/common-errors", label: "Частые ошибки" },
  { href: "/check", label: "Проверка себя" },
];

export function Sidebar() {
  const path = currentPath();
  const showCourseSections = path === "/course" || path.startsWith("/course/");

  return (
    <aside className="sidebar">
      <a className="sidebar__brand" href={toPath("/")}>
        ООП C++
      </a>

      <nav className="sidebar__nav" aria-label="Основная навигация">
        {mainLinks.map((link) => {
          const isActive = link.href === "/" ? path === "/" : path.startsWith(link.href);
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
              return (
                <a
                  aria-current={isActive ? "page" : undefined}
                  className={isActive ? "is-active" : undefined}
                  key={section.slug}
                  href={toPath(sectionPath)}
                >
                  <span>{section.number}</span>
                  {section.title}
                </a>
              );
            })}
          </nav>
        </>
      )}
    </aside>
  );
}
