import { useMemo, useState } from "react";

import { routePrefixes } from "../../../app/routes";
import { tasks } from "../../../data/tasks";
import { toPath } from "../../../utils/slug";
import styles from "./SearchBox.module.scss";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];

    return tasks
      .filter((task) =>
        [task.title, task.section, task.files.map((file) => file.fileName).join(" "), task.topics.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(value),
      )
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
