import { useMemo, useState } from "react";
import { TaskListPage } from "../components/TaskListPage";
import { tasks } from "../data/tasks";

export function TasksIndexPage() {
  const [levelFilter, setLevelFilter] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");

  const sections = useMemo(() => Array.from(new Set(tasks.map((task) => task.section))), []);
  const topics = useMemo(
    () => Array.from(new Set(tasks.flatMap((task) => task.topics))).sort(),
    [],
  );

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const levelOk = levelFilter === "all" || task.level === levelFilter;
        const sectionOk = sectionFilter === "all" || task.section === sectionFilter;
        const topicOk = topicFilter === "all" || task.topics.includes(topicFilter);
        return levelOk && sectionOk && topicOk;
      }),
    [levelFilter, sectionFilter, topicFilter],
  );

  const visibleSections = Array.from(new Set(filteredTasks.map((task) => task.section)));

  return (
    <article className="reading-page">
      <h1>Задачи</h1>
      <p className="lead">
        Задачи сгруппированы по темам. Открывайте их после соответствующего раздела курса:
        на странице задачи есть цель, файлы, каркас, план, подсказки и самопроверка.
      </p>

      <section className="panel">
        <h2>Фильтры</h2>
        <div className="filters-row">
          <label>
            Уровень
            <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as "all" | "easy" | "medium" | "hard")}>
              <option value="all">все</option>
              <option value="easy">легко</option>
              <option value="medium">средне</option>
              <option value="hard">сложно</option>
            </select>
          </label>
          <label>
            Раздел
            <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
              <option value="all">все</option>
              {sections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </label>
          <label>
            Тема
            <select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}>
              <option value="all">все</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {visibleSections.map((section) => (
        <section key={section}>
          <h2>{section}</h2>
          <TaskListPage section={section} sourceTasks={filteredTasks} />
        </section>
      ))}
    </article>
  );
}
