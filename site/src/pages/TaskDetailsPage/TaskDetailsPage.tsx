import { type KeyboardEvent, useEffect, useId, useState } from "react";
import {
  getCourseSectionBySlug,
  getCourseSectionPath,
} from "../../data/courseSections";
import { getCourseById } from "../../data/courses";
import { tasks } from "../../data/tasks";
import { useAuth } from "../../context/AuthContext";
import {
  getCachedCourseProgress,
  readCachedCourseProgress,
  setCachedTaskProgress,
  upsertTaskProgress,
} from "../../lib/progressApi";
import clsx from "clsx";
import type { TaskProgressStatus } from "../../types/api";
import { toPath } from "../../utils/slug";
import { CodeBlock } from "../../components/shared/CodeBlock/CodeBlock";
import { ProgressBadge } from "../../components/shared/ProgressBadge/ProgressBadge";
import {
  fileCountLabel,
  getTaskDisplayLabel,
  getTaskDisplayStatus,
  getTaskDisplayTone,
  isGenericTaskPlan,
  isTaskTheoryClosed,
} from "../../utils/taskDisplay";
import styles from "./TaskDetailsPage.module.scss";

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

type TaskListSectionProps = {
  title: string;
  items: string[];
  ordered?: boolean;
  collapsible?: boolean;
  description?: string;
};

function TaskItemList({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";

  return (
    <Tag className={styles.taskList}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </Tag>
  );
}

function pointCountLabel(count: number) {
  if (count === 1) return "1 пункт";
  if (count >= 2 && count <= 4) return `${count} пункта`;
  return `${count} пунктов`;
}

function TaskListSection({
  title,
  items,
  ordered = false,
  collapsible = false,
  description,
}: TaskListSectionProps) {
  const contentId = useId();
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0) return null;

  if (collapsible) {
    return (
      <section
        className={clsx(
          "panel",
          styles.plainPanel,
          styles.collapsiblePanel,
          isOpen && styles.collapsiblePanelOpen,
        )}
      >
        <button
          className={styles.disclosureButton}
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen((value) => !value)}
        >
          <span className={styles.disclosureText}>
            <strong>{title}</strong>
            {description && <small>{description}</small>}
          </span>
          <span className={styles.disclosureMeta}>{pointCountLabel(items.length)}</span>
          <span className={styles.disclosureChevron} aria-hidden="true" />
        </button>
        <div className={styles.disclosureContent} id={contentId} hidden={!isOpen}>
          <TaskItemList items={items} ordered={ordered} />
        </div>
      </section>
    );
  }

  return (
    <section className={clsx("panel", styles.plainPanel)}>
      <h2>{title}</h2>
      {description && <p className={styles.panelDescription}>{description}</p>}
      <TaskItemList items={items} ordered={ordered} />
    </section>
  );
}

function TaskGuideNote({ hasSpecificPlan }: { hasSpecificPlan: boolean }) {
  return (
    <section className={clsx("panel", styles.guideNote)}>
      <div>
        <h2>{hasSpecificPlan ? "Общий порядок работы" : "Как начать задачу"}</h2>
        <p>
          {hasSpecificPlan
            ? "Общие шаги вынесены в методику. Ниже оставлены только шаги, важные именно для этой задачи."
            : "Типовой план решения вынесен в методику, чтобы не повторять его в каждой задаче."}
        </p>
      </div>
      <a className="button button--small" href={toPath("/guide")}>
        Как решать задачи
      </a>
    </section>
  );
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

  const theory = getCourseSectionBySlug(task.courseId, task.theorySlug);
  const hasClosedTheory = isTaskTheoryClosed(task);
  const course = getCourseById(task.courseId);
  const activeFile = task.files[activeFileIndex];
  const activeFileTabId = `task-file-tab-${task.id}-${activeFileIndex}`;
  const activeFilePanelId = `task-file-panel-${task.id}-${activeFileIndex}`;
  const effectiveTaskStatus = taskStatus ?? "not_started";
  const displayStatus = getTaskDisplayStatus(
    task,
    new Map([[task.id, effectiveTaskStatus]]),
  );
  const taskStatusBadge = {
    label: getTaskDisplayLabel(displayStatus),
    tone: getTaskDisplayTone(displayStatus),
  };
  const hasSpecificPlan = !isGenericTaskPlan(task.steps);
  const nextTaskStatus: TaskProgressStatus =
    effectiveTaskStatus === "solved"
      ? "in_progress"
      : effectiveTaskStatus === "in_progress"
        ? "solved"
        : "in_progress";

  return (
    <article className={clsx("reading-page", styles.root)}>
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
        <section className={clsx("panel", styles.theoryNote)}>
          <strong>Теория к задаче ещё на доработке</strong>
          <p>
            {theory
              ? `Раздел «${theory.title}» пока не готов. Задачу можно открыть заранее, но лучше вернуться к ней после теории.`
              : "Теория для этой задачи пока не подключена к курсу."}
          </p>
        </section>
      )}

      {isAuthenticated && (
        <section className={clsx("panel", styles.progressPanel)}>
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
            className={clsx("button", effectiveTaskStatus !== "solved" && "button--primary")}
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
            className={clsx(
              styles.progressMessage,
              !progressMessage && styles.progressMessageEmpty,
            )}
            aria-live="polite"
          >
            {progressMessage || " "}
          </span>
        </section>
      )}

      <section className={clsx("panel", styles.goal)}>
        <h2>Условие</h2>
        <p>{task.goal}</p>
        <p>{task.description}</p>
      </section>

      <TaskListSection
        title="Что создать"
        items={task.whatToCreate}
        description="Короткий список результата, который должен получиться в файлах задачи."
      />

      <section className={clsx("panel", styles.codePanel)}>
        <h2>Файлы и каркас кода</h2>
        <p className="muted-text">
          Основной файл: <code>{task.practicePath}</code>
        </p>

        <div className={styles.fileList} role="tablist" aria-label="Файлы задачи">
          {task.files.map((file, index) => (
            <button
              key={file.fileName}
              id={`task-file-tab-${task.id}-${index}`}
              className={clsx(styles.fileTab, index === activeFileIndex && styles.fileTabActive)}
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

      <TaskListSection
        title="Что писать вместо TODO"
        items={task.todoGuide ?? []}
        ordered
      />

      <TaskGuideNote hasSpecificPlan={hasSpecificPlan} />

      {hasSpecificPlan && (
        <TaskListSection
          title="Шаги для этой задачи"
          items={task.steps}
          ordered
          description="Здесь только действия, которые отличаются от общего порядка."
        />
      )}

      <TaskListSection
        title="Подсказки"
        items={task.hints}
        collapsible
        description="Открой, если застрял на первом шаге."
      />

      <TaskListSection
        title="Частые ошибки"
        items={task.commonMistakes}
        collapsible
        description="Проверь перед тем, как считать задачу готовой."
      />

      <TaskListSection
        title="Самопроверка"
        items={task.selfCheck}
        collapsible
        description="Короткий чек-лист перед отметкой задачи."
      />

      {theory && (
        <section className={clsx("panel", styles.plainPanel)}>
          <h2>Повторить теорию</h2>
          <p>
            {hasClosedTheory
              ? "Раздел пока откроется как заглушка, без недоработанной теории."
              : "Если стало непонятно, вернись к разделу перед продолжением задачи."}
          </p>
          <a className="button button--small" href={toPath(getCourseSectionPath(theory))}>
            Открыть: {theory.title}
          </a>
        </section>
      )}
    </article>
  );
}
