import { useMemo, useState } from "react";
import { TaskListPage } from "../components/TaskListPage";
import { tasks, type TaskLevel } from "../data/tasks";

type LevelFilter = "all" | TaskLevel;

const levelLabels: Record<LevelFilter, string> = {
  all: "все",
  easy: "легко",
  medium: "средне",
  hard: "сложно",
};

export function TasksIndexPage() {
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  const sections = useMemo(() => Array.from(new Set(tasks.map((task) => task.section))), []);

  const filteredTasks = useMemo(() => {
    const search = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const levelOk = levelFilter === "all" || task.level === levelFilter;
      const sectionOk = sectionFilter === "all" || task.section === sectionFilter;
      const text = [task.title, task.section, task.topics.join(" "), task.files.map((file) => file.fileName).join(" ")]
        .join(" ")
        .toLowerCase();
      const searchOk = !search || text.includes(search);

      return levelOk && sectionOk && searchOk;
    });
  }, [levelFilter, query, sectionFilter]);

  const visibleSections = Array.from(new Set(filteredTasks.map((task) => task.section)));

  return (
    <article className="reading-page tasks-page">
      <h1>Задачи</h1>
      <p className="lead">
        Выбери тему, открой задачу, скопируй каркас и пиши решение локально.
      </p>

      <section className="panel filters-panel">
        <label className="field">
          Поиск
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название, тема или файл"
          />
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
