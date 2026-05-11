import { courses } from "../data/courses";
import { statusMeta } from "../data/status";
import { toPath } from "../utils/slug";

const quickLinks = [
  { title: "Задачи", href: "/tasks" },
  { title: "Гайд", href: "/guide" },
  { title: "Ошибки", href: "/common-errors" },
  { title: "Самопроверка", href: "/check" },
];

export function HomePage() {
  const baseCourse = courses.find((course) => course.id === "base-cpp");
  const oopCourse = courses.find((course) => course.id === "oop-cpp");

  return (
    <article className="home-page dashboard-page">
      <section className="home-hero app-hero">
        <p className="eyebrow">Учебная панель</p>
        <h1>Курс C++</h1>
        <p className="lead">Теория, задачи и самопроверка в одном месте.</p>
        <div className="actions">
          <a className="button button--primary" href={toPath("/course")}>
            Продолжить курс
          </a>
          <a className="button button--ghost" href={toPath("/courses")}>
            Все курсы
          </a>
        </div>
      </section>

      <section className="panel base-course-card">
        <div>
          <p className="eyebrow">Маршрут обучения</p>
          <h2>Курсы</h2>
          <p>Доступен курс ООП C++. База C++ готовится.</p>
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

      <section className="panel study-flow">
        <h2>Как заниматься</h2>
        <div className="flow-steps" aria-label="Рабочий порядок">
          <div>
            <strong>Теория</strong>
            <span>Прочитать тему и примеры.</span>
          </div>
          <div>
            <strong>Задача</strong>
            <span>Открыть карточку задачи.</span>
          </div>
          <div>
            <strong>Код</strong>
            <span>Написать решение.</span>
          </div>
          <div>
            <strong>Проверка</strong>
            <span>Свериться с чек-листом.</span>
          </div>
        </div>
      </section>

      <section className="quick-links" aria-label="Быстрые переходы">
        {quickLinks.map((link) => (
          <a href={toPath(link.href)} key={link.href}>
            {link.title}
          </a>
        ))}
      </section>
    </article>
  );
}
