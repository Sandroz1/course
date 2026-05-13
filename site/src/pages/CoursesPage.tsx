import { courses } from "../data/courses";
import { statusMeta } from "../data/status";
import { toPath } from "../utils/slug";

export function CoursesPage() {
  const sortedCourses = [...courses].sort((first, second) => first.order - second.order);

  return (
    <article className="reading-page compact-page route-page">
      <header className="page-header">
        <p className="eyebrow">Курсы</p>
        <h1>Курсы</h1>
        <p className="lead">Выбери доступный курс или посмотри, что готовится.</p>
      </header>

      <div className="course-catalog">
        {sortedCourses.map((course) => {
          const meta = statusMeta[course.status];
          const isAvailable = course.status === "available";
          return (
            <article
              className={isAvailable ? "panel course-card" : "panel course-card course-card--soon"}
              key={course.id}
            >
              <div className="course-card__header">
                <span className="course-row__number">{course.order}</span>
                <span className={`status-badge status-badge--${meta.tone}`}>{meta.label}</span>
              </div>
              <div className="course-card__body">
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
