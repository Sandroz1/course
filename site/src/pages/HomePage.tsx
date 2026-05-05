import { toPath } from "../utils/slug";

export function HomePage() {
  return (
    <article className="home-page">
      <section className="home-hero">
        <h1>ООП C++ с нуля</h1>
        <p className="lead">
          Курс с теорией, задачами и каркасами кода. Читаешь тему,
          решаешь задачу, проверяешь себя.
        </p>
        <div className="actions">
          <a className="button button--primary" href={toPath("/course")}>
            Начать обучение
          </a>
          <a className="button" href={toPath("/tasks")}>
            Открыть задачи
          </a>
          <a className="button button--ghost" href={toPath("/guide")}>
            Как учиться
          </a>
        </div>
      </section>

      <section className="panel">
        <h2>Как заниматься</h2>
        <ol className="route-list">
          <li>Прочитать тему.</li>
          <li>Повторить пример руками.</li>
          <li>Открыть задачу.</li>
          <li>Создать или открыть `.cpp` файл.</li>
          <li>Скопировать каркас, если он нужен.</li>
          <li>Написать решение вместо TODO.</li>
          <li>Проверить себя по чек-листу.</li>
        </ol>
      </section>

      <section className="quick-start">
        <a className="panel quick-card" href={toPath("/course/basics")}>
          <h2>Подготовка</h2>
          <p>Минимальная программа, ввод, вывод, условия и циклы.</p>
        </a>
        <a className="panel quick-card" href={toPath("/tasks/00-01-minimal-program")}>
          <h2>Минимальная программа</h2>
          <p>Открой каркас и напиши первый рабочий `main`.</p>
        </a>
      </section>
    </article>
  );
}
