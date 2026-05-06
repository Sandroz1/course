import { toPath } from "../utils/slug";

export function HomePage() {
  return (
    <article className="home-page">
      <section className="home-hero">
        <h1>ООП C++ с нуля</h1>
        <p className="lead">
          Если не знаешь, с чего начать, открой “Подготовку”, разбери
          минимальную программу и реши первую задачу в отдельном .cpp файле.
        </p>
        <div className="actions">
          <a className="button button--primary" href={toPath("/course/basics")}>
            Открыть подготовку
          </a>
          <a className="button" href={toPath("/tasks/00-01-minimal-program")}>
            Первая задача
          </a>
          <a className="button button--ghost" href={toPath("/guide")}>
            Как учиться
          </a>
        </div>
      </section>

      <section className="panel study-flow">
        <h2>Рабочий порядок</h2>
        <div className="flow-steps" aria-label="Рабочий порядок">
          <div>
            <strong>Теория</strong>
            <span>Прочитать тему и примеры.</span>
          </div>
          <div>
            <strong>Задача</strong>
            <span>Открыть карточку задачи.</span>
          </div>
          <div>
            <strong>.cpp файл</strong>
            <span>Создать файл локально и написать код.</span>
          </div>
          <div>
            <strong>Самопроверка</strong>
            <span>Сверить решение по чек-листу.</span>
          </div>
        </div>
      </section>

      <section className="quick-start">
        <a className="panel quick-card" href={toPath("/course")}>
          <h2>Курс</h2>
          <p>Список тем.</p>
        </a>
        <a className="panel quick-card" href={toPath("/tasks")}>
          <h2>Задачи</h2>
          <p>Открыть практику.</p>
        </a>
        <a className="panel quick-card" href={toPath("/common-errors")}>
          <h2>Частые ошибки</h2>
          <p>Если код не компилируется.</p>
        </a>
        <a className="panel quick-card" href={toPath("/check")}>
          <h2>Проверка себя</h2>
          <p>Понять, что тема усвоена.</p>
        </a>
      </section>

    </article>
  );
}
