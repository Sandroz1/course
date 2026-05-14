import { courses } from "../../data/courses";
import { statusMeta } from "../../data/status";
import { classNames } from "../../shared/lib/classNames";
import { toPath } from "../../utils/slug";
import styles from "./CoursesPage.module.scss";

export function CoursesPage() {
  const sortedCourses = [...courses].sort((first, second) => first.order - second.order);

  return (
    <article className="reading-page compact-page route-page">
      <header className="page-header">
        <p className="eyebrow">Курсы</p>
        <h1>Курсы</h1>
        <p className="lead">Выбери доступный курс или посмотри, что готовится.</p>
      </header>

      <div className={styles.catalog}>
        {sortedCourses.map((course) => {
          const meta = statusMeta[course.status];
          const isAvailable = course.status === "available";
          return (
            <article
              className={classNames("panel", styles.card, !isAvailable && styles.cardSoon)}
              key={course.id}
            >
              <div className={styles.header}>
                <span className={styles.number}>{course.order}</span>
                <span className={`status-badge status-badge--${meta.tone}`}>{meta.label}</span>
              </div>
              <div className={styles.body}>
                <h2>{course.title}</h2>
                <p>{course.description}</p>
              </div>
              <a className={isAvailable ? "button button--primary" : "button button--ghost"} href={toPath(course.path)}>
                {isAvailable ? "Открыть курс" : "Посмотреть план"}
              </a>
            </article>
          );
        })}
      </div>
    </article>
  );
}
