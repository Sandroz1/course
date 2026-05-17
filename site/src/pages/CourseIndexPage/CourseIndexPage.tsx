import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { courseSections, isCourseSectionReady } from "../../data/courseSections";
import { statusMeta } from "../../data/status";
import {
  getCompletedLessonKeys,
  getLessonProgressKey,
} from "../../features/course-progress/progressSelectors";
import { getCachedCourseProgress, readCachedCourseProgress } from "../../lib/progressApi";
import clsx from "clsx";
import { toPath } from "../../utils/slug";
import styles from "./CourseIndexPage.module.scss";

type CourseSection = (typeof courseSections)[number];

function progressKey(section: CourseSection) {
  return getLessonProgressKey(section.courseId, section.slug);
}

function readCachedCompletedLessons(authKey: string) {
  const progress = readCachedCourseProgress(authKey);

  return progress ? getCompletedLessonKeys(progress) : null;
}

function CourseSectionRow({
  section,
  isCompleted = false,
  isProgressLoading = false,
}: {
  section: CourseSection;
  isCompleted?: boolean;
  isProgressLoading?: boolean;
}) {
  const { slug, number, title, status } = section;
  const isReady = status === "available" || status === "ready";
  const meta = statusMeta[status];
  const progressLabel = isProgressLoading ? "Проверяем" : isCompleted ? "Пройдено" : "Доступен";
  const progressTone = isCompleted ? "success" : "muted";

  return (
    <a
      className={clsx("panel", styles.row, !isReady && styles.rowInProgress)}
      href={toPath(`/course/${slug}`)}
    >
      <span className={styles.number}>{number}</span>
      <span className={styles.body}>
        <strong className={styles.title}>{title}</strong>
      </span>
      <span className={styles.status}>
        {isReady ? (
          <span className={`status-badge status-badge--${progressTone}`}>{progressLabel}</span>
        ) : (
          <span className={`status-badge status-badge--${meta.tone}`}>{meta.label}</span>
        )}
      </span>
      <span className={clsx(styles.action, !isReady && styles.actionMuted)}>
        {isReady ? "Открыть" : "Скоро"}
      </span>
    </a>
  );
}

export function CourseIndexPage() {
  const { accessToken, isAuthenticated } = useAuth();
  const authKey = accessToken ?? "";
  const [completedLessonsState, setCompletedLessonsState] = useState<{
    authKey: string;
    lessons: Set<string>;
  } | null>(() => {
    const cachedLessons = readCachedCompletedLessons(authKey);

    return cachedLessons ? { authKey, lessons: cachedLessons } : null;
  });
  const [progressError, setProgressError] = useState("");
  const readySections = courseSections.filter(isCourseSectionReady);
  const plannedSections = courseSections.filter((section) => !isCourseSectionReady(section));
  const completedLessons =
    completedLessonsState?.authKey === authKey ? completedLessonsState.lessons : null;
  const isProgressLoading = isAuthenticated && completedLessons === null;

  useEffect(() => {
    if (!isAuthenticated || !authKey) {
      setCompletedLessonsState({ authKey, lessons: new Set() });
      setProgressError("");
      return;
    }

    const cachedLessons = readCachedCompletedLessons(authKey);

    if (cachedLessons) {
      setCompletedLessonsState({ authKey, lessons: cachedLessons });
      setProgressError("");
      return;
    }

    let cancelled = false;

    async function loadProgress() {
      setProgressError("");

      try {
        const progress = await getCachedCourseProgress(authKey);

        if (cancelled) return;

        setCompletedLessonsState({
          authKey,
          lessons: getCompletedLessonKeys(progress),
        });
      } catch {
        if (!cancelled) {
          setCompletedLessonsState({ authKey, lessons: new Set() });
          setProgressError("Прогресс временно недоступен.");
        }
      }
    }

    void loadProgress();

    return () => {
      cancelled = true;
    };
  }, [authKey, isAuthenticated]);

  return (
    <article className={clsx("reading-page", "compact-page", "route-page", styles.root)}>
      <header className="page-header">
        <a className="back-link" href={toPath("/courses")}>
          Все курсы
        </a>
        <p className="eyebrow">Доступный курс</p>
        <h1>ООП C++</h1>
        <p className="lead">
          Иди сверху вниз. Сейчас открыты первые {readySections.length} уроков, остальные темы
          появятся после доработки.
        </p>
      </header>

      <section className={clsx("panel", styles.progress)}>
        <div className={styles.progressItem}>
          <strong>Порядок прохождения</strong>
          <span>Теория → задача → .cpp файл → самопроверка</span>
        </div>
        <div className={styles.progressItem}>
          <strong>{readySections.length} открыто</strong>
          <span>{plannedSections.length} тем на доработке</span>
        </div>
      </section>

      {progressError && (
        <section className={clsx("panel", styles.progressState)}>
          <span>{progressError}</span>
        </section>
      )}

      <section className={styles.group}>
        <div className={styles.sectionHeading}>
          <h2>Открытые уроки</h2>
          <span>{readySections.length}</span>
        </div>
        <div className={styles.list}>
          {readySections.map((section) => (
            <CourseSectionRow
              key={section.slug}
              section={section}
              isCompleted={Boolean(completedLessons?.has(progressKey(section)))}
              isProgressLoading={isProgressLoading}
            />
          ))}
        </div>
      </section>

      <section className={styles.group}>
        <div className={styles.sectionHeading}>
          <h2>Позже</h2>
          <span>{plannedSections.length}</span>
        </div>
        <div className={styles.list}>
          {plannedSections.map((section) => (
            <CourseSectionRow
              key={section.slug}
              section={section}
              isCompleted={Boolean(completedLessons?.has(progressKey(section)))}
              isProgressLoading={isProgressLoading}
            />
          ))}
        </div>
      </section>
    </article>
  );
}
