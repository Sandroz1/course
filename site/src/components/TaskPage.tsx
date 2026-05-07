import { useState } from "react";
import { courseSections, isCourseSectionReady } from "../data/courseSections";
import { getCourseById } from "../data/courses";
import { getStatusLabel } from "../data/status";
import { tasks } from "../data/tasks";
import { toPath } from "../utils/slug";
import { CodeBlock } from "./CodeBlock";
import { ProgressBadge } from "./ProgressBadge";

function fileCountLabel(count: number) {
  if (count === 1) return "1 файл";
  if (count >= 2 && count <= 4) return `${count} файла`;
  return `${count} файлов`;
}

export function TaskPage({ taskId }: { taskId: string }) {
  const task = tasks.find((item) => item.id === taskId);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  if (!task) {
    return (
      <div className="panel">
        <h1>Задача не найдена</h1>
      </div>
    );
  }

  const theory = courseSections.find((section) => section.slug === task.theorySlug);
  const hasClosedTheory =
    task.status === "needs-theory" || (theory ? !isCourseSectionReady(theory) : false);
  const course = getCourseById(task.courseId);
  const activeFile = task.files[activeFileIndex];

  return (
    <article className="reading-page task-page">
      <header className="task-header">
        <a className="back-link" href={toPath("/tasks")}>
          К задачам
        </a>
        <p className="eyebrow">{task.section}</p>
        <h1>{task.title}</h1>
        <div className="task-summary">
          <ProgressBadge level={task.level} />
          <span>{course?.shortTitle ?? "Курс"}</span>
          <span>{fileCountLabel(task.files.length)}</span>
          <span className={hasClosedTheory ? "status-badge status-badge--warning" : "status-badge status-badge--success"}>
            {hasClosedTheory ? getStatusLabel("needs-theory") : getStatusLabel(task.status ?? "available")}
          </span>
        </div>
      </header>

      {hasClosedTheory && (
        <section className="panel task-theory-note">
          <strong>Теория к этой задаче ещё закрыта</strong>
          <p>
            Лучше сначала пройти готовые разделы до “this”. Эту задачу можно
            открыть, но объяснение темы пока на доработке.
          </p>
        </section>
      )}

      <section className="panel task-goal">
        <h2>Условие</h2>
        <p>{task.goal}</p>
        <p>{task.description}</p>
      </section>

      <section className="panel task-plain-panel">
        <h2>Что создать</h2>
        <ul>
          {task.whatToCreate.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel task-code-panel">
        <h2>Файлы и каркас кода</h2>
        <p className="muted-text">
          Основной файл: <code>{task.practicePath}</code>
        </p>

        <div className="file-list" role="tablist" aria-label="Файлы задачи">
          {task.files.map((file, index) => (
            <button
              key={file.fileName}
              className={index === activeFileIndex ? "file-tab file-tab--active" : "file-tab"}
              type="button"
              onClick={() => setActiveFileIndex(index)}
            >
              {file.fileName.split("/").pop()}
            </button>
          ))}
        </div>

        <p>{activeFile.description}</p>
        <CodeBlock code={activeFile.starterCode} language="cpp" />
      </section>

      {task.todoGuide && task.todoGuide.length > 0 && (
        <section className="panel task-plain-panel">
          <h2>Что писать вместо TODO</h2>
          <ol>
            {task.todoGuide.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      )}

      <section className="panel task-plain-panel">
        <h2>План решения</h2>
        <ol>
          {task.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="panel task-plain-panel">
        <h2>Подсказки</h2>
        <ul>
          {task.hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      </section>

      <section className="panel task-plain-panel">
        <h2>Частые ошибки</h2>
        <ul>
          {task.commonMistakes.map((mistake) => (
            <li key={mistake}>{mistake}</li>
          ))}
        </ul>
      </section>

      <section className="panel task-plain-panel">
        <h2>Самопроверка</h2>
        <ul>
          {task.selfCheck.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel task-plain-panel task-note-panel">
        <h2>Не смотри готовый ответ сразу</h2>
        <p>
          Сначала напиши свой вариант и проверь его по чек-листу. Готовый код
          полезен только после попытки, иначе задача перестаёт тренировать мышление.
        </p>
      </section>

      {theory && (
        <section className="panel task-plain-panel">
          <h2>Повторить теорию</h2>
          <p>
            {hasClosedTheory
              ? "Раздел пока откроется как заглушка, без недоработанной теории."
              : "Если стало непонятно, вернись к разделу перед продолжением задачи."}
          </p>
          <a className="button button--small" href={toPath(`/course/${theory.slug}`)}>
            Открыть: {theory.title}
          </a>
        </section>
      )}
    </article>
  );
}
