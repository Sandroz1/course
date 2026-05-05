import type { TaskLevel } from "../data/tasks";

const labels: Record<TaskLevel, string> = {
  easy: "легко",
  medium: "средне",
  hard: "сложно",
};

export function ProgressBadge({ level }: { level: TaskLevel }) {
  return <span className={`badge badge--${level}`}>{labels[level]}</span>;
}
