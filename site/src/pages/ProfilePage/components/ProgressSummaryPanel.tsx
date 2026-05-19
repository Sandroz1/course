import clsx from "clsx";
import type { ProgressOverview } from "../../../types/api";
import styles from "../ProfilePage.module.scss";

export function ProgressSummaryPanel({
  progress,
  isLoading,
  error,
}: {
  progress: ProgressOverview | null;
  isLoading: boolean;
  error: string;
}) {
  const completedLessonsCount = progress?.lessons.filter((lesson) => lesson.is_completed).length ?? 0;
  const openedLessonsCount = progress?.lessons.length ?? 0;
  const solvedTasksCount = progress?.tasks.filter((task) => task.status === "solved").length ?? 0;
  const activeTasksCount = progress?.tasks.filter((task) => task.status === "in_progress").length ?? 0;

  return (
    <section className={clsx(styles.card, styles.progressCard)}>
      <h2 className={styles.cardTitle}>Прогресс</h2>
      {isLoading ? (
        <p className={clsx(styles.mutedText, styles.progressState)}>Загружаем прогресс...</p>
      ) : error ? (
        <p className={clsx(styles.formMessage, styles.formError, styles.progressState)}>
          {error}
        </p>
      ) : (
        <div className={styles.progressStats}>
          <div>
            <strong>{completedLessonsCount}</strong>
            <span>уроков пройдено</span>
          </div>
          <div>
            <strong>{openedLessonsCount}</strong>
            <span>уроков открыто</span>
          </div>
          <div>
            <strong>{solvedTasksCount}</strong>
            <span>задач решено</span>
          </div>
          <div>
            <strong>{activeTasksCount}</strong>
            <span>задач в работе</span>
          </div>
        </div>
      )}
    </section>
  );
}
