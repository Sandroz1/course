import { courseSections } from "../data/courseSections";
import { toPath } from "../utils/slug";

export function CourseIndexPage() {
  return (
    <article className="reading-page compact-page">
      <h1>Курс</h1>
      <p className="lead">
        Иди по разделам сверху вниз: сначала базовый C++, затем структуры,
        классы и большие задачи.
      </p>

      <div className="course-list">
        {courseSections.map((section) => (
          <a
            className="panel course-row"
            key={section.slug}
            href={toPath(`/course/${section.slug}`)}
          >
            <span className="course-row__number">{section.number}</span>
            <span>
              <strong>{section.title}</strong>
            </span>
          </a>
        ))}
      </div>
    </article>
  );
}
