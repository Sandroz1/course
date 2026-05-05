import { courseSections } from "../data/courseSections";
import { toPath } from "../utils/slug";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <a className="sidebar__brand" href={toPath("/")}>
        ООП C++
      </a>
      <nav>
        <a href={toPath("/course")}>Курс</a>
        <a href={toPath("/tasks")}>Задачи</a>
        <a href={toPath("/guide")}>Как учиться</a>
        <a href={toPath("/common-errors")}>Частые ошибки</a>
        <a href={toPath("/check")}>Проверка себя</a>
      </nav>
      <div className="sidebar__section-title">Главы</div>
      <nav className="sidebar__chapters">
        {courseSections.map((section) => (
          <a key={section.slug} href={toPath(`/course/${section.slug}`)}>
            {section.number}. {section.title}
          </a>
        ))}
      </nav>
    </aside>
  );
}
