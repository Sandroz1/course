export type MarkdownSection = {
  title?: string;
  lines: string[];
};

export type MarkdownSubsection = {
  title: string;
  lines: string[];
};

export function cleanHeadingTitle(text: string) {
  return text.replace(/^\d+\.\s+/, "");
}

export function headingId(text: string) {
  return cleanHeadingTitle(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

function normalizeSectionTitle(text: string) {
  return cleanHeadingTitle(text).trim().toLowerCase();
}

export function isPracticeHeading(title: string) {
  const normalized = normalizeSectionTitle(title);

  return (
    normalized === "задачи после темы" ||
    normalized === "практика" ||
    normalized === "практические задачи" ||
    normalized === "практическая задача"
  );
}

export function isMistakesHeading(title: string) {
  return normalizeSectionTitle(title).startsWith("частые ошибки");
}

export function isCheckHeading(title: string) {
  const normalized = normalizeSectionTitle(title);

  return normalized === "мини-проверка" || normalized === "самопроверка";
}

export function splitContentSections(content: string): MarkdownSection[] {
  const sections: MarkdownSection[] = [{ lines: [] }];
  let inCodeBlock = false;

  content.split("\n").forEach((line) => {
    const trimmed = line.trim();

    if (!inCodeBlock && trimmed.startsWith("## ")) {
      sections.push({
        title: cleanHeadingTitle(trimmed.slice(3).trim()),
        lines: [],
      });
      return;
    }

    sections[sections.length - 1].lines.push(line);

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
    }
  });

  return sections.filter((section) => section.title || section.lines.some((line) => line.trim()));
}

export function splitSubsections(lines: string[]): MarkdownSubsection[] {
  const sections: MarkdownSubsection[] = [];
  let current: MarkdownSubsection | null = null;
  let inCodeBlock = false;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!inCodeBlock && trimmed.startsWith("### ")) {
      current = {
        title: cleanHeadingTitle(trimmed.slice(4).trim()),
        lines: [],
      };
      sections.push(current);
      return;
    }

    if (current) {
      current.lines.push(line);
    }

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
    }
  });

  return sections;
}

export function stripMarkdown(text: string) {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}

export function extractListItems(lines: string[]) {
  const items: string[] = [];
  let inCodeBlock = false;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      return;
    }

    if (inCodeBlock) return;

    const match = trimmed.match(/^(?:[-*]\s+|\d+\.\s+)(.+)$/);
    if (match) {
      items.push(match[1].trim());
    }
  });

  return items;
}
