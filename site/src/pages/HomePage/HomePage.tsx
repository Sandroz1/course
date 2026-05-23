import { courses } from "../../data/courses";
import { statusMeta } from "../../data/status";
import clsx from "clsx";
import { toPath } from "../../utils/slug";
import styles from "./HomePage.module.scss";

const quickLinks = [
  { title: "Как учиться", text: "Порядок работы и проверка решения.", href: "/guide" },
  { title: "Частые ошибки", text: "Пример ошибок с которыми можно столкнуться.", href: "/common-errors" },
];

export function HomePage() {
  const baseCourse = courses.find((course) => course.id === "base-cpp");
  const oopCourse = courses.find((course) => course.id === "oop-cpp");

  return (
    <article className="reading-page compact-page route-page">
      <header className="page-header">
        <p className="eyebrow">Учебная панель</p>
        <h1>Uchicode</h1>
        <p className="lead">Курсы C++ с уроками, задачами и короткой методикой работы.</p>
        <div className="actions">
          <a className="button button--primary" href={toPath("/courses")}>
            Открыть курсы
          </a>
          <a className="button button--ghost" href={toPath("/tasks")}>
            Практика ООП
          </a>
        </div>
      </header>

      <section className={clsx("panel", styles.courseCard)}>
        <div>
          <p className="eyebrow">Сейчас доступно</p>
          <h2>Курсы</h2>
          <p>Открыты: условия и циклы for, while, do while. На доработке: ранние темы.</p>
        </div>
        <div className={styles.courseMiniList}>
          {[baseCourse, oopCourse].filter(Boolean).map((course) => {
            const meta = statusMeta[course!.status];
            return (
              <a className={styles.courseMiniCard} href={toPath(course!.path)} key={course!.id}>
                <strong>{course!.title}</strong>
                <span className={`status-badge status-badge--${meta.tone}`}>{meta.label}</span>
              </a>
            );
          })}
        </div>
      </section>

      <section className={styles.quickLinks} aria-label="Быстрые переходы">
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
