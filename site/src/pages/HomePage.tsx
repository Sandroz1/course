import { courses } from "../data/courses";
import { statusMeta } from "../data/status";
import { toPath } from "../utils/slug";

const quickLinks = [
  { title: "Курс ООП C++", text: "Открытая теория и порядок уроков.", href: "/course" },
  { title: "Задачи", text: "Практика по темам курса.", href: "/tasks" },
  { title: "Как учиться", text: "Порядок работы и проверка решения.", href: "/guide" },
];

export function HomePage() {
  const baseCourse = courses.find((course) => course.id === "base-cpp");
  const oopCourse = courses.find((course) => course.id === "oop-cpp");

  return (
    <article className="reading-page compact-page route-page">
      <header className="page-header">
        <p className="eyebrow">Учебная панель</p>
        <h1>Uchicode</h1>
        <p className="lead">Курс C++ с уроками, задачами и короткой методикой работы.</p>
        <div className="actions">
          <a className="button button--primary" href={toPath("/course")}>
            Открыть ООП C++
          </a>
          <a className="button button--ghost" href={toPath("/tasks")}>
            Задачи
          </a>
        </div>
      </header>

      <section className="panel base-course-card">
        <div>
          <p className="eyebrow">Сейчас доступно</p>
          <h2>Курсы</h2>
          <p>ООП C++ открыт. База C++ пока в плане.</p>
        </div>
        <div className="course-mini-list">
          {[baseCourse, oopCourse].filter(Boolean).map((course) => {
            const meta = statusMeta[course!.status];
            return (
              <a className="course-mini-card" href={toPath(course!.path)} key={course!.id}>
                <strong>{course!.title}</strong>
                <span className={`status-badge status-badge--${meta.tone}`}>{meta.label}</span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="quick-links quick-links--cards" aria-label="Быстрые переходы">
        {quickLinks.map((link) => (
          <a href={toPath(link.href)} key={link.href}>
            <strong>{link.title}</strong>
            <span>{link.text}</span>
          </a>
        ))}
      </section>
    </article>
  );
}
