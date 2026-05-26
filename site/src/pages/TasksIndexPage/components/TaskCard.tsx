import { getCourseById } from "../../../data/courses";
import { tasks } from "../../../data/tasks";
import clsx from "clsx";
import type { TaskProgressStatus } from "../../../types/api";
import { StatusBadge } from "../../../components/shared/LearningUi/LearningUi";
import {
  fileCountLabel,
  getTaskDisplayLabel,
  getTaskDisplayStatus,
  getTaskDisplayTone,
  isTaskTheoryClosed,
  taskLevelLabels,
  visibleTaskTopicLimit,
} from "../../../utils/taskDisplay";
import { toPath } from "../../../utils/slug";
import styles from "./TaskCard.module.scss";

type Task = (typeof tasks)[number];

function capitalizeLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function TaskCard({
  task,
  taskProgressById,
}: {
  task: Task;
  taskProgressById?: Map<string, TaskProgressStatus>;
}) {
  const hasClosedTheory = isTaskTheoryClosed(task);
  const course = getCourseById(task.courseId);
  const displayStatus = getTaskDisplayStatus(task, taskProgressById);
  const displayLabel = getTaskDisplayLabel(displayStatus);
  const displayTone = getTaskDisplayTone(displayStatus);
  const visibleTopics = task.topics.slice(0, visibleTaskTopicLimit);
  const hiddenTopicCount = Math.max(task.topics.length - visibleTaskTopicLimit, 0);
  const levelLabel = taskLevelLabels[task.level];
  const fileLabel = fileCountLabel(task.files.length);

  return (
    <a
      className={clsx(styles.card, hasClosedTheory && styles.closedTheory)}
      href={toPath(`/tasks/${task.id}`)}
      aria-label={`${task.title}. ${displayLabel}. ${course?.shortTitle ?? "Курс"}: ${task.section}`}
    >
      <div className={styles.top}>
        <div className={styles.titleBlock}>
          <strong className={styles.title}>{task.title}</strong>
          <span className={styles.meta}>
            {course?.shortTitle ?? "Курс"}: {task.section}
          </span>
        </div>
        <StatusBadge tone={displayTone} className={styles.statusBadge}>
          {displayLabel}
        </StatusBadge>
      </div>
      <div className={styles.metaRow} aria-label="Параметры задачи">
        <span className={styles.metaChip} aria-label={`Сложность: ${levelLabel}`}>
          {capitalizeLabel(levelLabel)}
        </span>
        <span className={styles.metaChip} aria-label={`Файлы: ${fileLabel}`}>
          {fileLabel}
        </span>
      </div>
      <div className={clsx("topic-list topic-list--compact", styles.topics)}>
        {visibleTopics.map((topic) => (
          <span key={topic}>{topic}</span>
        ))}
        {hiddenTopicCount > 0 && <span>ещё {hiddenTopicCount}</span>}
      </div>
      <span className={styles.footer}>
        <span className={styles.cta}>Открыть</span>
      </span>
    </a>
  );
}
