import { courses } from "../../data/courses";
import { statusMeta } from "../../data/status";
import clsx from "clsx";
import { toPath } from "../../utils/slug";
import styles from "./CoursesPage.module.scss";

function CourseCardContent({
  action,
  course,
  isAvailable,
  meta,
}: {
  action: string;
  course: (typeof courses)[number];
  isAvailable: boolean;
  meta: (typeof statusMeta)[keyof typeof statusMeta];
}) {
  return (
    <>
      <div className={styles.header}>
        <span className={styles.number}>{course.order}</span>
        <span className={`status-badge status-badge--${meta.tone}`}>{meta.label}</span>
      </div>
      <div className={styles.body}>
        <h2>{course.title}</h2>
        <p>{course.description}</p>
      </div>
      <span
        className={clsx(
          "button",
          isAvailable ? "button--primary" : "button--ghost",
          styles.action,
        )}
        aria-hidden="true"
      >
        {action}
      </span>
    </>
  );
}

export function CoursesPage() {
  const sortedCourses = [...courses].sort((first, second) => first.order - second.order);

  return (
    <article className="reading-page compact-page route-page">
      <header className="page-header">
        <p className="eyebrow">Каталог</p>
        <h1>Курсы</h1>
        <p className="lead">Выберите курс, чтобы перейти к темам и задачам.</p>
      </header>

      <div className={styles.catalog}>
        {sortedCourses.map((course) => {
          const meta = statusMeta[course.status];
          const isAvailable = course.status === "available";
          const action = isAvailable ? "Открыть курс" : "Посмотреть план";

          return (
            <a
              className={clsx("panel", styles.card, styles.cardLink, !isAvailable && styles.cardSoon)}
              href={toPath(course.path)}
              key={course.id}
              aria-label={`${action}: ${course.title}`}
            >
              <CourseCardContent
                action={action}
                course={course}
                isAvailable={isAvailable}
                meta={meta}
              />
            </a>
          );
        })}
      </div>
    </article>
  );
}
