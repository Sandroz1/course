import { getCourseById } from "../../../data/courses";
import { tasks } from "../../../data/tasks";
import clsx from "clsx";
import type { TaskProgressStatus } from "../../../types/api";
import {
  MetaItem,
  MetaRow,
  StatusBadge,
} from "../../../components/shared/LearningUi/LearningUi";
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
      <MetaRow compact className={styles.metaRow}>
        <MetaItem label="Сложность">{taskLevelLabels[task.level]}</MetaItem>
        <MetaItem label="Файлы">{fileCountLabel(task.files.length)}</MetaItem>
      </MetaRow>
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
