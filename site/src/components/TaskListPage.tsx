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
          <p>{task.goal}</p>
          <span className="path-label">
            {task.files.length > 1 ? "Многофайловая задача" : task.files[0]?.fileName}
          </span>
        </a>
      ))}
    </div>
  );
}
