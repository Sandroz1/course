import { type KeyboardEvent, useEffect, useState } from "react";
import { courseSections, isCourseSectionReady } from "../../data/courseSections";
import { getCourseById } from "../../data/courses";
import { getStatusLabel } from "../../data/status";
import { tasks } from "../../data/tasks";
import { useAuth } from "../../context/AuthContext";
import {
  getCachedCourseProgress,
  readCachedCourseProgress,
  setCachedTaskProgress,
  upsertTaskProgress,
} from "../../lib/progressApi";
import { classNames } from "../../shared/lib/classNames";
import type { TaskProgressStatus } from "../../types/api";
import { toPath } from "../../utils/slug";
import { CodeBlock } from "../../components/shared/CodeBlock/CodeBlock";
import { ProgressBadge } from "../../components/shared/ProgressBadge/ProgressBadge";
import styles from "./TaskDetailsPage.module.scss";

function fileCountLabel(count: number) {
  if (count === 1) return "1 файл";
  if (count >= 2 && count <= 4) return `${count} файла`;
  return `${count} файлов`;
}

function getNextFileIndex(currentIndex: number, key: string, fileCount: number) {
  if (key === "Home") return 0;
  if (key === "End") return fileCount - 1;
  if (key === "ArrowLeft" || key === "ArrowUp") {
    return (currentIndex - 1 + fileCount) % fileCount;
  }
  if (key === "ArrowRight" || key === "ArrowDown") {
    return (currentIndex + 1) % fileCount;
  }

  return currentIndex;
}

export function TaskDetailsPage({ taskId }: { taskId: string }) {
  const task = tasks.find((item) => item.id === taskId);
  const { accessToken, isAuthenticated } = useAuth();
  const authKey = accessToken ?? "";
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [taskStatus, setTaskStatus] = useState<TaskProgressStatus | null>(null);
  const [isProgressLoading, setIsProgressLoading] = useState(false);
  const [isProgressSaving, setIsProgressSaving] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  useEffect(() => {
    const currentTask = task;

    if (!currentTask || !isAuthenticated || !authKey) {
      setTaskStatus(null);
      setIsProgressLoading(false);
      setProgressMessage("");
      return;
    }

    let cancelled = false;
    const currentTaskId = currentTask.id;
    const cachedProgress = readCachedCourseProgress(authKey);

    if (cachedProgress) {
      const existingTask = cachedProgress.tasks.find((item) => item.task_id === currentTaskId);
      setTaskStatus(existingTask?.status ?? "not_started");
      setIsProgressLoading(false);
      setProgressMessage("");
      return;
    }

    setTaskStatus(null);

    async function loadTaskProgress() {
      setIsProgressLoading(true);
      setProgressMessage("");

      try {
        const progress = await getCachedCourseProgress(authKey);
        const existingTask = progress.tasks.find((item) => item.task_id === currentTaskId);

        if (cancelled) return;

        setTaskStatus(existingTask?.status ?? "not_started");
      } catch {
        if (!cancelled) {
          setProgressMessage("Прогресс задачи временно не синхронизирован.");
        }
      } finally {
        if (!cancelled) {
          setIsProgressLoading(false);
        }
      }
    }

    void loadTaskProgress();

    return () => {
      cancelled = true;
    };
  }, [authKey, isAuthenticated, task]);

  async function handleSetTaskStatus(nextStatus: TaskProgressStatus) {
    const currentTask = task;

    if (!currentTask || isProgressSaving) return;

    const previousStatus = taskStatus ?? "not_started";
    setIsProgressSaving(true);
    setProgressMessage("");

    try {
      const progress = await upsertTaskProgress({
        task_id: currentTask.id,
        status: nextStatus,
      });
      setTaskStatus(progress.status);
      if (authKey) {
        setCachedTaskProgress(authKey, progress);
      }
      setProgressMessage(
        progress.status === "solved"
          ? "Задача отмечена решённой."
          : progress.status === "in_progress"
            ? previousStatus === "solved"
              ? "Задача возвращена в работу."
              : "Задача начата."
            : "Прогресс задачи обновлён.",
      );
    } catch {
      setProgressMessage("Не удалось сохранить прогресс задачи.");
    } finally {
      setIsProgressSaving(false);
    }
  }

  function handleFileTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const nextIndex = getNextFileIndex(index, event.key, task?.files.length ?? 0);

    if (nextIndex === index) return;

    event.preventDefault();
    setActiveFileIndex(nextIndex);
  }

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
  const activeFileTabId = `task-file-tab-${task.id}-${activeFileIndex}`;
  const activeFilePanelId = `task-file-panel-${task.id}-${activeFileIndex}`;
  const effectiveTaskStatus = taskStatus ?? "not_started";
  const taskStatusBadge =
    effectiveTaskStatus === "solved"
      ? { label: "Пройдено", tone: "success" }
      : effectiveTaskStatus === "in_progress"
        ? { label: "В работе", tone: "info" }
        : hasClosedTheory
          ? { label: getStatusLabel("needs-theory"), tone: "warning" }
          : { label: getStatusLabel(task.status ?? "available"), tone: "success" };
  const nextTaskStatus: TaskProgressStatus =
    effectiveTaskStatus === "solved"
      ? "in_progress"
      : effectiveTaskStatus === "in_progress"
        ? "solved"
        : "in_progress";

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
          <span className={`status-badge status-badge--${taskStatusBadge.tone}`}>
            {taskStatusBadge.label}
          </span>
        </div>
      </header>

      {hasClosedTheory && (
        <section className={classNames("panel", styles.theoryNote)}>
          <strong>Теория к этой задаче ещё закрыта</strong>
          <p>Лучше пройти готовые разделы до this. Объяснение темы пока на доработке.</p>
        </section>
      )}

      {isAuthenticated && (
        <section className={classNames("panel", styles.progressPanel)}>
          <div>
            <strong>Прогресс задачи</strong>
            <span>
              {isProgressLoading
                ? "Проверяем..."
                : effectiveTaskStatus === "solved"
                  ? "Решена"
                  : effectiveTaskStatus === "in_progress"
                    ? "В работе"
                    : "Доступно"}
            </span>
          </div>
          <button
            className={effectiveTaskStatus === "solved" ? "button" : "button button--primary"}
            type="button"
            disabled={isProgressLoading || isProgressSaving}
            onClick={() => void handleSetTaskStatus(nextTaskStatus)}
          >
            {isProgressSaving
              ? "Сохраняем..."
              : effectiveTaskStatus === "solved"
                ? "Вернуть в работу"
                : effectiveTaskStatus === "in_progress"
                  ? "Отметить решённой"
                  : "Начать"}
          </button>
          <span
            className={classNames(
              styles.progressMessage,
              !progressMessage && styles.progressMessageEmpty,
            )}
            aria-live="polite"
          >
            {progressMessage || " "}
          </span>
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
              id={`task-file-tab-${task.id}-${index}`}
              className={classNames(styles.fileTab, index === activeFileIndex && styles.fileTabActive)}
              type="button"
              role="tab"
              aria-selected={index === activeFileIndex}
              aria-controls={`task-file-panel-${task.id}-${index}`}
              tabIndex={index === activeFileIndex ? 0 : -1}
              onClick={() => setActiveFileIndex(index)}
              onKeyDown={(event) => handleFileTabKeyDown(event, index)}
            >
              {file.fileName.split("/").pop()}
            </button>
          ))}
        </div>

        <div id={activeFilePanelId} role="tabpanel" aria-labelledby={activeFileTabId}>
          <p>{activeFile.description}</p>
          <CodeBlock code={activeFile.starterCode} language="cpp" />
        </div>
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
