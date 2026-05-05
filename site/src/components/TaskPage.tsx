import { useState } from "react";
import { courseSections } from "../data/courseSections";
import { tasks } from "../data/tasks";
import { toPath } from "../utils/slug";
import { CodeBlock } from "./CodeBlock";
import { ProgressBadge } from "./ProgressBadge";

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
  const activeFile = task.files[activeFileIndex];

  return (
    <article className="reading-page task-page">
      <p className="eyebrow">{task.section}</p>
      <h1>{task.title}</h1>

      <div className="task-summary">
        <ProgressBadge level={task.level} />
      </div>

      <section className="panel important-panel">
        <h2>Цель</h2>
        <p>{task.goal}</p>
        <p>{task.description}</p>
      </section>

      <section className="panel">
        <h2>Что создать</h2>
        <ul>
          {task.whatToCreate.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {task.todoGuide && task.todoGuide.length > 0 && (
        <section className="panel todo-panel">
          <h2>Что писать вместо TODO</h2>
          <ol>
            {task.todoGuide.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      )}

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

      <section className="panel">
        <h2>План решения</h2>
        <ol>
          {task.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="panel hint-panel">
        <h2>Подсказки</h2>
        <ul>
          {task.hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      </section>

      <section className="panel error-panel">
        <h2>Частые ошибки</h2>
        <ul>
          {task.commonMistakes.map((mistake) => (
            <li key={mistake}>{mistake}</li>
          ))}
        </ul>
      </section>

      <section className="panel check-panel">
        <h2>Самопроверка</h2>
        <ul>
          {task.selfCheck.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel warning-panel">
        <h2>Не смотри готовый ответ сразу</h2>
        <p>
          Сначала напиши свой вариант и проверь его по чек-листу. Готовый код
          полезен только после попытки, иначе задача перестаёт тренировать мышление.
        </p>
      </section>

      {theory && (
        <section className="panel">
          <h2>Повторить теорию</h2>
          <p>Если стало непонятно, вернись к разделу перед продолжением задачи.</p>
          <a className="button button--small" href={toPath(`/course/${theory.slug}`)}>
            Открыть: {theory.title}
          </a>
        </section>
      )}
    </article>
  );
}
