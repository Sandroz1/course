import { courseSections, isCourseSectionReady } from "../../data/courseSections";
import { getCourseById } from "../../data/courses";
import { getStatusLabel } from "../../data/status";
import { tasks } from "../../data/tasks";
import { classNames } from "../../shared/lib/classNames";
import type { TaskProgressStatus } from "../../types/api";
import { toPath } from "../../utils/slug";
import { ProgressBadge } from "../ProgressBadge/ProgressBadge";
import styles from "./TaskListPage.module.scss";

type TaskDisplayStatus = "available" | "needs-theory" | "in_progress" | "solved";

const VISIBLE_TOPIC_LIMIT = 3;

function fileCountLabel(count: number) {
  if (count === 1) return "1 файл";
  if (count >= 2 && count <= 4) return `${count} файла`;
  return `${count} файлов`;
}

function getTaskDisplayStatus(
  task: (typeof tasks)[number],
  hasClosedTheory: boolean,
  taskProgressById?: Map<string, TaskProgressStatus>,
): TaskDisplayStatus {
  const progressStatus = taskProgressById?.get(task.id);

  if (progressStatus === "solved") return "solved";
  if (progressStatus === "in_progress") return "in_progress";
  if (hasClosedTheory) return "needs-theory";

  return "available";
}

function getTaskDisplayLabel(status: TaskDisplayStatus) {
  if (status === "solved") return "Пройдено";
  if (status === "in_progress") return "В работе";
  if (status === "needs-theory") return getStatusLabel("needs-theory");

  return getStatusLabel("available");
}

function getTaskStatusClass(status: TaskDisplayStatus) {
  if (status === "solved") return styles.statusSolved;
  if (status === "in_progress") return styles.statusInProgress;
  if (status === "needs-theory") return styles.statusLocked;

  return styles.statusAvailable;
}

export function TaskListPage({
  section,
  sourceTasks,
  taskProgressById,
}: {
  section?: string;
  sourceTasks?: typeof tasks;
  taskProgressById?: Map<string, TaskProgressStatus>;
}) {
  const baseTasks = sourceTasks ?? tasks;
  const visibleTasks = section
    ? baseTasks.filter((task) => task.section === section)
    : baseTasks;

  return (
    <div className={styles.grid}>
      {visibleTasks.map((task) => {
        const theory = courseSections.find((section) => section.slug === task.theorySlug);
        const hasClosedTheory =
          task.status === "needs-theory" || (theory ? !isCourseSectionReady(theory) : false);
        const course = getCourseById(task.courseId);
        const theoryTitle = theory?.title ?? task.section;
        const displayStatus = getTaskDisplayStatus(task, hasClosedTheory, taskProgressById);
        const visibleTopics = task.topics.slice(0, VISIBLE_TOPIC_LIMIT);
        const hiddenTopicCount = Math.max(task.topics.length - VISIBLE_TOPIC_LIMIT, 0);

        return (
          <a
            className={classNames(styles.card, hasClosedTheory && styles.closedTheory)}
            href={toPath(`/tasks/${task.id}`)}
            aria-label={`Открыть задачу: ${task.title}`}
            key={task.id}
          >
            <div className={styles.top}>
              <div className={styles.titleBlock}>
                <strong>{task.title}</strong>
                <span className={styles.meta}>
                  {course?.shortTitle ?? "Курс"} · {task.section}
                </span>
              </div>
              <ProgressBadge level={task.level} />
            </div>
            <div className={styles.statusRow}>
              <span
                className={classNames(
                  styles.statusBadge,
                  getTaskStatusClass(displayStatus),
                )}
              >
                {getTaskDisplayLabel(displayStatus)}
              </span>
            </div>
            <span className={styles.theory}>Тема: {theoryTitle}</span>
            <div className={classNames("topic-list topic-list--compact", styles.topics)}>
              {visibleTopics.map((topic) => (
                <span key={topic}>{topic}</span>
              ))}
              {hiddenTopicCount > 0 && <span>+{hiddenTopicCount}</span>}
            </div>
            <span className={styles.footer} aria-hidden="true">
              <span className={styles.fileCount}>{fileCountLabel(task.files.length)}</span>
              <span className={styles.cta}>Открыть</span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
