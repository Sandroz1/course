import type { ReactNode } from "react";

import { CodeBlock } from "../../../components/shared/CodeBlock/CodeBlock";
import { classNames } from "../../../shared/lib/classNames";
import styles from "./LessonContent.module.scss";

type TocItem = {
  title: string;
  id: string;
};

const MAX_TOC_ITEMS = 7;

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function cleanHeadingTitle(text: string) {
  return text.replace(/^\d+\.\s+/, "");
}

function headingId(text: string) {
  return cleanHeadingTitle(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
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

function renderLessonContent(content: string) {
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
        const title = cleanHeadingTitle(trimmed.slice(3));
        nodes.push(
          <h2 className={styles.heading} id={headingId(title)} key={`h2-${nodes.length}`}>
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
          <div className={styles.callout} key={`callout-${nodes.length}`}>
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
      const title = cleanHeadingTitle(line.slice(3).trim());
      return { title, id: headingId(title) };
    });
}

const tocRules: Array<{ title: string; patterns: RegExp[] }> = [
  {
    title: "Зачем нужна тема",
    patterns: [/простое объяснение/i, /проблема/i, /зачем/i, /почему/i],
  },
  {
    title: "Основные понятия",
    patterns: [/что такое/i, /класс и объект/i, /поле/i, /метод/i],
  },
  {
    title: "Синтаксис",
    patterns: [/синтаксис/i, /private/i, /public/i, /const/i],
  },
  {
    title: "Как читать код",
    patterns: [/как читать/i, /разбор/i],
  },
  {
    title: "Как написать самому",
    patterns: [/как написать/i, /самому/i, /алгоритм/i],
  },
  {
    title: "Пример из задачи",
    patterns: [/пример/i, /задач[аиуы]/i],
  },
  {
    title: "Частые ошибки",
    patterns: [/ошиб/i],
  },
  {
    title: "Самопроверка",
    patterns: [/провер/i],
  },
  {
    title: "Задачи после темы",
    patterns: [/задачи после темы/i],
  },
];

export function collectTocItems(content: string): TocItem[] {
  const headings = collectHeadings(content);
  const used = new Set<string>();
  const toc: TocItem[] = [];

  tocRules.forEach((rule) => {
    const heading = headings.find(
      (item) =>
        !used.has(item.id) &&
        rule.patterns.some((pattern) => pattern.test(item.title)),
    );

    if (heading) {
      used.add(heading.id);
      toc.push({ title: rule.title, id: heading.id });
    }
  });

  if (toc.length < 4) {
    headings
      .filter((item) => !used.has(item.id))
      .slice(0, 6 - toc.length)
      .forEach((item) => toc.push(item));
  }

  return toc.slice(0, MAX_TOC_ITEMS);
}

export function LessonContent({ content }: { content: string }) {
  return (
    <section className={classNames("panel", "lesson-content", styles.content)}>
      {renderLessonContent(content)}
    </section>
  );
}
