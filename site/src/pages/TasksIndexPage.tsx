import { useMemo, useState } from "react";
import { TaskListPage } from "../components/TaskListPage/TaskListPage";
import { courseSections, isCourseSectionReady } from "../data/courseSections";
import { courses, type CourseId } from "../data/courses";
import { getStatusLabel } from "../data/status";
import { tasks, type TaskLevel } from "../data/tasks";

type LevelFilter = "all" | TaskLevel;
type CourseFilter = "all" | CourseId;
type TaskStatusFilter = "all" | "available" | "needs-theory";

const levelLabels: Record<LevelFilter, string> = {
  all: "все",
  easy: "легко",
  medium: "средне",
  hard: "сложно",
};

const statusLabels: Record<TaskStatusFilter, string> = {
  all: "любой статус",
  available: getStatusLabel("available"),
  "needs-theory": getStatusLabel("needs-theory"),
};

export function TasksIndexPage() {
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  const sections = useMemo(() => Array.from(new Set(tasks.map((task) => task.section))), []);

  const filteredTasks = useMemo(() => {
    const search = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const courseOk = courseFilter === "all" || task.courseId === courseFilter;
      const statusOk = statusFilter === "all" || task.status === statusFilter;
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
  }, [courseFilter, levelFilter, query, sectionFilter, statusFilter]);

  const visibleSections = Array.from(new Set(filteredTasks.map((task) => task.section)));
  const closedTheoryTaskCount = filteredTasks.filter((task) => {
    const theory = courseSections.find((section) => section.slug === task.theorySlug);
    return task.status === "needs-theory" || (theory ? !isCourseSectionReady(theory) : false);
  }).length;

  return (
    <article className="reading-page tasks-page">
      <header className="page-header">
        <p className="eyebrow">Практика</p>
        <h1>Задачи</h1>
        <p className="lead">Фильтр и список задач. Закрытые темы отмечены отдельно.</p>
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
      </section>

      {closedTheoryTaskCount > 0 && (
        <section className="panel task-theory-note">
          <strong>Есть задачи с закрытой теорией</strong>
          <p>Они отмечены статусом {getStatusLabel("needs-theory")}.</p>
        </section>
      )}

      {visibleSections.length === 0 && (
        <section className="panel">
          <p>Задачи не найдены. Измени фильтры или поисковый запрос.</p>
        </section>
      )}

      {visibleSections.map((section) => {
        const count = filteredTasks.filter((task) => task.section === section).length;
        return (
          <section className="task-section" key={section}>
            <div className="section-heading">
              <h2>{section}</h2>
              <span>{count} задач</span>
            </div>
            <TaskListPage section={section} sourceTasks={filteredTasks} />
          </section>
        );
      })}
    </article>
  );
}
