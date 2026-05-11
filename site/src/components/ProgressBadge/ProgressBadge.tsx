import type { TaskLevel } from "../../data/tasks";
import { classNames } from "../../shared/lib/classNames";
import styles from "./ProgressBadge.module.scss";

const labels: Record<TaskLevel, string> = {
  easy: "легко",
  medium: "средне",
  hard: "сложно",
};

export function ProgressBadge({ level }: { level: TaskLevel }) {
  return <span className={classNames(styles.root, styles[level])}>{labels[level]}</span>;
}
