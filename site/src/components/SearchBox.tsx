import { useMemo, useState } from "react";
import { tasks } from "../data/tasks";
import { toPath } from "../utils/slug";

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
    <div className="search">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Поиск задачи или темы"
        aria-label="Поиск задачи или темы"
      />
      {results.length > 0 && (
        <div className="search__results">
          {results.map((task) => (
            <a key={task.id} href={toPath(`/tasks/${task.id}`)}>
              <strong>{task.title}</strong>
              <span>{task.section}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
