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
  "базовая работа с файлами, если она понадобится перед ООП",
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
        <p className="lead">
          Этот курс будет идти перед ООП C++. Он нужен, чтобы спокойно разобрать базовые конструкции
          языка до классов и объектов.
        </p>
      </header>

      <section className="panel course-placeholder">
        <h2>Планируемые темы</h2>
        <ul className="plain-list">
          {plannedTopics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
        <p>
          Пока курс в разработке. Сейчас можно перейти к доступному курсу “ООП C++” и проходить открытые
          разделы.
        </p>
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
