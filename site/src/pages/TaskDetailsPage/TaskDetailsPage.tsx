import { type KeyboardEvent, useEffect, useState } from "react";
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
import { LinkButton } from "../../components/shared/ActionButton/ActionButton";
import { CodeBlock } from "../../components/shared/CodeBlock/CodeBlock";
import {
  BackLink,
  CollapsibleSection,
  MetaItem,
  MetaRow,
  StatusBadge,
  TaskActionBar,
} from "../../components/shared/LearningUi/LearningUi";
import {
  fileCountLabel,
  getTaskDisplayLabel,
  getTaskDisplayStatus,
  getTaskDisplayTone,
  isGenericTaskPlan,
  isTaskTheoryClosed,
  taskLevelLabels,
} from "../../utils/taskDisplay";
import styles from "./TaskDetailsPage.module.scss";

type Task = (typeof tasks)[number];

const DEFAULT_TASK_DESCRIPTION =
  "Откройте файл из practice, прочитайте комментарии в начале файла и напишите решение вместо TODO. Сначала добейтесь компиляции, затем проверьте поведение на простых данных.";

const DEFAULT_FILE_DESCRIPTION =
  "Стартовый файл задачи. Найдите TODO и допишите решение в локальном проекте.";

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
  className?: string;
};

function renderTaskInline(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }

    return part;
  });
}

function TaskItemList({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";

  return (
    <Tag className={styles.taskList}>
      {items.map((item) => (
        <li key={item}>
          <span className={styles.taskListText}>{renderTaskInline(item)}</span>
        </li>
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
  className,
}: TaskListSectionProps) {
  if (items.length === 0) return null;

  if (collapsible) {
    return (
      <CollapsibleSection
        title={title}
        description={description ? renderTaskInline(description) : undefined}
        countLabel={pointCountLabel(items.length)}
        className={className}
      >
        <TaskItemList items={items} ordered={ordered} />
      </CollapsibleSection>
    );
  }

  return (
    <section className={clsx("panel", styles.plainPanel, className)}>
      <h2>{title}</h2>
      {description && <p className={styles.panelDescription}>{renderTaskInline(description)}</p>}
      <TaskItemList items={items} ordered={ordered} />
    </section>
  );
}

function TaskGuideNote({ hasSpecificPlan }: { hasSpecificPlan: boolean }) {
  return (
    <div className={styles.guideNote}>
      <div>
        <h3>Нужен порядок решения?</h3>
        <p>
          {hasSpecificPlan
            ? "Откройте методику, если нужно сверить общий подход. Шаги для этой задачи есть в подсказках."
            : "Откройте методику, если нужно вспомнить общий порядок работы с задачей."}
        </p>
      </div>
      <LinkButton href={toPath("/guide")} size="small">
        Как решать задачи
      </LinkButton>
    </div>
  );
}

function shouldShowTaskDescription(description: string) {
  return description.trim() !== DEFAULT_TASK_DESCRIPTION;
}

function shouldShowFileDescription(description: string) {
  return description.trim() !== DEFAULT_FILE_DESCRIPTION;
}

function getResultItems(items: string[], practicePath: string) {
  if (items.length === 1 && items[0] === `Один файл: ${practicePath}`) {
    return ["Один файл с решением вместо TODO."];
  }

  return items;
}

function TaskBriefSection({
  description,
  goal,
  items,
  practicePath,
}: {
  description: string;
  goal: string;
  items: string[];
  practicePath: string;
}) {
  const resultItems = getResultItems(items, practicePath);

  return (
    <section className={clsx("panel", styles.taskBrief)}>
      <h2>Что нужно сделать</h2>
      <div className={styles.briefGrid}>
        <div className={styles.briefBlock}>
          <span>Задача</span>
          <p className={styles.briefGoal}>{renderTaskInline(goal)}</p>
          {shouldShowTaskDescription(description) && <p>{renderTaskInline(description)}</p>}
        </div>

        <div className={styles.briefBlock}>
          <span>Результат</span>
          <ul className={styles.briefList}>
            {resultItems.map((item) => (
              <li key={item}>{renderTaskInline(item)}</li>
            ))}
          </ul>
        </div>

        <div className={styles.briefBlock}>
          <span>Файл</span>
          <code className={styles.briefFile}>{practicePath}</code>
        </div>
      </div>
    </section>
  );
}

function TaskHelpSection({
  hasSpecificPlan,
  task,
}: {
  hasSpecificPlan: boolean;
  task: Task;
}) {
  const hintItems = [
    ...(task.todoGuide ?? []),
    ...(hasSpecificPlan ? task.steps : []),
    ...task.hints,
  ];

  return (
    <section className={clsx("panel", styles.helpPanel)}>
      <div className={styles.helpHeader}>
        <h2>Помощь</h2>
        <p>Открывайте эти разделы только когда нужен следующий шаг или проверка.</p>
      </div>

      <TaskGuideNote hasSpecificPlan={hasSpecificPlan} />

      <div className={styles.helpSections}>
        <TaskListSection
          title="Подсказки"
          items={hintItems}
          collapsible
          description="Следующий шаг без готового решения."
          className={styles.helpDisclosure}
        />
        <TaskListSection
          title="Частые ошибки"
          items={task.commonMistakes}
          collapsible
          description="Проверьте перед тем, как считать задачу готовой."
          className={styles.helpDisclosure}
        />
        <TaskListSection
          title="Самопроверка"
          items={task.selfCheck}
          collapsible
          description="Короткий чек-лист перед отметкой задачи."
          className={styles.helpDisclosure}
        />
      </div>
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
  const hasMultipleFiles = task.files.length > 1;
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
  const progressStatusLabel = isProgressLoading ? "Проверяем..." : taskStatusBadge.label;
  const progressActionLabel = isProgressSaving
    ? "Сохраняем..."
    : effectiveTaskStatus === "solved"
      ? "Снять отметку"
      : effectiveTaskStatus === "in_progress"
        ? "Отметить решённой"
        : "Начать задачу";
  const hasSpecificPlan = !isGenericTaskPlan(task.steps);
  const nextTaskStatus: TaskProgressStatus =
    effectiveTaskStatus === "solved"
      ? "in_progress"
      : effectiveTaskStatus === "in_progress"
        ? "solved"
        : "in_progress";

  return (
    <article className={clsx("reading-page", styles.root)}>
      <header className={clsx("panel", styles.header)}>
        <BackLink href={toPath("/tasks")}>К задачам</BackLink>
        <p className={styles.sectionLabel}>{task.section}</p>
        <h1>{task.title}</h1>
        <MetaRow compact className={styles.headerMeta}>
          <MetaItem label="Курс">
            {course?.shortTitle ?? "Курс"}
          </MetaItem>
          <MetaItem label="Сложность">
            {taskLevelLabels[task.level]}
          </MetaItem>
          <MetaItem label="Файлы">
            {fileCountLabel(task.files.length)}
          </MetaItem>
          <MetaItem label="Статус">
            <StatusBadge tone={taskStatusBadge.tone}>{progressStatusLabel}</StatusBadge>
          </MetaItem>
        </MetaRow>
        {isAuthenticated && (
          <TaskActionBar
            title="Работа над задачей"
            description={`Текущий статус: ${progressStatusLabel.toLowerCase()}`}
            actionLabel={progressActionLabel}
            disabled={isProgressLoading || isProgressSaving}
            primary={effectiveTaskStatus !== "solved"}
            message={progressMessage}
            onAction={() => void handleSetTaskStatus(nextTaskStatus)}
          />
        )}
      </header>

      <TaskBriefSection
        goal={task.goal}
        description={task.description}
        items={task.whatToCreate}
        practicePath={task.practicePath}
      />

      <section className={clsx("panel", styles.codePanel)}>
        <div className={styles.codePanelHeader}>
          <h2>Стартовый код</h2>
          <p>Откройте файл из блока выше и замените TODO своим решением.</p>
        </div>

        {hasMultipleFiles && (
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
        )}

        <div
          className={styles.filePanel}
          id={activeFilePanelId}
          role={hasMultipleFiles ? "tabpanel" : undefined}
          aria-labelledby={hasMultipleFiles ? activeFileTabId : undefined}
        >
          {hasMultipleFiles && (
            <div className={styles.filePanelHeader}>
              <div>
                <span>Выбранный файл</span>
                <strong>{activeFile.fileName.split("/").pop()}</strong>
              </div>
              <code>{activeFile.fileName}</code>
            </div>
          )}

          {shouldShowFileDescription(activeFile.description) && (
            <p className={styles.fileDescription}>{renderTaskInline(activeFile.description)}</p>
          )}
          <p className={styles.codeCaption}>Каркас файла</p>
          <CodeBlock code={activeFile.starterCode} language="cpp" compact />
        </div>
      </section>

      <TaskHelpSection task={task} hasSpecificPlan={hasSpecificPlan} />

      {theory && (
        <section className={clsx("panel", styles.theoryRepeat)}>
          <div>
            <h2>Тема для повторения</h2>
            <p>
              {hasClosedTheory
                ? "Раздел пока откроется как заглушка, но связь с темой сохранена."
                : "Откройте раздел, если нужно повторить основу перед решением."}
            </p>
            <span className={styles.theoryTitle}>{theory.title}</span>
          </div>
          <LinkButton href={toPath(getCourseSectionPath(theory))} size="small" variant="ghost">
            Открыть раздел
          </LinkButton>
        </section>
      )}
    </article>
  );
}
