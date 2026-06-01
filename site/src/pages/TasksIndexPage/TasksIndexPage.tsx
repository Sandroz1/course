import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { courses, type CourseId } from "../../data/courses";
import { getStatusLabel } from "../../data/status";
import { tasks, type TaskLevel } from "../../data/tasks";
import { getTaskProgressById } from "../../features/course-progress/progressSelectors";
import { getCachedCourseProgress, readCachedCourseProgress } from "../../lib/progressApi";
import clsx from "clsx";
import { DropdownSelect, type DropdownOption } from "../../components/shared/DropdownSelect/DropdownSelect";
import { Button } from "../../components/shared/ActionButton/ActionButton";
import { EmptyState } from "../../components/shared/LearningUi/LearningUi";
import type { TaskProgressStatus } from "../../types/api";
import {
  getTaskDisplayStatus,
  isTaskTheoryClosed,
  taskCountLabel,
  taskLevelLabels,
} from "../../utils/taskDisplay";
import { TaskCardGrid } from "./components/TaskCardGrid";
import styles from "./TasksIndexPage.module.scss";

type LevelFilter = "all" | TaskLevel;
type CourseFilter = "all" | CourseId;
type TaskStatusFilter = "all" | "available" | "in_progress" | "solved" | "needs-theory";

const levelLabels: Record<LevelFilter, string> = {
  all: "все",
  easy: taskLevelLabels.easy,
  medium: taskLevelLabels.medium,
  hard: taskLevelLabels.hard,
};

const statusLabels: Record<TaskStatusFilter, string> = {
  all: "любой статус",
  available: getStatusLabel("available"),
  in_progress: "В работе",
  solved: "Пройдено",
  "needs-theory": getStatusLabel("needs-theory"),
};

function getTaskFilterStatus(
  task: (typeof tasks)[number],
  taskProgressById: Map<string, TaskProgressStatus>,
): TaskStatusFilter {
  return getTaskDisplayStatus(task, taskProgressById);
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
  const courseOptions = useMemo<Array<DropdownOption<CourseFilter>>>(
    () => [
      { value: "all", label: "все курсы" },
      ...courses.map((course) => ({ value: course.id, label: course.shortTitle })),
    ],
    [],
  );
  const statusOptions = useMemo<Array<DropdownOption<TaskStatusFilter>>>(
    () =>
      (Object.entries(statusLabels) as Array<[TaskStatusFilter, string]>).map(
        ([value, label]) => ({ value, label }),
      ),
    [],
  );
  const sectionOptions = useMemo<Array<DropdownOption<string>>>(
    () => [
      { value: "all", label: "все разделы" },
      ...sections.map((section) => ({ value: section, label: section })),
    ],
    [sections],
  );
  const levelOptions = useMemo<Array<DropdownOption<LevelFilter>>>(
    () =>
      (Object.entries(levelLabels) as Array<[LevelFilter, string]>).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );

  useEffect(() => {
    if (!isAuthenticated || !authKey) {
      setTaskProgressById(new Map());
      return;
    }

    let cancelled = false;
    const cachedProgress = readCachedCourseProgress(authKey);

    if (cachedProgress) {
      setTaskProgressById(getTaskProgressById(cachedProgress));
      return;
    }

    getCachedCourseProgress(authKey)
      .then((progress) => {
        if (!cancelled) {
          setTaskProgressById(getTaskProgressById(progress));
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
  const closedTheoryTaskCount = filteredTasks.filter(isTaskTheoryClosed).length;

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

      <section className={clsx("panel", styles.filters)}>
        <label className={styles.field}>
          Поиск
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название, тема, курс или файл"
          />
        </label>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Курс</span>
          <DropdownSelect
            label="Курс"
            value={courseFilter}
            options={courseOptions}
            onChange={setCourseFilter}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Статус</span>
          <DropdownSelect
            label="Статус"
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Раздел</span>
          <DropdownSelect
            label="Раздел"
            value={sectionFilter}
            options={sectionOptions}
            onChange={setSectionFilter}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Сложность</span>
          <DropdownSelect
            label="Сложность"
            value={levelFilter}
            options={levelOptions}
            onChange={setLevelFilter}
          />
        </div>
        <div className={styles.summary} aria-live="polite">
          <strong className="count-badge count-badge--accent">
            {taskCountLabel(filteredTasks.length)}
          </strong>
          <span>найдено</span>
          <Button
            className={styles.reset}
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            aria-hidden={!hasActiveFilters}
            tabIndex={hasActiveFilters ? undefined : -1}
            size="small"
            variant="ghost"
          >
            Сбросить
          </Button>
        </div>
      </section>

      {closedTheoryTaskCount > 0 && (
        <section className={styles.theoryNote}>
          <strong>Часть задач ждёт теорию.</strong>
          <span>{getStatusLabel("needs-theory")}: {closedTheoryTaskCount}</span>
        </section>
      )}

      {visibleSections.length === 0 && (
        <EmptyState
          title="Нет задач по этим фильтрам"
          description="Измени запрос, курс или статус либо верни полный список."
          action={
            hasActiveFilters ? (
              <Button onClick={resetFilters} size="small">
                Показать все задачи
              </Button>
            ) : undefined
          }
        />
      )}

      {visibleSections.map((section) => {
        const count = filteredTasks.filter((task) => task.section === section).length;
        return (
          <section className={styles.taskSection} key={section}>
            <div className={styles.sectionHeading}>
              <h2>{section}</h2>
              <span className="count-badge">{taskCountLabel(count)}</span>
            </div>
            <TaskCardGrid
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
