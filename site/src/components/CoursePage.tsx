import type { ReactNode } from "react";
import { courseSections } from "../data/courseSections";
import { tasks } from "../data/tasks";
import { toPath } from "../utils/slug";
import { CodeBlock } from "./CodeBlock";

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
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

function headingKind(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("важно") || lower.includes("зачем")) return "important";
  if (lower.includes("синтаксис")) return "syntax";
  if (lower.includes("пример")) return lower.includes("плох") ? "error" : "example";
  if (lower.includes("ошиб")) return "error";
  if (lower.includes("провер")) return "check";
  if (lower.includes("задач")) return "tasks";
  return "default";
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
        const title = trimmed.slice(3);
        nodes.push(
          <h2
            className={`lesson-heading lesson-heading--${headingKind(title)}`}
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
          <div className="callout" key={`callout-${nodes.length}`}>
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
      const title = line.slice(3).trim();
      return { title, id: headingId(title) };
    });
}

export function CoursePage({ slug }: { slug: string }) {
  const normalizedSlug = slug === "structs" ? "struct" : slug;
  const section = courseSections.find((item) => item.slug === normalizedSlug);
  if (!section) {
    return (
      <div className="panel">
        <h1>Раздел не найден</h1>
      </div>
    );
  }

  const relatedTasks = tasks.filter((task) =>
    section.relatedTaskIds.includes(task.id),
  );
  const headings = collectHeadings(section.content);

  return (
    <article className="reading-page lesson-page">
      <p className="eyebrow">Раздел {section.number}</p>
      <h1>{section.title}</h1>
      <p className="lead">{section.description}</p>

      <div className="topic-list">
        {section.topics.map((topic) => (
          <span key={topic}>{topic}</span>
        ))}
      </div>

      {headings.length > 6 && (
        <nav className="panel lesson-toc" aria-label="Содержание раздела">
          <strong>Содержание</strong>
          <div>
            {headings.map((heading) => (
              <a href={`#${heading.id}`} key={heading.id}>
                {heading.title}
              </a>
            ))}
          </div>
        </nav>
      )}

      <section className="panel lesson-content">{renderContent(section.content)}</section>

      <section className="related-tasks">
        <div className="section-heading">
          <h2>Задачи после темы</h2>
          <span>{relatedTasks.length} задач</span>
        </div>
        <div className="task-grid task-grid--compact">
          {relatedTasks.map((task) => (
            <a className="task-card" key={task.id} href={toPath(`/tasks/${task.id}`)}>
              <strong>{task.title}</strong>
              <span className="task-card__meta">
                {task.files.length > 1 ? "многофайловая" : "один файл"}
              </span>
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}
