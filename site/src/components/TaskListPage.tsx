import { tasks } from "../data/tasks";
import { toPath } from "../utils/slug";
import { ProgressBadge } from "./ProgressBadge";

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
    <div className="task-grid">
      {visibleTasks.map((task) => (
        <a className="task-card" href={toPath(`/tasks/${task.id}`)} key={task.id}>
          <div className="task-card__top">
            <strong>{task.title}</strong>
            <ProgressBadge level={task.level} />
          </div>
          <div className="topic-list topic-list--compact">
            {task.topics.slice(0, 4).map((topic) => (
              <span key={topic}>{topic}</span>
            ))}
          </div>
          <div className="task-card__meta">
            <span>{task.files.length} файл(а)</span>
            <span>{task.files.length > 1 ? "многофайловая" : "один файл"}</span>
          </div>
          <span className="button button--small">Открыть</span>
        </a>
      ))}
    </div>
  );
}
