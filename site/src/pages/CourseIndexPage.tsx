import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { courseSections, isCourseSectionReady } from "../data/courseSections";
import { statusMeta } from "../data/status";
import { getCachedCourseProgress, readCachedCourseProgress } from "../lib/progressApi";
import type { ProgressOverview } from "../types/api";
import { toPath } from "../utils/slug";

type CourseSection = (typeof courseSections)[number];

function progressKey(section: CourseSection) {
  return `${section.courseId}:${section.slug}`;
}

function completedLessonKeys(progress: ProgressOverview) {
  return new Set(
    progress.lessons
      .filter((lesson) => lesson.is_completed)
      .map((lesson) => `${lesson.course_slug}:${lesson.lesson_slug}`),
  );
}

function readCachedCompletedLessons(authKey: string) {
  const progress = readCachedCourseProgress(authKey);

  return progress ? completedLessonKeys(progress) : null;
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
  const { slug, number, title, description, status } = section;
  const isReady = status === "available" || status === "ready";
  const meta = statusMeta[status];
  const progressLabel = isProgressLoading ? "Проверяем" : isCompleted ? "Пройдено" : "Доступен";
  const progressTone = isCompleted ? "success" : "muted";

  return (
    <a
      className={isReady ? "panel course-row" : "panel course-row course-row--in-progress"}
      href={toPath(`/course/${slug}`)}
    >
      <span className="course-row__number">{number}</span>
      <span className="course-row__body">
        <strong className="course-row__title">{title}</strong>
        {/* <span className="course-row__description">
          {isReady
            ? description
            : "Тема пока закрыта, чтобы не показывать недоработанное объяснение."}
        </span> */}
      </span>
      <span className="course-row__status">
        {isReady ? (
          <span className={`status-badge status-badge--${progressTone}`}>{progressLabel}</span>
        ) : (
          <span className={`status-badge status-badge--${meta.tone}`}>{meta.label}</span>
        )}
      </span>
      <span className={isReady ? "course-row__action" : "course-row__action course-row__action--muted"}>
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
          lessons: completedLessonKeys(progress),
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
    <article className="reading-page compact-page route-page">
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

      <section className="course-progress panel">
        <div>
          <strong>Порядок прохождения</strong>
          <span>Теория → задача → .cpp файл → самопроверка</span>
        </div>
        <div>
          <strong>{readySections.length} открыто</strong>
          <span>{plannedSections.length} тем на доработке</span>
        </div>
      </section>

      {progressError && (
        <section className="panel progress-state">
          <span>{progressError}</span>
        </section>
      )}

      <section className="course-group">
        <div className="section-heading">
          <h2>Открытые уроки</h2>
          <span>{readySections.length}</span>
        </div>
        <div className="course-list">
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

      <section className="course-group">
        <div className="section-heading">
          <h2>Позже</h2>
          <span>{plannedSections.length}</span>
        </div>
        <div className="course-list">
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
