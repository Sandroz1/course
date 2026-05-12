import { courseSections, isCourseSectionReady } from "../../data/courseSections";
import { getCourseById } from "../../data/courses";
import { getStatusLabel } from "../../data/status";
import { tasks } from "../../data/tasks";
import { classNames } from "../../shared/lib/classNames";
import { toPath } from "../../utils/slug";
import { ProgressBadge } from "../ProgressBadge/ProgressBadge";
import styles from "./TaskListPage.module.scss";

function fileCountLabel(count: number) {
  if (count === 1) return "1 файл";
  if (count >= 2 && count <= 4) return `${count} файла`;
  return `${count} файлов`;
}

export function TaskListPage({
  section,
  sourceTasks,
}: {
  section?: string;
  sourceTasks?: typeof tasks;
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
            {!hasClosedTheory && task.status && (
              <span className="status-badge status-badge--success">{getStatusLabel(task.status)}</span>
            )}
            <div className={classNames("topic-list topic-list--compact", styles.topics)}>
              {task.topics.slice(0, 4).map((topic) => (
                <span key={topic}>{topic}</span>
              ))}
            </div>
            {hasClosedTheory && (
              <>
                <span className="status-badge status-badge--task">{getStatusLabel("needs-theory")}</span>
                <span className={styles.notice}>Теория ещё закрыта.</span>
              </>
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
