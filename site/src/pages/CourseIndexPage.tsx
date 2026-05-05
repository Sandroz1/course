import { courseSections } from "../data/courseSections";
import { toPath } from "../utils/slug";

export function CourseIndexPage() {
  return (
    <article className="reading-page">
      <h1>Курс</h1>
      <p className="lead">
        Это полноценный учебник для новичка: подробные объяснения, примеры,
        антипримеры, частые ошибки и набор задач после каждой темы.
      </p>
      <div className="card-list">
        {courseSections.map((section) => (
          <a
            className="panel card-link"
            key={section.slug}
            href={toPath(`/course/${section.slug}`)}
          >
            <span className="eyebrow">Раздел {section.number}</span>
            <h2>{section.title}</h2>
            <p>{section.description}</p>
          </a>
        ))}
      </div>
    </article>
  );
}
