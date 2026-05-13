import { useEffect, useMemo, useState } from "react";
import { TaskListPage } from "../components/TaskListPage/TaskListPage";
import { useAuth } from "../context/AuthContext";
import { courseSections, isCourseSectionReady } from "../data/courseSections";
import { courses, type CourseId } from "../data/courses";
import { getStatusLabel } from "../data/status";
import { tasks, type TaskLevel } from "../data/tasks";
import { getCachedCourseProgress, readCachedCourseProgress } from "../lib/progressApi";
import type { ProgressOverview, TaskProgressStatus } from "../types/api";

type LevelFilter = "all" | TaskLevel;
type CourseFilter = "all" | CourseId;
type TaskStatusFilter = "all" | "available" | "in_progress" | "solved" | "needs-theory";

const levelLabels: Record<LevelFilter, string> = {
  all: "все",
  easy: "легко",
  medium: "средне",
  hard: "сложно",
};

const statusLabels: Record<TaskStatusFilter, string> = {
  all: "любой статус",
  available: getStatusLabel("available"),
  in_progress: "В работе",
  solved: "Пройдено",
  "needs-theory": getStatusLabel("needs-theory"),
};

function taskCountLabel(count: number) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${count} задач`;
  if (lastDigit === 1) return `${count} задача`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} задачи`;

  return `${count} задач`;
}

function createTaskProgressMap(progress: ProgressOverview | null) {
  const taskProgressById = new Map<string, TaskProgressStatus>();

  progress?.tasks.forEach((taskProgress) => {
    taskProgressById.set(taskProgress.task_id, taskProgress.status);
  });

  return taskProgressById;
}

function getTaskFilterStatus(
  task: (typeof tasks)[number],
  taskProgressById: Map<string, TaskProgressStatus>,
): TaskStatusFilter {
  const progressStatus = taskProgressById.get(task.id);

  if (progressStatus === "solved") return "solved";
  if (progressStatus === "in_progress") return "in_progress";

  const theory = courseSections.find((section) => section.slug === task.theorySlug);
  const hasClosedTheory =
    task.status === "needs-theory" || (theory ? !isCourseSectionReady(theory) : false);

  return hasClosedTheory ? "needs-theory" : "available";
}

export function TasksIndexPage() {
  const { accessToken, isAuthenticated } = useAuth();
  const authKey = accessToken ?? "";
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [taskProgressById, setTaskProgressById] = useState<Map<string, TaskProgressStatus>>(
    () => new Map(),
  );

  const sections = useMemo(() => Array.from(new Set(tasks.map((task) => task.section))), []);

  useEffect(() => {
    if (!isAuthenticated || !authKey) {
      setTaskProgressById(new Map());
      return;
    }

    let cancelled = false;
    const cachedProgress = readCachedCourseProgress(authKey);

    if (cachedProgress) {
      setTaskProgressById(createTaskProgressMap(cachedProgress));
      return;
    }

    getCachedCourseProgress(authKey)
      .then((progress) => {
        if (!cancelled) {
          setTaskProgressById(createTaskProgressMap(progress));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTaskProgressById(new Map());
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authKey, isAuthenticated]);

  const filteredTasks = useMemo(() => {
    const search = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const courseOk = courseFilter === "all" || task.courseId === courseFilter;
      const statusOk =
        statusFilter === "all" || getTaskFilterStatus(task, taskProgressById) === statusFilter;
      const levelOk = levelFilter === "all" || task.level === levelFilter;
      const sectionOk = sectionFilter === "all" || task.section === sectionFilter;
      const courseTitle = courses.find((course) => course.id === task.courseId)?.title ?? "";
      const text = [
        task.title,
        task.section,
        courseTitle,
        task.topics.join(" "),
        task.files.map((file) => file.fileName).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const searchOk = !search || text.includes(search);

      return courseOk && statusOk && levelOk && sectionOk && searchOk;
    });
  }, [courseFilter, levelFilter, query, sectionFilter, statusFilter, taskProgressById]);

  const visibleSections = Array.from(new Set(filteredTasks.map((task) => task.section)));
  const hasActiveFilters = Boolean(
    query.trim() ||
      courseFilter !== "all" ||
      statusFilter !== "all" ||
      levelFilter !== "all" ||
      sectionFilter !== "all",
  );
  const closedTheoryTaskCount = filteredTasks.filter((task) => {
    const theory = courseSections.find((section) => section.slug === task.theorySlug);
    return task.status === "needs-theory" || (theory ? !isCourseSectionReady(theory) : false);
  }).length;

  function resetFilters() {
    setQuery("");
    setCourseFilter("all");
    setStatusFilter("all");
    setLevelFilter("all");
    setSectionFilter("all");
  }

  return (
    <article className="reading-page tasks-page">
      <header className="page-header">
        <p className="eyebrow">Практика</p>
        <h1>Задачи</h1>
        <p className="lead">Фильтруй задачи по курсу, теме и сложности.</p>
      </header>

      <section className="panel filters-panel filters-panel--tasks">
        <label className="field">
          Поиск
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название, тема, курс или файл"
          />
        </label>
        <label className="field">
          Курс
          <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value as CourseFilter)}>
            <option value="all">все курсы</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.shortTitle}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Статус
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as TaskStatusFilter)}
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Раздел
          <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
            <option value="all">все разделы</option>
            {sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Сложность
          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value as LevelFilter)}
          >
            {Object.entries(levelLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="filters-summary" aria-live="polite">
          <strong>{taskCountLabel(filteredTasks.length)}</strong>
          <span>найдено</span>
          {hasActiveFilters && (
            <button className="button button--small button--ghost" type="button" onClick={resetFilters}>
              Сбросить
            </button>
          )}
        </div>
      </section>

      {closedTheoryTaskCount > 0 && (
        <section className="task-theory-note">
          <strong>Часть задач ждёт теорию.</strong>
          <span>{getStatusLabel("needs-theory")}: {closedTheoryTaskCount}</span>
        </section>
      )}

      {visibleSections.length === 0 && (
        <section className="panel empty-state">
          <h2>Задачи не найдены</h2>
          <p>Измени фильтры или поисковый запрос.</p>
          {hasActiveFilters && (
            <button className="button button--small" type="button" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          )}
        </section>
      )}

      {visibleSections.map((section) => {
        const count = filteredTasks.filter((task) => task.section === section).length;
        return (
          <section className="task-section" key={section}>
            <div className="section-heading">
              <h2>{section}</h2>
              <span>{taskCountLabel(count)}</span>
            </div>
            <TaskListPage
              section={section}
              sourceTasks={filteredTasks}
              taskProgressById={taskProgressById}
            />
          </section>
        );
      })}
    </article>
  );
}
