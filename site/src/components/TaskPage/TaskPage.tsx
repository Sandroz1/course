import { useState } from "react";
import { courseSections, isCourseSectionReady } from "../../data/courseSections";
import { getCourseById } from "../../data/courses";
import { getStatusLabel } from "../../data/status";
import { tasks } from "../../data/tasks";
import { classNames } from "../../shared/lib/classNames";
import { toPath } from "../../utils/slug";
import { CodeBlock } from "../CodeBlock/CodeBlock";
import { ProgressBadge } from "../ProgressBadge/ProgressBadge";
import styles from "./TaskPage.module.scss";

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
    <article className={classNames("reading-page", styles.root)}>
      <header className={styles.header}>
        <a className="back-link" href={toPath("/tasks")}>
          К задачам
        </a>
        <p className="eyebrow">{task.section}</p>
        <h1>{task.title}</h1>
        <div className={styles.summary}>
          <ProgressBadge level={task.level} />
          <span>{course?.shortTitle ?? "Курс"}</span>
          <span>{fileCountLabel(task.files.length)}</span>
          <span className={hasClosedTheory ? "status-badge status-badge--warning" : "status-badge status-badge--success"}>
            {hasClosedTheory ? getStatusLabel("needs-theory") : getStatusLabel(task.status ?? "available")}
          </span>
        </div>
      </header>

      {hasClosedTheory && (
        <section className={classNames("panel", styles.theoryNote)}>
          <strong>Теория к этой задаче ещё закрыта</strong>
          <p>Лучше пройти готовые разделы до this. Объяснение темы пока на доработке.</p>
        </section>
      )}

      <section className={classNames("panel", styles.goal)}>
        <h2>Условие</h2>
        <p>{task.goal}</p>
        <p>{task.description}</p>
      </section>

      <section className={classNames("panel", styles.plainPanel)}>
        <h2>Что создать</h2>
        <ul>
          {task.whatToCreate.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={classNames("panel", styles.codePanel)}>
        <h2>Файлы и каркас кода</h2>
        <p className="muted-text">
          Основной файл: <code>{task.practicePath}</code>
        </p>

        <div className={styles.fileList} role="tablist" aria-label="Файлы задачи">
          {task.files.map((file, index) => (
            <button
              key={file.fileName}
              className={classNames(styles.fileTab, index === activeFileIndex && styles.fileTabActive)}
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
        <section className={classNames("panel", styles.plainPanel)}>
          <h2>Что писать вместо TODO</h2>
          <ol>
            {task.todoGuide.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      )}

      <section className={classNames("panel", styles.plainPanel)}>
        <h2>План решения</h2>
        <ol>
          {task.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className={classNames("panel", styles.plainPanel)}>
        <h2>Подсказки</h2>
        <ul>
          {task.hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      </section>

      <section className={classNames("panel", styles.plainPanel)}>
        <h2>Частые ошибки</h2>
        <ul>
          {task.commonMistakes.map((mistake) => (
            <li key={mistake}>{mistake}</li>
          ))}
        </ul>
      </section>

      <section className={classNames("panel", styles.plainPanel)}>
        <h2>Самопроверка</h2>
        <ul>
          {task.selfCheck.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={classNames("panel", styles.plainPanel, styles.notePanel)}>
        <h2>Не открывай готовый ответ сразу</h2>
        <p>Напиши свой вариант и проверь его по чек-листу. Ответ полезен после попытки.</p>
      </section>

      {theory && (
        <section className={classNames("panel", styles.plainPanel)}>
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
