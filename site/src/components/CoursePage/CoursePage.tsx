import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import { courseSections, isCourseSectionReady } from "../../data/courseSections";
import { statusMeta } from "../../data/status";
import { tasks } from "../../data/tasks";
import {
  getCachedCourseProgress,
  readCachedCourseProgress,
  setCachedCourseStudyState,
  setCachedLessonProgress,
  updateStudyState,
  upsertLessonProgress,
} from "../../lib/progressApi";
import { classNames } from "../../shared/lib/classNames";
import type { ProgressOverview } from "../../types/api";
import { toPath } from "../../utils/slug";
import { CodeBlock } from "../CodeBlock/CodeBlock";
import styles from "./CoursePage.module.scss";

type TocItem = {
  title: string;
  id: string;
};

type LessonProgressState = {
  authKey: string;
  key: string;
  isCompleted: boolean;
};

const MAX_TOC_ITEMS = 7;

function findLessonProgress(progress: ProgressOverview, courseSlug: string, lessonSlug: string) {
  return progress.lessons.find(
    (lesson) => lesson.course_slug === courseSlug && lesson.lesson_slug === lessonSlug,
  );
}

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function headingId(text: string) {
  return cleanHeadingTitle(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

function cleanHeadingTitle(text: string) {
  return text.replace(/^\d+\.\s+/, "");
}

function flushList(nodes: ReactNode[], list: string[], ordered: boolean) {
  if (list.length === 0) return;
  const Tag = ordered ? "ol" : "ul";
  nodes.push(
    <Tag key={`list-${nodes.length}`}>
      {list.map((item) => (
        <li key={item}>{renderInline(item)}</li>
      ))}
    </Tag>,
  );
  list.length = 0;
}

function flushTable(nodes: ReactNode[], rows: string[]) {
  if (rows.length < 2) return;
  const normalizedRows = rows
    .filter((row) => !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(row))
    .map((row) =>
      row
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean),
    );

  if (normalizedRows.length === 0) return;
  const [head, ...body] = normalizedRows;
  nodes.push(
    <table key={`table-${nodes.length}`}>
      <thead>
        <tr>
          {head.map((cell) => (
            <th key={cell}>{renderInline(cell)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell) => (
              <td key={cell}>{renderInline(cell)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>,
  );
}

function renderContent(content: string) {
  const nodes: ReactNode[] = [];
  const blocks = content.split(/```/g);

  blocks.forEach((block, index) => {
    if (index % 2 === 1) {
      const firstLine = block.split("\n")[0].trim();
      const language = firstLine || "cpp";
      const code = block.replace(/^\w+\n/, "").trim();
      nodes.push(<CodeBlock key={`code-${index}`} code={code} language={language} />);
      return;
    }

    const unordered: string[] = [];
    const ordered: string[] = [];
    const tableRows: string[] = [];

    const flushAll = () => {
      if (tableRows.length > 0) {
        flushTable(nodes, tableRows);
        tableRows.length = 0;
      }
      flushList(nodes, unordered, false);
      flushList(nodes, ordered, true);
    };

    block.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushAll();
        return;
      }
      if (trimmed.startsWith("|")) {
        flushList(nodes, unordered, false);
        flushList(nodes, ordered, true);
        tableRows.push(trimmed);
        return;
      }
      if (trimmed.startsWith("## ")) {
        flushAll();
        const title = cleanHeadingTitle(trimmed.slice(3));
        nodes.push(
          <h2
            className={styles.heading}
            id={headingId(title)}
            key={`h2-${nodes.length}`}
          >
            {title}
          </h2>,
        );
        return;
      }
      if (trimmed.startsWith("### ")) {
        flushAll();
        nodes.push(<h3 key={`h3-${nodes.length}`}>{trimmed.slice(4)}</h3>);
        return;
      }
      if (trimmed.startsWith("- ")) {
        if (tableRows.length > 0) {
          flushTable(nodes, tableRows);
          tableRows.length = 0;
        }
        flushList(nodes, ordered, true);
        unordered.push(trimmed.slice(2));
        return;
      }
      if (/^\d+\.\s/.test(trimmed)) {
        if (tableRows.length > 0) {
          flushTable(nodes, tableRows);
          tableRows.length = 0;
        }
        flushList(nodes, unordered, false);
        ordered.push(trimmed.replace(/^\d+\.\s/, ""));
        return;
      }
      if (trimmed.startsWith("> ")) {
        flushAll();
        nodes.push(
          <div className={styles.callout} key={`callout-${nodes.length}`}>
            {renderInline(trimmed.slice(2))}
          </div>,
        );
        return;
      }
      flushAll();
      nodes.push(<p key={`p-${nodes.length}`}>{renderInline(trimmed)}</p>);
    });

    if (tableRows.length > 0) flushTable(nodes, tableRows);
    flushList(nodes, unordered, false);
    flushList(nodes, ordered, true);
  });

  return nodes;
}

function collectHeadings(content: string) {
  return content
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const title = cleanHeadingTitle(line.slice(3).trim());
      return { title, id: headingId(title) };
    });
}

const tocRules: Array<{ title: string; patterns: RegExp[] }> = [
  {
    title: "Зачем нужна тема",
    patterns: [/простое объяснение/i, /проблема/i, /зачем/i, /почему/i],
  },
  {
    title: "Основные понятия",
    patterns: [/что такое/i, /класс и объект/i, /поле/i, /метод/i],
  },
  {
    title: "Синтаксис",
    patterns: [/синтаксис/i, /private/i, /public/i, /const/i],
  },
  {
    title: "Как читать код",
    patterns: [/как читать/i, /разбор/i],
  },
  {
    title: "Как написать самому",
    patterns: [/как написать/i, /самому/i, /алгоритм/i],
  },
  {
    title: "Пример из задачи",
    patterns: [/пример/i, /задач[аиуы]/i],
  },
  {
    title: "Частые ошибки",
    patterns: [/ошиб/i],
  },
  {
    title: "Самопроверка",
    patterns: [/провер/i],
  },
  {
    title: "Задачи после темы",
    patterns: [/задачи после темы/i],
  },
];

function collectTocItems(content: string) {
  const headings = collectHeadings(content);
  const used = new Set<string>();
  const toc: TocItem[] = [];

  tocRules.forEach((rule) => {
    const heading = headings.find(
      (item) =>
        !used.has(item.id) &&
        rule.patterns.some((pattern) => pattern.test(item.title)),
    );

    if (heading) {
      used.add(heading.id);
      toc.push({ title: rule.title, id: heading.id });
    }
  });

  if (toc.length < 4) {
    headings
      .filter((item) => !used.has(item.id))
      .slice(0, 6 - toc.length)
      .forEach((item) => toc.push(item));
  }

  return toc.slice(0, MAX_TOC_ITEMS);
}

const openedLessonSyncRequests = new Map<string, Promise<void>>();

function shouldSyncOpenedLessonState(
  progress: ProgressOverview | null,
  courseSlug: string,
  lessonSlug: string,
) {
  const state = progress?.state;

  return !state || state.last_course_slug !== courseSlug || state.last_lesson_slug !== lessonSlug;
}

function syncOpenedLessonState(
  authKey: string,
  courseSlug: string,
  lessonSlug: string,
  progress: ProgressOverview | null,
) {
  if (!shouldSyncOpenedLessonState(progress, courseSlug, lessonSlug)) {
    return Promise.resolve();
  }

  const key = `${authKey}:${courseSlug}:${lessonSlug}`;
  const existingRequest = openedLessonSyncRequests.get(key);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const state = await updateStudyState({
      last_course_slug: courseSlug,
      last_lesson_slug: lessonSlug,
    });
    setCachedCourseStudyState(authKey, state);
  })();

  openedLessonSyncRequests.set(key, request);
  request.then(
    () => {
      if (openedLessonSyncRequests.get(key) === request) {
        openedLessonSyncRequests.delete(key);
      }
    },
    () => {
      if (openedLessonSyncRequests.get(key) === request) {
        openedLessonSyncRequests.delete(key);
      }
    },
  );

  return request;
}

export function CoursePage({ slug }: { slug: string }) {
  const { accessToken, isAuthenticated } = useAuth();
  const authKey = accessToken ?? "";
  const normalizedSlug = slug === "structs" ? "struct" : slug;
  const section = courseSections.find((item) => item.slug === normalizedSlug);
  const sectionIndex = courseSections.findIndex((item) => item.slug === normalizedSlug);
  const [lessonProgressState, setLessonProgressState] = useState<LessonProgressState | null>(null);
  const [isProgressChecking, setIsProgressChecking] = useState(true);
  const [isProgressSaving, setIsProgressSaving] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const previousSection = sectionIndex > 0 ? courseSections[sectionIndex - 1] : undefined;
  const nextSection =
    sectionIndex >= 0 && sectionIndex < courseSections.length - 1
      ? courseSections[sectionIndex + 1]
      : undefined;
  const readySections = courseSections.filter(isCourseSectionReady);
  const readySectionIndex = readySections.findIndex((item) => item.slug === normalizedSlug);
  const lessonProgressKey = section ? `${section.courseId}:${section.slug}` : "";
  const cachedCourseProgress = authKey ? readCachedCourseProgress(authKey) : null;
  const cachedLessonProgress =
    section && cachedCourseProgress
      ? findLessonProgress(cachedCourseProgress, section.courseId, section.slug)
      : undefined;
  const hasLocalLessonProgressState =
    lessonProgressState?.authKey === authKey && lessonProgressState.key === lessonProgressKey;
  const hasLessonProgressState = Boolean(cachedCourseProgress) || hasLocalLessonProgressState;
  const isLessonCompleted = hasLocalLessonProgressState
    ? lessonProgressState.isCompleted
    : Boolean(cachedLessonProgress?.is_completed);
  const isProgressPending = isAuthenticated && isProgressChecking && !hasLessonProgressState;

  useEffect(() => {
    if (!section || !isCourseSectionReady(section)) {
      setIsProgressChecking(false);
      return;
    }

    const currentSection = section;
    const currentKey = `${currentSection.courseId}:${currentSection.slug}`;

    setProgressMessage("");

    if (!isAuthenticated || !authKey) {
      setLessonProgressState({ authKey, key: currentKey, isCompleted: false });
      setIsProgressChecking(false);
      return;
    }

    let cancelled = false;

    function applyCourseProgress(progress: ProgressOverview) {
      const lessonProgress = findLessonProgress(
        progress,
        currentSection.courseId,
        currentSection.slug,
      );

      setLessonProgressState({
        authKey,
        key: currentKey,
        isCompleted: Boolean(lessonProgress?.is_completed),
      });
    }

    const cachedProgress = readCachedCourseProgress(authKey);

    if (cachedProgress) {
      applyCourseProgress(cachedProgress);
      setIsProgressChecking(false);
    } else {
      setIsProgressChecking(true);
    }

    async function loadAndSyncCourseProgress() {
      let progress = cachedProgress;

      if (!progress) {
        try {
          progress = await getCachedCourseProgress(authKey);

          if (cancelled) return;

          applyCourseProgress(progress);
        } catch {
          if (!cancelled) {
            setLessonProgressState(null);
            setProgressMessage("Прогресс временно недоступен.");
          }
          return;
        } finally {
          if (!cancelled) {
            setIsProgressChecking(false);
          }
        }
      }

      if (cancelled) return;

      void syncOpenedLessonState(
        authKey,
        currentSection.courseId,
        currentSection.slug,
        progress,
      ).catch(() => {
        if (!cancelled) {
          setProgressMessage("Прогресс временно не синхронизирован.");
        }
      });

      if (cachedProgress) {
        setIsProgressChecking(false);
      }
    }

    void loadAndSyncCourseProgress();

    return () => {
      cancelled = true;
    };
  }, [authKey, isAuthenticated, section]);

  if (!section) {
    return (
      <div className="panel">
        <h1>Раздел не найден</h1>
      </div>
    );
  }

  if (!isCourseSectionReady(section)) {
    return (
      <article className="reading-page lesson-page">
        <section className={classNames("panel", styles.sectionPlaceholder)}>
          <p className="eyebrow">Раздел {section.number}</p>
          <span className={`status-badge status-badge--${statusMeta[section.status].tone}`}>
            {statusMeta[section.status].label}
          </span>
          <h1>Раздел на доработке</h1>
          <p>
            Тема пока закрыта, чтобы не показывать недоработанное объяснение.
            Сейчас готовы разделы 0–5.
          </p>

          <div className="actions">
            <a className="button button--primary" href={toPath("/course")}>
              Вернуться к курсу
            </a>
            <a className="button" href={toPath("/tasks")}>
              Открыть задачи
            </a>
          </div>
        </section>
      </article>
    );
  }

  const relatedTasks = tasks.filter((task) =>
    section.relatedTaskIds.includes(task.id),
  );
  const tocItems = collectTocItems(section.content);

  async function handleToggleCompleted() {
    if (!section || !isAuthenticated || !authKey || isProgressSaving || isProgressPending || !hasLessonProgressState) return;

    const nextValue = !isLessonCompleted;
    setIsProgressSaving(true);
    setProgressMessage("");

    try {
      const progress = await upsertLessonProgress({
        course_slug: section.courseId,
        lesson_slug: section.slug,
        is_completed: nextValue,
      });

      setCachedLessonProgress(authKey, progress);
      setLessonProgressState({
        authKey,
        key: `${section.courseId}:${section.slug}`,
        isCompleted: Boolean(progress.is_completed),
      });
      setProgressMessage(progress.is_completed ? "Урок отмечен как пройденный." : "Отметка снята.");
    } catch {
      setProgressMessage("Не удалось сохранить прогресс. Можно продолжать читать урок.");
    } finally {
      setIsProgressSaving(false);
    }
  }

  return (
    <article className="reading-page lesson-page">
      <header className={styles.lessonHeader}>
        <a className="back-link" href={toPath("/course")}>
          К курсу
        </a>
        <p className="eyebrow">Раздел {section.number}</p>
        <h1>{section.title}</h1>
        <div className={styles.headerMeta}>
          <span className="status-badge status-badge--success">{statusMeta.ready.label}</span>
          <span>Урок {readySectionIndex + 1} из {readySections.length} открытых</span>
          {isAuthenticated && isLessonCompleted && (
            <span className="status-badge status-badge--success">Пройдено</span>
          )}
        </div>
        <p className="lead">{section.description}</p>

        <div className="topic-list topic-list--quiet">
          {section.topics.slice(0, 4).map((topic) => (
            <span key={topic}>{topic}</span>
          ))}
        </div>
      </header>

      {isAuthenticated && (
        <section className={styles.progressPanel}>
          <button
            className={isLessonCompleted && !isProgressPending ? "button" : "button button--primary"}
            disabled={isProgressSaving || isProgressPending || !hasLessonProgressState}
            type="button"
            onClick={() => void handleToggleCompleted()}
          >
            {isProgressSaving
              ? "Сохраняем..."
                : isProgressPending
                  ? "Проверяем..."
                  : !hasLessonProgressState
                    ? "Прогресс недоступен"
                    : isLessonCompleted
                      ? "Снять отметку"
                      : "Отметить пройдено"}
          </button>
          {progressMessage ? <span>{progressMessage}</span> : null}
        </section>
      )}

      {/*
      <section className={styles.readingNote}>
        <strong>Как читать этот урок</strong>
        <span>
          Иди блоками: сначала пойми проблему, потом пример кода, потом разбор. Не нужно заучивать
          весь раздел за один проход.
        </span>
      </section>
      */}

      {tocItems.length > 3 && (
        <nav className={styles.toc} aria-label="Содержание раздела">
          <strong>В этом разделе</strong>
          <div>
            {tocItems.map((item) => (
              <a href={`#${item.id}`} key={item.id}>
                {item.title}
              </a>
            ))}
          </div>
        </nav>
      )}

      <section className={classNames("panel", "lesson-content", styles.content)}>{renderContent(section.content)}</section>

      {(previousSection || nextSection) && (
        <nav className={styles.nav} aria-label="Навигация между уроками">
          {previousSection ? (
            <a className={styles.navLink} href={toPath(`/course/${previousSection.slug}`)}>
              <span className={styles.navLabel}>Предыдущий</span>
              <strong>
                {previousSection.number}. {previousSection.title}
              </strong>
            </a>
          ) : (
            <span />
          )}
          {nextSection ? (
            <a className={classNames(styles.navLink, styles.navLinkNext)} href={toPath(`/course/${nextSection.slug}`)}>
              <span className={styles.navLabel}>Следующий</span>
              <strong>
                {nextSection.number}. {nextSection.title}
              </strong>
              {!isCourseSectionReady(nextSection) && (
                <span className={`status-badge status-badge--${statusMeta[nextSection.status].tone}`}>
                  {statusMeta[nextSection.status].label}
                </span>
              )}
            </a>
          ) : (
            <span />
          )}
        </nav>
      )}

      <section className={styles.relatedTasks}>
        <div className="section-heading">
          <h2>Задачи после темы</h2>
        </div>
        <div className={styles.relatedTaskList}>
          {relatedTasks.map((task) => (
            <a className={styles.relatedTaskLink} key={task.id} href={toPath(`/tasks/${task.id}`)}>
              <strong>{task.title}</strong>
              <span>Открыть</span>
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}
