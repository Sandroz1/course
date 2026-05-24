import { ProgressBadge } from "../../../components/shared/ProgressBadge/ProgressBadge";
import { getCourseById } from "../../../data/courses";
import { tasks } from "../../../data/tasks";
import clsx from "clsx";
import type { TaskProgressStatus } from "../../../types/api";
import {
  fileCountLabel,
  getTaskDisplayLabel,
  getTaskDisplayStatus,
  isTaskTheoryClosed,
  visibleTaskTopicLimit,
  type TaskDisplayStatus,
} from "../../../utils/taskDisplay";
import { toPath } from "../../../utils/slug";
import styles from "./TaskCard.module.scss";

type Task = (typeof tasks)[number];

function getTaskStatusClass(status: TaskDisplayStatus) {
  if (status === "solved") return styles.statusSolved;
  if (status === "in_progress") return styles.statusInProgress;
  if (status === "needs-theory") return styles.statusLocked;

  return styles.statusAvailable;
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
  const visibleTopics = task.topics.slice(0, visibleTaskTopicLimit);
  const hiddenTopicCount = Math.max(task.topics.length - visibleTaskTopicLimit, 0);

  return (
    <a
      className={clsx(styles.card, hasClosedTheory && styles.closedTheory)}
      href={toPath(`/tasks/${task.id}`)}
      aria-label={`${task.title}. ${displayLabel}. ${course?.shortTitle ?? "Курс"}: ${task.section}`}
    >
      <div className={styles.top}>
        <div className={styles.titleBlock}>
          <strong>{task.title}</strong>
          <span className={styles.meta}>
            {course?.shortTitle ?? "Курс"}: {task.section}
          </span>
        </div>
        <ProgressBadge level={task.level} />
      </div>
      <div className={styles.statusRow}>
        <span
          className={clsx(
            styles.statusBadge,
            getTaskStatusClass(displayStatus),
          )}
        >
          {displayLabel}
        </span>
      </div>
      <span className={styles.goal}>Цель: {task.goal}</span>
      <div className={clsx("topic-list topic-list--compact", styles.topics)}>
        {visibleTopics.map((topic) => (
          <span key={topic}>{topic}</span>
        ))}
        {hiddenTopicCount > 0 && <span>ещё {hiddenTopicCount}</span>}
      </div>
      <span className={styles.footer}>
        <span className={styles.fileCount}>{fileCountLabel(task.files.length)}</span>
        <span className={styles.cta}>Открыть</span>
      </span>
    </a>
  );
}
