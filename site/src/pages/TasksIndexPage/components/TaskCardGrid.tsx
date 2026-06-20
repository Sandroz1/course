import type { Task } from "../../../data/tasks";
import type { TaskProgressStatus } from "../../../types/api";
import { TaskCard } from "./TaskCard";
import styles from "./TaskCardGrid.module.scss";

export function TaskCardGrid({
  sourceTasks,
  taskProgressById,
}: {
  sourceTasks: Task[];
  taskProgressById?: Map<string, TaskProgressStatus>;
}) {
  return (
    <div className={styles.grid}>
      {sourceTasks.map((task) => (
        <TaskCard key={task.id} task={task} taskProgressById={taskProgressById} />
      ))}
    </div>
  );
}
