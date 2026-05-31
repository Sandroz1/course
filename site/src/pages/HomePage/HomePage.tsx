import clsx from "clsx";
import { LinkButton } from "../../components/shared/ActionButton/ActionButton";
import { courses } from "../../data/courses";
import { statusMeta } from "../../data/status";
import { toPath } from "../../utils/slug";
import styles from "./HomePage.module.scss";

const featuredCourseIds = new Set(["base-cpp", "oop-cpp"]);

const quickLinks = [
  {
    title: "Задачи",
    text: "Практика по темам курса.",
    href: "/tasks",
  },
  {
    title: "Как учиться",
    text: "Порядок работы над задачей.",
    href: "/guide",
  },
  {
    title: "Частые ошибки",
    text: "Причины ошибок и примеры исправлений.",
    href: "/common-errors",
  },
];

export function HomePage() {
  const featuredCourses = courses.filter((course) => featuredCourseIds.has(course.id));

  return (
    <article className={clsx("reading-page compact-page route-page", styles.root)}>
      <header className="page-header">
        <p className="eyebrow">Учебная панель</p>
        <h1>Uchicode</h1>
        <p className="lead">
          Курсы C++ с темами, задачами и короткой методикой работы.
        </p>

        <div className="actions">
          <LinkButton href={toPath("/courses")} variant="primary">
            Открыть курсы
          </LinkButton>
          <LinkButton href={toPath("/tasks")} variant="ghost">
            Решать задачи
          </LinkButton>
        </div>
      </header>

      <section className={clsx("panel", styles.courseCard)}>
        <div>
          <h2>Курсы</h2>
          <p>Выберите курс, чтобы перейти к темам и задачам.</p>
          <p>Статус показывает, какие материалы уже можно открывать.</p>
        </div>

        <div className={styles.courseMiniList}>
          {featuredCourses.map((course) => {
            const meta = statusMeta[course.status];

            return (
              <a className={styles.courseMiniCard} href={toPath(course.path)} key={course.id}>
                <strong>{course.title}</strong>
                <span className={`status-badge status-badge--${meta.tone}`}>
                  {meta.label}
                </span>
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
