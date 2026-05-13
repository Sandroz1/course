import { statusMeta } from "../data/status";
import { toPath } from "../utils/slug";

const plannedTopics = [
  "переменные и типы данных",
  "ввод и вывод",
  "условия",
  "циклы",
  "функции",
  "массивы",
  "строки",
  "базовая работа с файлами",
];

export function BaseCppCoursePage() {
  const meta = statusMeta.soon;

  return (
    <article className="reading-page compact-page route-page">
      <header className="page-header">
        <a className="back-link" href={toPath("/courses")}>
          К курсам
        </a>
        <p className="eyebrow">Будущий курс</p>
        <h1>База C++</h1>
        <span className={`status-badge status-badge--${meta.tone}`}>{meta.label}</span>
        <p className="lead">Раздел появится позже. Сейчас открыт курс ООП C++.</p>
      </header>

      <section className="panel course-placeholder">
        <h2>Планируемые темы</h2>
        <ul className="plain-list">
          {plannedTopics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
        <div className="actions">
          <a className="button button--primary" href={toPath("/course")}>
            Открыть ООП C++
          </a>
          <a className="button button--ghost" href={toPath("/courses")}>
            Все курсы
          </a>
        </div>
      </section>
    </article>
  );
}
