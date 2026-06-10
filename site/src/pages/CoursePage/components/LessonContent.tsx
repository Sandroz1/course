import { Fragment, useState, type ReactNode } from "react";

import { CodeBlock } from "../../../components/shared/CodeBlock/CodeBlock";
import {
  cleanHeadingTitle,
  extractListItems,
  headingId,
  isCheckHeading,
  isMistakesHeading,
  isPracticeHeading,
  splitContentSections,
  splitSubsections,
  stripMarkdown,
  type MarkdownSection,
} from "../../../utils/lessonMarkdown";
import clsx from "clsx";
import styles from "./LessonContent.module.scss";

type TocItem = {
  title: string;
  id: string;
};

const MAX_TOC_ITEMS = 7;

export function renderInline(text: string) {
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

function renderMarkdownContent(content: string) {
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
            {renderInline(title)}
          </h2>,
        );
        return;
      }
      if (trimmed.startsWith("### ")) {
        flushAll();
        nodes.push(<h3 key={`h3-${nodes.length}`}>{renderInline(cleanHeadingTitle(trimmed.slice(4)))}</h3>);
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

function parseMistakeTitle(title: string, index: number) {
  const match = title.match(/^Ошибка(?:\s+(\d+))?\.?:?\s*(.*)$/i);

  if (!match) {
    return {
      label: `Ошибка ${index + 1}`,
      title,
    };
  }

  return {
    label: match[1] ? `Ошибка ${match[1]}` : `Ошибка ${index + 1}`,
    title: match[2] || title,
  };
}

function MistakesBlock({ title, lines }: { title: string; lines: string[] }) {
  const subsections = splitSubsections(lines);
  const listItems = subsections.length === 0 ? extractListItems(lines) : [];

  const mistakes =
    subsections.length > 0
      ? subsections
      : listItems.length > 0
        ? listItems.map((item) => ({ title: item, lines: [] }))
        : [{ title, lines }];

  return (
    <section className={styles.specialSection} id={headingId(title)}>
      <div className={styles.specialHeader}>
        <span>Разбор ошибок</span>
        <h2>Частые ошибки</h2>
      </div>

      <div className={styles.mistakeList}>
        {mistakes.map((mistake, index) => {
          const meta = parseMistakeTitle(mistake.title, index);

          return (
            <article className={styles.mistakeCard} key={`${meta.label}-${meta.title}`}>
              <header className={styles.mistakeCardHeader}>
                <span>{meta.label}</span>
                <h3>{renderInline(meta.title)}</h3>
              </header>
              {mistake.lines.length > 0 && (
                <div className={styles.mistakeBody}>
                  {renderMarkdownContent(mistake.lines.join("\n"))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function extractCheckItems(lines: string[]) {
  const listItems = extractListItems(lines);

  if (listItems.length > 0) {
    return listItems;
  }

  return lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("```") && !line.startsWith("### "));
}

function MiniCheckBlock({ title, lines }: { title: string; lines: string[] }) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(() => new Set());
  const questions = extractCheckItems(lines);

  function toggleQuestion(index: number) {
    setCheckedItems((current) => {
      const next = new Set(current);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  }

  return (
    <section className={styles.specialSection} id={headingId(title)}>
      <div className={styles.specialHeader}>
        <span>Самопроверка</span>
        <h2>Мини-проверка</h2>
        <p>Ответь коротко своими словами и отметь вопросы, в которых уверен.</p>
      </div>

      <div className={styles.checkList}>
        {questions.map((question, index) => {
          const isChecked = checkedItems.has(index);

          return (
            <button
              className={clsx(styles.checkItem, isChecked && styles.checkItemChecked)}
              key={`${index}-${question}`}
              type="button"
              aria-pressed={isChecked}
              onClick={() => toggleQuestion(index)}
            >
              <span className={styles.checkNumber}>{index + 1}</span>
              <span className={styles.checkText}>{renderInline(question)}</span>
              <span className={styles.checkState}>{isChecked ? "Готово" : "Отметить"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function renderLessonContent(content: string) {
  return splitContentSections(content).map((section, index) => {
    if (!section.title) {
      return (
        <Fragment key={`intro-${index}`}>
          {renderMarkdownContent(section.lines.join("\n"))}
        </Fragment>
      );
    }

    if (isPracticeHeading(section.title)) {
      return null;
    }

    if (isMistakesHeading(section.title)) {
      return <MistakesBlock key={`mistakes-${section.title}`} title={section.title} lines={section.lines} />;
    }

    if (isCheckHeading(section.title)) {
      return <MiniCheckBlock key={`check-${section.title}`} title={section.title} lines={section.lines} />;
    }

    return (
      <Fragment key={`section-${section.title}`}>
        {renderMarkdownContent(`## ${section.title}\n${section.lines.join("\n")}`)}
      </Fragment>
    );
  });
}

function collectHeadings(content: string) {
  return splitContentSections(content)
    .filter((section): section is MarkdownSection & { title: string } =>
      Boolean(section.title && !isPracticeHeading(section.title)),
    )
    .map((section) => {
      const title = stripMarkdown(cleanHeadingTitle(section.title.trim()));
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
    title: "Мини-проверка",
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
    <section className={clsx("panel", "lesson-content", styles.content)}>
      {renderLessonContent(content)}
    </section>
  );
}
