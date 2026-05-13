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

function getTaskDisplayTone(status: TaskDisplayStatus) {
  if (status === "solved") return "success";
  if (status === "in_progress") return "info";
  if (status === "needs-theory") return "task";

  return "success";
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

        return (
          <a
            className={classNames(styles.card, hasClosedTheory && styles.closedTheory)}
            href={toPath(`/tasks/${task.id}`)}
            key={task.id}
          >
            <div className={styles.top}>
              <strong>{task.title}</strong>
              <ProgressBadge level={task.level} />
            </div>
            <span className={styles.meta}>
              {course?.shortTitle ?? "Курс"} · {task.section}
            </span>
            <span className={styles.theory}>Тема: {theoryTitle}</span>
            <div className={styles.statusRow}>
              <span className={`status-badge status-badge--${getTaskDisplayTone(displayStatus)}`}>
                {getTaskDisplayLabel(displayStatus)}
              </span>
            </div>
            <div className={classNames("topic-list topic-list--compact", styles.topics)}>
              {task.topics.slice(0, 4).map((topic) => (
                <span key={topic}>{topic}</span>
              ))}
            </div>
            {hasClosedTheory && (
              <span className={styles.notice}>Теория ещё закрыта.</span>
            )}
            <span className={styles.footer}>
              <span>{fileCountLabel(task.files.length)}</span>
              <span>Открыть</span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
