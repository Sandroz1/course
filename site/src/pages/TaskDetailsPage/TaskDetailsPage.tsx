import { useEffect, useState } from "react";
import { appRoutes } from "../../app/routes";
import {
  getCourseSectionBySlug,
  getCourseSectionPath,
} from "../../data/courseSections";
import { getCourseById } from "../../data/courses";
import { getTaskById, type Task } from "../../data/tasks";
import { useAuth } from "../../context/AuthContext";
import {
  getCachedCourseProgress,
  readCachedCourseProgress,
  setCachedTaskProgress,
  upsertTaskProgress,
} from "../../lib/progressApi";
import { getCheckerAvailability } from "../../lib/checkerApi";
import clsx from "clsx";
import type { CheckerAvailability, TaskProgressStatus } from "../../types/api";
import { toPath } from "../../utils/slug";
import { LinkButton } from "../../components/shared/ActionButton/ActionButton";
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
  taskLevelLabels,
} from "../../utils/taskDisplay";
import { TaskCodeWorkspace } from "./components/TaskCodeWorkspace";
import styles from "./TaskDetailsPage.module.scss";

const DEFAULT_TASK_DESCRIPTION =
  "Прочитайте условие, начните с заготовки ниже и замените TODO своим решением. Сначала добейтесь компиляции, затем проверьте поведение на простых данных.";

const MAX_VISIBLE_RESULT_ITEMS = 4;

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
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>
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

function TaskGuideNote() {
  return (
    <LinkButton href={toPath(appRoutes.guide)} size="small" variant="ghost">
      Методика решения
    </LinkButton>
  );
}

function shouldShowTaskDescription(description: string) {
  return description.trim() !== DEFAULT_TASK_DESCRIPTION;
}

function getResultItems(items: string[], practicePath: string) {
  return items.map((item) => {
    if (item === `Один файл: ${practicePath}`) {
      return "Один файл с решением вместо TODO.";
    }

    if (item.startsWith("practice/")) {
      return `Файл ${getDisplayFileName(item)} с решением вместо TODO.`;
    }

    return item;
  });
}

function getDisplayFileName(fileName: string) {
  return fileName.split("/").pop() ?? fileName;
}

function TaskResultChecklist({ items }: { items: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasHiddenItems = items.length > MAX_VISIBLE_RESULT_ITEMS;
  const visibleItems = isExpanded ? items : items.slice(0, MAX_VISIBLE_RESULT_ITEMS);
  const hiddenCount = Math.max(items.length - MAX_VISIBLE_RESULT_ITEMS, 0);

  return (
    <div className={styles.taskFactChecklist}>
      <ul className={styles.taskFactList}>
        {visibleItems.map((item, index) => (
          <li key={`${index}-${item}`}>
            <span className={styles.taskFactText}>{renderTaskInline(item)}</span>
          </li>
        ))}
      </ul>

      {hasHiddenItems && (
        <button
          className={styles.taskFactToggle}
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((value) => !value)}
        >
          {isExpanded ? "Скрыть" : `Показать ещё ${pointCountLabel(hiddenCount).toLowerCase()}`}
        </button>
      )}
    </div>
  );
}

function TaskBriefSection({
  description,
  goal,
  fileCount,
  items,
  practicePath,
}: {
  description: string;
  goal: string;
  fileCount: number;
  items: string[];
  practicePath: string;
}) {
  const resultItems = getResultItems(items, practicePath);
  const shouldShowDescription = shouldShowTaskDescription(description);

  return (
    <section className={clsx("panel", styles.taskBrief)} aria-labelledby="task-brief-title">
      <div className={styles.taskBriefMain}>
        <h2 id="task-brief-title">Задание</h2>
        <p className={styles.taskGoal}>{renderTaskInline(goal)}</p>
        {shouldShowDescription && <p>{renderTaskInline(description)}</p>}
      </div>

      <dl className={styles.taskFacts}>
        <div>
          <dt>Заготовка</dt>
          <dd>{fileCount === 1 ? "Стартовый код показан ниже." : `${fileCountLabel(fileCount)} показаны ниже.`}</dd>
        </div>

        <div>
          <dt>Готово, когда</dt>
          <dd>
            {resultItems.length === 1 ? (
              <span className={styles.taskFactText}>{renderTaskInline(resultItems[0])}</span>
            ) : (
              <TaskResultChecklist items={resultItems} />
            )}
          </dd>
        </div>
      </dl>
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
  const planItems = task.todoGuide ?? (hasSpecificPlan ? task.steps : []);
  const hintItems = [
    ...planItems,
    ...task.hints,
  ];

  return (
    <section className={clsx("panel", styles.helpPanel)}>
      <div className={styles.helpTop}>
        <div>
          <h2>Помощь</h2>
          <p>Открывайте подсказки только когда нужен следующий шаг или проверка.</p>
        </div>

        <TaskGuideNote />
      </div>

      <div className={styles.helpSections}>
        <TaskListSection
          title="Подсказки"
          items={hintItems}
          collapsible
          className={styles.helpDisclosure}
        />
        <TaskListSection
          title="Частые ошибки"
          items={task.commonMistakes}
          collapsible
          className={styles.helpDisclosure}
        />
        <TaskListSection
          title="Самопроверка"
          items={task.selfCheck}
          collapsible
          className={styles.helpDisclosure}
        />
      </div>
    </section>
  );
}

export function TaskDetailsPage({ taskId }: { taskId: string }) {
  const task = getTaskById(taskId);
  const { accessToken, isAuthenticated } = useAuth();
  const authKey = accessToken ?? "";
  const [taskStatus, setTaskStatus] = useState<TaskProgressStatus | null>(null);
  const [isProgressLoading, setIsProgressLoading] = useState(false);
  const [isProgressSaving, setIsProgressSaving] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [checkerAvailability, setCheckerAvailability] = useState<CheckerAvailability | null>(null);
  const [isCheckerAvailabilityLoading, setIsCheckerAvailabilityLoading] = useState(false);

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

  useEffect(() => {
    const currentTaskId = task?.id;

    if (!currentTaskId) {
      setCheckerAvailability(null);
      setIsCheckerAvailabilityLoading(false);
      return;
    }

    const controller = new AbortController();
    setCheckerAvailability(null);
    setIsCheckerAvailabilityLoading(true);

    getCheckerAvailability(currentTaskId, controller.signal)
      .then((availability) => {
        setCheckerAvailability(availability);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCheckerAvailability(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsCheckerAvailabilityLoading(false);
        }
      });

    return () => controller.abort();
  }, [task?.id]);

  async function handleSetTaskStatus(nextStatus: TaskProgressStatus) {
    const currentTask = task;

    if (
      !currentTask ||
      isProgressSaving ||
      (nextStatus === "solved" && checkerAvailability?.task_version)
    ) {
      return;
    }

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

  if (!task) {
    return (
      <div className="panel">
        <h1>Задача не найдена</h1>
      </div>
    );
  }

  const theory = getCourseSectionBySlug(task.courseId, task.theorySlug);
  const course = getCourseById(task.courseId);
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
  const nextTaskStatus: TaskProgressStatus =
    effectiveTaskStatus === "solved"
      ? "in_progress"
      : effectiveTaskStatus === "in_progress"
        ? "solved"
        : "in_progress";
  const isCheckerConfigured =
    checkerAvailability?.task_id === task.id &&
    typeof checkerAvailability.task_version === "number";
  const isCheckerGateLoading =
    isCheckerAvailabilityLoading && nextTaskStatus === "solved";
  const isManualSolveBlocked = isCheckerConfigured && nextTaskStatus === "solved";
  const progressActionLabel = isProgressSaving
    ? "Сохраняем..."
    : isCheckerGateLoading
      ? "Проверяем..."
      : isManualSolveBlocked
        ? "Нужна автопроверка"
        : effectiveTaskStatus === "solved"
          ? "Снять отметку"
          : effectiveTaskStatus === "in_progress"
            ? "Отметить решённой"
            : "Начать задачу";
  const hasSpecificPlan = !isGenericTaskPlan(task.steps);

  return (
    <article className={clsx("reading-page", styles.root)}>
      <header className={clsx("panel", styles.header)}>
        <BackLink href={toPath(appRoutes.tasks)}>К задачам</BackLink>
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
            description={
              isManualSolveBlocked
                ? checkerAvailability?.available
                  ? "Решение засчитывается после автопроверки."
                  : "Автопроверка ещё не подключена, поэтому завершение пока недоступно."
                : `Текущий статус: ${progressStatusLabel.toLowerCase()}`
            }
            actionLabel={progressActionLabel}
            disabled={
              isProgressLoading ||
              isProgressSaving ||
              isCheckerGateLoading ||
              isManualSolveBlocked
            }
            primary={effectiveTaskStatus !== "solved"}
            message={progressMessage}
            onAction={() => void handleSetTaskStatus(nextTaskStatus)}
          />
        )}
      </header>

      <TaskBriefSection
        goal={task.goal}
        description={task.description}
        fileCount={task.files.length}
        items={task.whatToCreate}
        practicePath={task.practicePath}
      />

      <TaskCodeWorkspace
        checkerAvailability={checkerAvailability}
        isCheckerAvailabilityLoading={isCheckerAvailabilityLoading}
        isCheckerConfigured={isCheckerConfigured}
        task={task}
      />

      <TaskHelpSection task={task} hasSpecificPlan={hasSpecificPlan} />

      {theory && (
        <section className={styles.relatedTheory}>
          <div>
            <span>Повторить</span>
            <strong>{theory.title}</strong>
          </div>

          <LinkButton href={toPath(getCourseSectionPath(theory))} size="small" variant="ghost">
            Открыть раздел
          </LinkButton>
        </section>
      )}
    </article>
  );
}
