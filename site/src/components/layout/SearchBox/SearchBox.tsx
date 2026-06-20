import { useMemo, useState } from "react";

import { routePrefixes } from "../../../app/routes";
import { getCourseById } from "../../../data/courses";
import { tasks } from "../../../data/tasks";
import { getTaskSearchText } from "../../../utils/taskSearch";
import { toPath } from "../../../utils/slug";
import styles from "./SearchBox.module.scss";

const searchEntries = tasks.map((task) => ({
  task,
  text: getTaskSearchText(task, getCourseById(task.courseId)?.title),
}));

export function SearchBox() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];

    return searchEntries
      .filter((entry) => entry.text.includes(value))
      .map((entry) => entry.task)
      .slice(0, 8);
  }, [query]);

  return (
    <div className={styles.root}>
      <input
        className={styles.input}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setQuery("");
          }
        }}
        placeholder="Поиск задачи или темы"
        aria-label="Поиск задачи или темы"
        aria-expanded={results.length > 0}
      />
      {results.length > 0 && (
        <div className={styles.results}>
          {results.map((task) => (
            <a
              className={styles.resultLink}
              key={task.id}
              href={toPath(`${routePrefixes.taskDetails}${task.id}`)}
              onClick={() => setQuery("")}
            >
              <strong>{task.title}</strong>
              <span className={styles.resultSection}>{task.section}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
