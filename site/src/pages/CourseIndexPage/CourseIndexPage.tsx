import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  type CourseSection,
  getCourseSectionPath,
  getCourseSections,
  isCourseSectionReady,
} from "../../data/courseSections";
import { getCourseById, type CourseId } from "../../data/courses";
import { statusMeta } from "../../data/status";
import {
  getCompletedLessonKeys,
  getLessonProgressKey,
} from "../../features/course-progress/progressSelectors";
import { getCachedCourseProgress, readCachedCourseProgress } from "../../lib/progressApi";
import clsx from "clsx";
import { toPath } from "../../utils/slug";
import styles from "./CourseIndexPage.module.scss";

type CourseIndexPageProps = {
  courseId?: CourseId;
};

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
  const { number, title, status } = section;
  const isReady = status === "available" || status === "ready";
  const meta = statusMeta[status];
  const progressLabel = isProgressLoading ? "Проверяем" : isCompleted ? "Пройдено" : "Доступен";
  const progressTone = isCompleted ? "success" : "muted";

  return (
    <a
      className={clsx("panel", styles.row, !isReady && styles.rowInProgress)}
      href={toPath(getCourseSectionPath(section))}
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

export function CourseIndexPage({ courseId = "oop-cpp" }: CourseIndexPageProps) {
  const { accessToken, isAuthenticated } = useAuth();
  const authKey = accessToken ?? "";
  const course = getCourseById(courseId);
  const sections = getCourseSections(courseId);
  const readySections = sections.filter(isCourseSectionReady);
  const plannedSections = sections.filter((section) => !isCourseSectionReady(section));
  const courseMeta = course ? statusMeta[course.status] : null;
  const isCourseAvailable = course?.status === "available";
  const shouldLoadProgress = isAuthenticated && isCourseAvailable && readySections.length > 0;
  const [completedLessonsState, setCompletedLessonsState] = useState<{
    authKey: string;
    lessons: Set<string>;
  } | null>(() => {
    const cachedLessons = readCachedCompletedLessons(authKey);

    return cachedLessons ? { authKey, lessons: cachedLessons } : null;
  });
  const [progressError, setProgressError] = useState("");
  const completedLessons =
    completedLessonsState?.authKey === authKey ? completedLessonsState.lessons : null;
  const isProgressLoading = shouldLoadProgress && completedLessons === null;

  useEffect(() => {
    if (!shouldLoadProgress || !authKey) {
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
  }, [authKey, shouldLoadProgress]);

  if (!course || !courseMeta) {
    return (
      <div className="panel">
        <h1>Курс не найден</h1>
      </div>
    );
  }

  return (
    <article className={clsx("reading-page", "compact-page", "route-page", styles.root)}>
      <header className="page-header">
        <a className="back-link" href={toPath("/courses")}>
          Все курсы
        </a>
        <p className="eyebrow">{isCourseAvailable ? "Доступный курс" : "Курс в разработке"}</p>
        <h1>{course.title}</h1>
        <span className={`status-badge status-badge--${courseMeta.tone}`}>{courseMeta.label}</span>
        <p className="lead">
          {isCourseAvailable
            ? `Иди сверху вниз. Сейчас открыты первые ${readySections.length} уроков, остальные темы появятся после доработки.`
            : "Контент будет добавляться по разделам. Пока курс не открыт для прохождения."}
        </p>
      </header>

      {sections.length > 0 ? (
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
      ) : (
        <section className={clsx("panel", styles.emptyState)}>
          <h2>Разделы ещё не добавлены</h2>
          <p>{course.description}</p>
          <p>Курс заведён как отдельная frontend-сущность. Учебный контент будет подключаться по разделам без смешивания с ООП C++.</p>
        </section>
      )}

      {progressError && (
        <section className={clsx("panel", styles.progressState)}>
          <span>{progressError}</span>
        </section>
      )}

      {sections.length > 0 && (
        <section className={styles.group}>
          <div className={styles.sectionHeading}>
            <h2>Открытые уроки</h2>
            <span>{readySections.length}</span>
          </div>
          <div className={styles.list}>
            {readySections.map((section) => (
              <CourseSectionRow
                key={`${section.courseId}:${section.slug}`}
                section={section}
                isCompleted={Boolean(completedLessons?.has(progressKey(section)))}
                isProgressLoading={isProgressLoading}
              />
            ))}
          </div>
        </section>
      )}

      {plannedSections.length > 0 && (
        <section className={styles.group}>
          <div className={styles.sectionHeading}>
            <h2>Позже</h2>
            <span>{plannedSections.length}</span>
          </div>
          <div className={styles.list}>
            {plannedSections.map((section) => (
              <CourseSectionRow
                key={`${section.courseId}:${section.slug}`}
                section={section}
                isCompleted={Boolean(completedLessons?.has(progressKey(section)))}
                isProgressLoading={isProgressLoading}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
