export type MessageBlock =
    | { type: "paragraph"; text: string }
    | { type: "heading"; text: string }
    | { type: "list"; items: string[] }
    | { type: "code"; code: string; language: string };

function removeDecorativeText(text: string) {
    return text
        .replace(/\p{Extended_Pictographic}/gu, "")
        .replace(/[\uFE0E\uFE0F]/g, "")
        .trim();
}

function stripIntro(text: string) {
    let result = text.trimStart();
    let previous = "";

    while (result !== previous) {
        previous = result;
        result = result
            .replace(/^(конечно[!,.]?\s*)/i, "")
            .replace(/^(отлично[!,.]?\s*)/i, "")
            .replace(/^(давай(?:те)?\s+разбер[её]м[^\n.]*[.!]?\s*)/i, "")
            .trimStart();
    }

    return result.trim();
}

function isDecorativeSeparator(line: string) {
    return /^[-*_]{3,}$/.test(line.trim());
}

function normalizeAssistantText(content: string) {
    return stripIntro(content.replace(/\r\n/g, "\n"));
}

export function parseMessageBlocks(content: string): MessageBlock[] {
    const lines = normalizeAssistantText(content).split("\n");
    const blocks: MessageBlock[] = [];
    let paragraphLines: string[] = [];
    let listItems: string[] = [];

    function flushParagraph() {
        if (paragraphLines.length === 0) return;
        blocks.push({ type: "paragraph", text: paragraphLines.join(" ").trim() });
        paragraphLines = [];
    }

    function flushList() {
        if (listItems.length === 0) return;
        blocks.push({ type: "list", items: listItems });
        listItems = [];
    }

    for (let index = 0; index < lines.length; index += 1) {
        const rawLine = lines[index];
        const trimmedLine = rawLine.trim();

        if (trimmedLine.startsWith("```")) {
            flushParagraph();
            flushList();

            const language = trimmedLine.replace(/^```/, "").trim();
            const codeLines: string[] = [];
            index += 1;

            while (index < lines.length && !lines[index].trim().startsWith("```")) {
                codeLines.push(lines[index]);
                index += 1;
            }

            blocks.push({ type: "code", code: codeLines.join("\n").trimEnd(), language });
            continue;
        }

        const cleanLine = removeDecorativeText(rawLine);

        if (!cleanLine || isDecorativeSeparator(cleanLine)) {
            flushParagraph();
            flushList();
            continue;
        }

        const headingMatch = cleanLine.match(/^#{1,6}\s+(.+)$/);

        if (headingMatch) {
            flushParagraph();
            flushList();
            blocks.push({ type: "heading", text: headingMatch[1].replace(/\*\*/g, "").trim() });
            continue;
        }

        const listMatch = cleanLine.match(/^(?:[-*]|\d+[.)])\s+(.+)$/);

        if (listMatch) {
            flushParagraph();
            listItems.push(listMatch[1].trim());
            continue;
        }

        flushList();
        paragraphLines.push(cleanLine);
    }

    flushParagraph();
    flushList();

    return blocks.length > 0 ? blocks : [{ type: "paragraph", text: "" }];
}
