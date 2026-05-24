import clsx from "clsx";
import type { TaskLevel } from "../../../data/tasks";
import { taskLevelLabels } from "../../../utils/taskDisplay";
import styles from "./ProgressBadge.module.scss";

export function ProgressBadge({ level }: { level: TaskLevel }) {
  const label = taskLevelLabels[level];

  return (
    <span
      className={clsx(styles.root, styles[level])}
      aria-label={`Сложность: ${label}`}
      title={`Сложность: ${label}`}
    >
      {label}
    </span>
  );
}
