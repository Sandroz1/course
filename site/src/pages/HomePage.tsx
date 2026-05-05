import { toPath } from "../utils/slug";

export function HomePage() {
  return (
    <div className="home-page">
      <section className="hero panel">
        <p className="eyebrow">Учебник и практика</p>
        <h1>ООП C++ с нуля</h1>
        <p className="lead">
          Это учебник и навигатор по практике: теория читается на сайте, а код
          пишется локально в файлах из <code>practice</code>. Ответы не нужны до
          собственной попытки: сначала думать, потом проверять.
        </p>
        <div className="actions">
          <a className="button button--primary" href={toPath("/course")}>
            Читать курс
          </a>
          <a className="button" href={toPath("/tasks")}>
            Открыть задачи
          </a>
          <a className="button" href={toPath("/guide")}>
            Как учиться
          </a>
          <a className="button" href={toPath("/common-errors")}>
            Частые ошибки
          </a>
        </div>
      </section>

      <section className="learning-route panel">
        <h2>Маршрут занятия</h2>
        <ol className="steps-list">
          <li>Прочитайте тему.</li>
          <li>Перепишите пример руками.</li>
          <li>Откройте задачу по теме.</li>
          <li>Создайте или откройте локальный `.cpp` файл.</li>
          <li>Скопируйте каркас, если он нужен.</li>
          <li>Допишите решение вместо TODO.</li>
          <li>Проверьте себя по чек-листу.</li>
        </ol>
      </section>

      <section className="columns">
        <div className="panel">
          <h2>Теория</h2>
          <p>
            Разделы объясняют не только “что написать”, но и зачем нужна конструкция,
            когда её применять и какие ошибки обычно возникают.
          </p>
        </div>
        <div className="panel">
          <h2>Практика</h2>
          <p>
            Каждая задача содержит цель, файлы, план решения, подсказки и
            самопроверку. Блок “Что писать вместо TODO” показывает маршрут к решению,
            но не даёт готовый код.
          </p>
        </div>
        <div className="panel">
          <h2>Первый шаг</h2>
          <p>Начните с минимальной программы C++.</p>
          <p>
            <code>practice/00_basics/ex01_minimal_program.cpp</code>
          </p>
          <a className="text-link" href={toPath("/tasks/00-01-minimal-program")}>
            Открыть первую задачу
          </a>
        </div>
      </section>
    </div>
  );
}
