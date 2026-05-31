import { courses } from "../../data/courses";
import { statusMeta } from "../../data/status";
import clsx from "clsx";
import { LinkButton } from "../../components/shared/ActionButton/ActionButton";
import { toPath } from "../../utils/slug";
import styles from "./CoursesPage.module.scss";

export function CoursesPage() {
  const sortedCourses = [...courses].sort((first, second) => first.order - second.order);

  return (
    <article className="reading-page compact-page route-page">
      <header className="page-header">
        <p className="eyebrow">Курсы</p>
        <h1>Курсы</h1>
        <p className="lead">Выберите курс, чтобы перейти к темам и задачам.</p>
      </header>

      <div className={styles.catalog}>
        {sortedCourses.map((course) => {
          const meta = statusMeta[course.status];
          const isAvailable = course.status === "available";
          return (
            <article
              className={clsx("panel", styles.card, !isAvailable && styles.cardSoon)}
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
              <LinkButton
                href={toPath(course.path)}
                variant={isAvailable ? "primary" : "ghost"}
              >
                {isAvailable ? "Открыть курс" : "Посмотреть план"}
              </LinkButton>
            </article>
          );
        })}
      </div>
    </article>
  );
}
