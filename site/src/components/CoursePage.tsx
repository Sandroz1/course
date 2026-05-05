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

    block.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList(nodes, unordered, false);
        flushList(nodes, ordered, true);
        return;
      }
      if (trimmed.startsWith("## ")) {
        flushList(nodes, unordered, false);
        flushList(nodes, ordered, true);
        nodes.push(<h2 key={`h2-${nodes.length}`}>{trimmed.slice(3)}</h2>);
        return;
      }
      if (trimmed.startsWith("### ")) {
        flushList(nodes, unordered, false);
        flushList(nodes, ordered, true);
        nodes.push(<h3 key={`h3-${nodes.length}`}>{trimmed.slice(4)}</h3>);
        return;
      }
      if (trimmed.startsWith("- ")) {
        flushList(nodes, ordered, true);
        unordered.push(trimmed.slice(2));
        return;
      }
      if (/^\d+\.\s/.test(trimmed)) {
        flushList(nodes, unordered, false);
        ordered.push(trimmed.replace(/^\d+\.\s/, ""));
        return;
      }
      if (trimmed.startsWith("> ")) {
        flushList(nodes, unordered, false);
        flushList(nodes, ordered, true);
        nodes.push(
          <div className="callout" key={`callout-${nodes.length}`}>
            {renderInline(trimmed.slice(2))}
          </div>,
        );
        return;
      }
      flushList(nodes, unordered, false);
      flushList(nodes, ordered, true);
      nodes.push(<p key={`p-${nodes.length}`}>{renderInline(trimmed)}</p>);
    });

    flushList(nodes, unordered, false);
    flushList(nodes, ordered, true);
  });

  return nodes;
}

function collectHeadings(content: string) {
  return content
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.slice(3).trim());
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

      <section className="panel important-panel">
        <h2>Что будет в разделе</h2>
        <ul>
          {headings.map((heading) => (
            <li key={heading}>{heading}</li>
          ))}
        </ul>
      </section>

      <section className="panel lesson-content">{renderContent(section.content)}</section>

      <section>
        <h2>Практика по теме</h2>
        <div className="task-grid">
          {relatedTasks.map((task) => (
            <a className="task-card" key={task.id} href={toPath(`/tasks/${task.id}`)}>
              <strong>{task.title}</strong>
              <span className="path-label">
                {task.files.length > 1 ? "многофайловая задача" : task.files[0].fileName}
              </span>
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}
