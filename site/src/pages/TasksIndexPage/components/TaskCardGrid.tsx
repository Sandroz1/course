import { tasks } from "../../../data/tasks";
import type { TaskProgressStatus } from "../../../types/api";
import { TaskCard } from "./TaskCard";
import styles from "./TaskCardGrid.module.scss";

export function TaskCardGrid({
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
      {visibleTasks.map((task) => (
        <TaskCard key={task.id} task={task} taskProgressById={taskProgressById} />
      ))}
    </div>
  );
}
