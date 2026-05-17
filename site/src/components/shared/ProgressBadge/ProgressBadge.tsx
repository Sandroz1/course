import type { TaskLevel } from "../../../data/tasks";
import clsx from "clsx";
import styles from "./ProgressBadge.module.scss";

const labels: Record<TaskLevel, string> = {
  easy: "легко",
  medium: "средне",
  hard: "сложно",
};

export function ProgressBadge({ level }: { level: TaskLevel }) {
  return <span className={clsx(styles.root, styles[level])}>{labels[level]}</span>;
}
