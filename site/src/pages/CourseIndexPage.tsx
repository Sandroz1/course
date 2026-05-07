import { courseSections, isCourseSectionReady } from "../data/courseSections";
import { statusMeta } from "../data/status";
import { toPath } from "../utils/slug";

function CourseSectionRow({ slug, number, title, description, status }: (typeof courseSections)[number]) {
  const isReady = status === "available" || status === "ready";
  const meta = statusMeta[status];

  return (
    <a
      className={isReady ? "panel course-row" : "panel course-row course-row--in-progress"}
      href={toPath(`/course/${slug}`)}
    >
      <span className="course-row__number">{number}</span>
      <span className="course-row__body">
        <span className="course-row__title">
          <strong>{title}</strong>
          <span className={`status-badge status-badge--${isReady ? "success" : meta.tone}`}>
            {isReady ? statusMeta.ready.label : meta.label}
          </span>
        </span>
        <span className="course-row__description">
          {isReady
            ? description
            : "Тема пока закрыта, чтобы не показывать недоработанное объяснение."}
        </span>
      </span>
      <span className={isReady ? "course-row__action" : "course-row__action course-row__action--muted"}>
        {isReady ? "Открыть" : "Скоро"}
      </span>
    </a>
  );
}

export function CourseIndexPage() {
  const readySections = courseSections.filter(isCourseSectionReady);
  const plannedSections = courseSections.filter((section) => !isCourseSectionReady(section));

  return (
    <article className="reading-page compact-page route-page">
      <header className="page-header">
        <a className="back-link" href={toPath("/courses")}>
          Все курсы
        </a>
        <p className="eyebrow">Доступный курс</p>
        <h1>ООП C++</h1>
        <p className="lead">
          Иди сверху вниз. Сейчас открыты первые {readySections.length} уроков, остальные темы
          появятся после доработки.
        </p>
      </header>

      <section className="course-progress panel">
        <div>
          <strong>Порядок прохождения</strong>
          <span>Теория → задача → .cpp файл → самопроверка</span>
        </div>
        <div>
          <strong>{readySections.length} открыто</strong>
          <span>{plannedSections.length} тем на доработке</span>
        </div>
      </section>

      <section className="course-group">
        <div className="section-heading">
          <h2>Открытые уроки</h2>
          <span>{readySections.length}</span>
        </div>
        <div className="course-list">
          {readySections.map((section) => (
            <CourseSectionRow key={section.slug} {...section} />
          ))}
        </div>
      </section>

      <section className="course-group">
        <div className="section-heading">
          <h2>Позже</h2>
          <span>{plannedSections.length}</span>
        </div>
        <div className="course-list">
          {plannedSections.map((section) => (
            <CourseSectionRow key={section.slug} {...section} />
          ))}
        </div>
      </section>
    </article>
  );
}
