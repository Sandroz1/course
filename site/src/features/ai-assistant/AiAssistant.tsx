import {
    FormEvent,
    type ReactNode,
    type PointerEvent as ReactPointerEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiError, isApiConfigured } from "../../lib/api";
import {
    AI_USAGE_UPDATED_EVENT,
    formatAiUsage,
    getLocalAiUsage,
    markAiLimitReached,
    recordAiSuccess,
} from "../../lib/aiUsage";
import { sendAiChat } from "../../lib/aiApi";
import { classNames } from "../../shared/lib/classNames";
import type { AiChatMessage, AiUsage } from "../../types/api";
import { toPath } from "../../utils/slug";
import styles from "./AiAssistant.module.scss";

type ResizeDirection = "left" | "top" | "corner";
type ChatMessage = AiChatMessage & { id: string };

type MessageBlock =
    | { type: "paragraph"; text: string }
    | { type: "heading"; text: string }
    | { type: "list"; items: string[] }
    | { type: "code"; code: string; language: string };

const MIN_PANEL_WIDTH = 340;
const MAX_PANEL_WIDTH = 760;
const MIN_PANEL_HEIGHT = 420;
const MAX_PANEL_HEIGHT_CAP = 820;
const STORAGE_KEY_PANEL_SIZE = "aiPanelSize";
const SELECTION_POPOVER_WIDTH = 132;
const SELECTION_POPOVER_HEIGHT = 34;
const SELECTION_POPOVER_GAP = 10;
const SELECTION_POPOVER_MARGIN = 12;

function readStoredPanelSize(): { width: number; height: number } {
    const fallback = { width: 430, height: 620 };
    let saved: string | null = null;

    try {
        saved = localStorage.getItem(STORAGE_KEY_PANEL_SIZE);
    } catch {
        return fallback;
    }

    if (!saved) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(saved) as { width?: unknown; height?: unknown };

        if (
            typeof parsed.width !== "number" ||
            typeof parsed.height !== "number" ||
            !Number.isFinite(parsed.width) ||
            !Number.isFinite(parsed.height)
        ) {
            return fallback;
        }

        return { width: parsed.width, height: parsed.height };
    } catch {
        return fallback;
    }
}

function getPanelBounds() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxWidth = Math.min(MAX_PANEL_WIDTH, vw - 32);
    const maxHeight = Math.min(MAX_PANEL_HEIGHT_CAP, Math.max(MIN_PANEL_HEIGHT, vh - 112));
    const minWidth = Math.min(MIN_PANEL_WIDTH, maxWidth);
    const minHeight = Math.min(MIN_PANEL_HEIGHT, maxHeight);

    return { minWidth, maxWidth, minHeight, maxHeight };
}

type SelectionPopover = {
    x: number;
    y: number;
    placement: "above" | "below";
};

function getElementFromNode(node: Node | null) {
    if (!node) {
        return null;
    }

    return node.nodeType === Node.ELEMENT_NODE
        ? (node as Element)
        : node.parentElement;
}

function isInsideLessonContent(node: Node | null) {
    const element = getElementFromNode(node);

    return Boolean(element?.closest(".lesson-content"));
}

function getClosestCodeBlock(node: Node | null) {
    return getElementFromNode(node)?.closest("pre, .shiki") ?? null;
}

function isInputSelection() {
    const activeElement = document.activeElement;
    const tagName = activeElement?.tagName?.toLowerCase();

    return tagName === "textarea" || tagName === "input";
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function getSelectionPopoverPosition(selectionRect: DOMRect, anchorRect: DOMRect) {
    const maxLeft = Math.max(
        SELECTION_POPOVER_MARGIN,
        window.innerWidth - SELECTION_POPOVER_WIDTH - SELECTION_POPOVER_MARGIN
    );
    const maxTop = Math.max(
        SELECTION_POPOVER_MARGIN,
        window.innerHeight - SELECTION_POPOVER_HEIGHT - SELECTION_POPOVER_MARGIN
    );
    const selectionCenter = selectionRect.left + selectionRect.width / 2;
    const spaceAbove = anchorRect.top - SELECTION_POPOVER_MARGIN;
    const spaceBelow = window.innerHeight - anchorRect.bottom - SELECTION_POPOVER_MARGIN;
    const shouldPlaceBelow =
        spaceAbove < SELECTION_POPOVER_HEIGHT + SELECTION_POPOVER_GAP &&
        spaceBelow >= spaceAbove;
    const rawTop = shouldPlaceBelow
        ? anchorRect.bottom + SELECTION_POPOVER_GAP
        : anchorRect.top - SELECTION_POPOVER_HEIGHT - SELECTION_POPOVER_GAP;

    return {
        x: clamp(
            selectionCenter - SELECTION_POPOVER_WIDTH / 2,
            SELECTION_POPOVER_MARGIN,
            maxLeft
        ),
        y: clamp(rawTop, SELECTION_POPOVER_MARGIN, maxTop),
        placement: shouldPlaceBelow ? "below" as const : "above" as const,
    };
}

function clampPanelSize(size: { width: number; height: number }) {
    const { minWidth, maxWidth, minHeight, maxHeight } = getPanelBounds();

    return {
        width: clamp(size.width, minWidth, maxWidth),
        height: clamp(size.height, minHeight, maxHeight),
    };
}

function isNearBottom(element: HTMLDivElement) {
    const distanceFromBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight;

    return distanceFromBottom < 80;
}

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

function parseMessageBlocks(content: string): MessageBlock[] {
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

function renderInline(text: string): ReactNode[] {
    return text.split(/(`[^`]+`)/g).map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
            return <code key={index}>{part.slice(1, -1)}</code>;
        }

        return <span key={index}>{part.replace(/\*\*/g, "").replace(/__/g, "")}</span>;
    });
}

function MessageContent({ content, role }: { content: string; role: AiChatMessage["role"] }) {
    if (role === "user") {
        return <p>{content}</p>;
    }

    const blocks = parseMessageBlocks(content);

    return (
        <div className={styles.messageContent}>
            {blocks.map((block, index) => {
                if (block.type === "heading") {
                    return <h3 key={index}>{renderInline(block.text)}</h3>;
                }

                if (block.type === "list") {
                    return (
                        <ul key={index}>
                            {block.items.map((item, itemIndex) => (
                                <li key={`${index}-${itemIndex}`}>{renderInline(item)}</li>
                            ))}
                        </ul>
                    );
                }

                if (block.type === "code") {
                    return (
                        <pre className={styles.messageCode} key={index}>
                            <code>{block.code}</code>
                        </pre>
                    );
                }

                return <p key={index}>{renderInline(block.text)}</p>;
            })}
        </div>
    );
}

function readLessonSelection() {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        return null;
    }

    if (isInputSelection()) {
        return null;
    }

    const text = selection.toString().trim();

    if (text.length < 3) {
        return null;
    }

    const anchorInsideLesson = isInsideLessonContent(selection.anchorNode);
    const focusInsideLesson = isInsideLessonContent(selection.focusNode);

    if (!anchorInsideLesson || !focusInsideLesson) {
        return null;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const firstRect = range.getClientRects()[0];

    const finalRect = rect.width > 0 && rect.height > 0 ? rect : firstRect;

    if (!finalRect) {
        return null;
    }

    const isSelectionOutsideViewport =
        finalRect.bottom < SELECTION_POPOVER_MARGIN ||
        finalRect.top > window.innerHeight - SELECTION_POPOVER_MARGIN ||
        finalRect.right < SELECTION_POPOVER_MARGIN ||
        finalRect.left > window.innerWidth - SELECTION_POPOVER_MARGIN;

    if (isSelectionOutsideViewport) {
        return null;
    }

    const anchorCodeBlock = getClosestCodeBlock(selection.anchorNode);
    const focusCodeBlock = getClosestCodeBlock(selection.focusNode);
    const anchorRect =
        anchorCodeBlock && anchorCodeBlock === focusCodeBlock
            ? anchorCodeBlock.getBoundingClientRect()
            : finalRect;

    return {
        text: text.slice(0, 5000),
        position: getSelectionPopoverPosition(finalRect, anchorRect),
    };
}

function getAiAccessMessage({
    isAuthenticated,
    isAuthLoading,
    isPhoneVerified,
}: {
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    isPhoneVerified: boolean;
}) {
    if (isAuthLoading) {
        return "Проверяем аккаунт...";
    }

    if (!isAuthenticated) {
        return "Войдите, чтобы использовать AI.";
    }

    if (!isPhoneVerified) {
        return "Подтвердите телефон в профиле.";
    }

    return "";
}

function getAiErrorMessage(error: unknown) {
    if (!(error instanceof ApiError)) {
        return "Не удалось получить ответ от AI.";
    }

    if (error.status === 401) {
        return "Сессия истекла. Войдите снова.";
    }

    if (error.status === 403) {
        return "Подтвердите телефон в профиле.";
    }

    if (error.status === 429) {
        const retryText = error.retryAfterSeconds
            ? ` Попробуйте через ${error.retryAfterSeconds} с.`
            : "";
        return `${error.message || "Лимит запросов к AI исчерпан."}${retryText}`;
    }

    if (error.status >= 500 || error.status === 0) {
        return error.message || "AI-сервис временно недоступен.";
    }

    return error.message || "Не удалось получить ответ от AI.";
}

function focusTextareaAtEnd(textarea: HTMLTextAreaElement | null) {
    if (!textarea || textarea.disabled) {
        return;
    }

    textarea.focus({ preventScroll: true });

    const caretPosition = textarea.value.length;
    textarea.setSelectionRange(caretPosition, caretPosition);
}

export function AiAssistant() {
    const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();

    if (!isApiConfigured()) {
        return null;
    }

    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [selectedText, setSelectedText] = useState("");
    const [selectionPopover, setSelectionPopover] =
        useState<SelectionPopover | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [showJumpToBottom, setShowJumpToBottom] = useState(false);
    const [panelSize, setPanelSize] = useState(() =>
        clampPanelSize(readStoredPanelSize())
    );
    const [aiUsage, setAiUsage] = useState<AiUsage>(() => getLocalAiUsage(user?.id));
    const isPhoneVerified = Boolean(user?.is_phone_verified);
    const aiAccessMessage = getAiAccessMessage({
        isAuthenticated,
        isAuthLoading,
        isPhoneVerified,
    });
    const canUseAi = !aiAccessMessage;
    const isLimitReached = canUseAi && Boolean(user) && aiUsage.remaining <= 0;
    const canSendAi = canUseAi && !isLimitReached;
    const isLockedPanel = !canUseAi && messages.length === 0;
    const usageText = formatAiUsage(aiUsage);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const messagesRef = useRef<HTMLDivElement | null>(null);
    const messageRefs = useRef(new Map<string, HTMLDivElement>());
    const messageIdCounterRef = useRef(0);
    const wasOpenRef = useRef(false);
    const pendingScrollTargetRef = useRef<{ id: string; align: "start" | "nearest" } | null>(null);
    const isProgrammaticScrollRef = useRef(false);
    const userScrolledDuringPendingAnswerRef = useRef(false);
    const shouldStickToBottomRef = useRef(true);
    const resizeSessionRef = useRef<{
        direction: ResizeDirection;
        startX: number;
        startY: number;
        startWidth: number;
        startHeight: number;
    } | null>(null);
    const panelSizeDuringResizeRef = useRef(panelSize);

    useEffect(() => {
        function handleOpenAiAssistant() {
            setIsOpen(true);
            setSelectionPopover(null);

            window.requestAnimationFrame(() => {
                focusTextareaAtEnd(textareaRef.current);
            });
        }

        window.addEventListener("uchicode-open-ai", handleOpenAiAssistant);

        return () => window.removeEventListener("uchicode-open-ai", handleOpenAiAssistant);
    }, []);

    useEffect(() => {
        panelSizeDuringResizeRef.current = panelSize;
    }, [panelSize]);

    useEffect(() => {
        setAiUsage(getLocalAiUsage(user?.id));

        function syncUsage() {
            setAiUsage(getLocalAiUsage(user?.id));
        }

        window.addEventListener(AI_USAGE_UPDATED_EVENT, syncUsage);

        return () => window.removeEventListener(AI_USAGE_UPDATED_EVENT, syncUsage);
    }, [user?.id]);

    useEffect(() => {
        function handleWindowResize() {
            setPanelSize((prev) => clampPanelSize(prev));
        }

        handleWindowResize();
        window.addEventListener("resize", handleWindowResize);

        return () => window.removeEventListener("resize", handleWindowResize);
    }, []);

    useEffect(() => {
        let selectionTimer: number | null = null;
        let isPointerSelecting = false;

        function clearSelectionTimer() {
            if (selectionTimer !== null) {
                window.clearTimeout(selectionTimer);
                selectionTimer = null;
            }
        }

        function syncSelection() {
            if (isPointerSelecting) {
                return;
            }

            const lessonSelection = readLessonSelection();

            if (!lessonSelection) {
                setSelectionPopover(null);

                if (!isOpen) {
                    setSelectedText("");
                }

                return;
            }

            setSelectedText(lessonSelection.text);
            setSelectionPopover(lessonSelection.position);
        }

        function syncSelectionAfterDelay(delay = 130) {
            clearSelectionTimer();

            selectionTimer = window.setTimeout(() => {
                syncSelection();
            }, delay);
        }

        function handlePointerDown(event: PointerEvent) {
            const target = event.target;

            if (!(target instanceof Element)) {
                return;
            }

            if (
                target.closest(`.${styles.selectionPopover}`) ||
                target.closest(`.${styles.panel}`) ||
                target.closest(`.${styles.floatingButton}`)
            ) {
                return;
            }

            isPointerSelecting = true;
            clearSelectionTimer();
            setSelectionPopover(null);
        }

        function handlePointerUp() {
            isPointerSelecting = false;
            syncSelectionAfterDelay(130);
        }

        function handleSelectionChange() {
            if (isPointerSelecting) {
                setSelectionPopover(null);

                return;
            }

            syncSelectionAfterDelay(130);
        }

        function handleKeyboardSelection() {
            syncSelectionAfterDelay(80);
        }

        function handlePageMove() {
            if (selectionPopover) {
                syncSelectionAfterDelay(40);
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("pointerup", handlePointerUp);
        document.addEventListener("keyup", handleKeyboardSelection);
        document.addEventListener("selectionchange", handleSelectionChange);

        window.addEventListener("scroll", handlePageMove, true);
        window.addEventListener("resize", handlePageMove);

        return () => {
            clearSelectionTimer();

            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("pointerup", handlePointerUp);
            document.removeEventListener("keyup", handleKeyboardSelection);
            document.removeEventListener("selectionchange", handleSelectionChange);

            window.removeEventListener("scroll", handlePageMove, true);
            window.removeEventListener("resize", handlePageMove);
        };
    }, [isOpen, selectionPopover]);

    useEffect(() => {
        if (!isOpen) {
            wasOpenRef.current = false;
            return;
        }

        if (wasOpenRef.current) {
            return;
        }

        wasOpenRef.current = true;

        const frameId = window.requestAnimationFrame(() => {
            focusTextareaAtEnd(textareaRef.current);
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [isOpen, question]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        shouldStickToBottomRef.current = true;
        setShowJumpToBottom(false);

        const frameId = window.requestAnimationFrame(() => {
            const el = messagesRef.current;

            if (el) {
                el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
            }
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const target = pendingScrollTargetRef.current;

        if (!target) {
            return;
        }

        pendingScrollTargetRef.current = null;

        const frameId = window.requestAnimationFrame(() => {
            const container = messagesRef.current;
            const message = messageRefs.current.get(target.id);

            if (!container || !message) {
                return;
            }

            const top =
                target.align === "start"
                    ? Math.max(message.offsetTop - 10, 0)
                    : Math.max(message.offsetTop + message.offsetHeight - container.clientHeight + 12, 0);

            isProgrammaticScrollRef.current = true;
            container.scrollTo({ top, behavior: "smooth" });

            window.setTimeout(() => {
                isProgrammaticScrollRef.current = false;
            }, 260);

            shouldStickToBottomRef.current = isNearBottom(container);
            setShowJumpToBottom(!isNearBottom(container));
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [messages, isOpen]);

    function handleMessagesScroll() {
        const element = messagesRef.current;

        if (!element) {
            return;
        }

        shouldStickToBottomRef.current = isNearBottom(element);

        if (isProgrammaticScrollRef.current) {
            setShowJumpToBottom(!shouldStickToBottomRef.current);
            return;
        }

        if (isLoading && !shouldStickToBottomRef.current) {
            userScrolledDuringPendingAnswerRef.current = true;
        }

        setShowJumpToBottom(!shouldStickToBottomRef.current);
    }

    function createMessageId(role: AiChatMessage["role"]) {
        messageIdCounterRef.current += 1;
        return `${role}-${messageIdCounterRef.current}`;
    }

    function setMessageRef(id: string, node: HTMLDivElement | null) {
        if (node) {
            messageRefs.current.set(id, node);
        } else {
            messageRefs.current.delete(id);
        }
    }

    function startResize(
        event: ReactPointerEvent<HTMLSpanElement>,
        direction: ResizeDirection
    ) {
        event.preventDefault();
        event.stopPropagation();

        const size = panelSizeDuringResizeRef.current;

        resizeSessionRef.current = {
            direction,
            startX: event.clientX,
            startY: event.clientY,
            startWidth: size.width,
            startHeight: size.height,
        };

        function onPointerMove(moveEvent: PointerEvent) {
            const session = resizeSessionRef.current;

            if (!session) {
                return;
            }

            const { minWidth, maxWidth, minHeight, maxHeight } = getPanelBounds();
            let nextW = session.startWidth;
            let nextH = session.startHeight;

            if (session.direction === "left" || session.direction === "corner") {
                nextW = session.startWidth + (session.startX - moveEvent.clientX);
            }

            if (session.direction === "top" || session.direction === "corner") {
                nextH = session.startHeight + (session.startY - moveEvent.clientY);
            }

            const clamped = {
                width: clamp(nextW, minWidth, maxWidth),
                height: clamp(nextH, minHeight, maxHeight),
            };

            panelSizeDuringResizeRef.current = clamped;
            setPanelSize(clamped);
        }

        function onPointerUp() {
            resizeSessionRef.current = null;
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);

            try {
                localStorage.setItem(
                    STORAGE_KEY_PANEL_SIZE,
                    JSON.stringify(panelSizeDuringResizeRef.current)
                );
            } catch {
                // Resizing should not fail when storage is unavailable.
            }
        }

        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);
    }

    function jumpToLatestMessage() {
        const element = messagesRef.current;

        if (!element) {
            return;
        }

        shouldStickToBottomRef.current = true;
        element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
        setShowJumpToBottom(false);
    }

    async function sendQuestion(event: FormEvent) {
        event.preventDefault();

        const cleanQuestion = question.trim();

        if (!cleanQuestion || isLoading) {
            return;
        }

        if (!isApiConfigured()) {
            setErrorText("Не задан VITE_API_BASE_URL в site/.env.local");
            return;
        }

        if (!canUseAi) {
            setErrorText(aiAccessMessage);
            return;
        }

        if (isLimitReached) {
            setErrorText("Лимит AI-запросов на сегодня исчерпан.");
            return;
        }

        const userMessage: ChatMessage = {
            id: createMessageId("user"),
            role: "user",
            content: selectedText
                ? `Вопрос по выделенному тексту: ${cleanQuestion}`
                : cleanQuestion,
        };

        shouldStickToBottomRef.current = true;
        userScrolledDuringPendingAnswerRef.current = false;
        pendingScrollTargetRef.current = { id: userMessage.id, align: "nearest" };
        setShowJumpToBottom(false);
        setMessages((currentMessages) => [...currentMessages, userMessage]);
        setQuestion("");
        setErrorText("");
        setIsLoading(true);

        try {
            const data = await sendAiChat({
                question: cleanQuestion,
                selectedText,
                history: messages.slice(-8).map(({ role, content }) => ({ role, content })),
            });

            const assistantMessage: ChatMessage = {
                id: createMessageId("assistant"),
                role: "assistant",
                content: data.answer || "Пустой ответ от модели.",
            };

            if (!userScrolledDuringPendingAnswerRef.current) {
                pendingScrollTargetRef.current = { id: assistantMessage.id, align: "start" };
            }

            if (user) {
                setAiUsage(recordAiSuccess(user.id, data.usage));
            }

            setMessages((currentMessages) => [...currentMessages, assistantMessage]);
        } catch (error) {
            if (user && error instanceof ApiError && error.status === 429) {
                setAiUsage(markAiLimitReached(user.id, error.payload?.usage));
            }

            setErrorText(getAiErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }

    function askAboutSelectedText() {
        setIsOpen(true);
        setSelectionPopover(null);
        setQuestion("Объясни выделенный фрагмент простыми словами");

        window.requestAnimationFrame(() => {
            focusTextareaAtEnd(textareaRef.current);
        });
    }

    function clearSelectedText() {
        setSelectedText("");

        window.requestAnimationFrame(() => {
            focusTextareaAtEnd(textareaRef.current);
        });
    }

    return (
        <>
            {selectedText && selectionPopover && !isOpen && canUseAi ? (
                <button
                    className={classNames(
                        styles.selectionPopover,
                        selectionPopover.placement === "below" && styles.selectionPopoverBelow,
                    )}
                    type="button"
                    data-placement={selectionPopover.placement}
                    style={{
                        left: `${selectionPopover.x}px`,
                        top: `${selectionPopover.y}px`,
                    }}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={askAboutSelectedText}
                >
                    Спросить у AI
                </button>
            ) : null}

            <button
                className={styles.floatingButton}
                type="button"
                onClick={() => setIsOpen((value) => !value)}
                aria-label={isOpen ? "Закрыть помощника" : "Открыть помощника"}
            >
                {isOpen ? "×" : "AI"}
            </button>

            {isOpen ? (
                <aside
                    className={classNames(styles.panel, isLockedPanel && styles.panelLocked)}
                    aria-label="AI помощник"
                    style={{
                        width: `${panelSize.width}px`,
                        height: isLockedPanel ? undefined : `${panelSize.height}px`,
                    }}
                >
                    <div className={styles.panelHeader}>
                        <div>
                            <p>AI помощник</p>
                            <h2>
                                {selectedText ? "Вопрос по выделенному" : "Помощник по C++"}
                            </h2>
                            {isAuthenticated && isPhoneVerified ? (
                                <span className={styles.usageText}>{usageText}</span>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            className={styles.panelClose}
                            onClick={() => setIsOpen(false)}
                            aria-label="Закрыть помощника"
                        >
                            ×
                        </button>
                    </div>

                    {selectedText ? (
                        <div className={styles.selectedText}>
                            <div className={styles.selectedTextTop}>
                                <span>Выделенный текст из темы</span>
                                <button type="button" onClick={clearSelectedText}>
                                    убрать
                                </button>
                            </div>
                            <p>{selectedText}</p>
                        </div>
                    ) : null}

                    {!canUseAi ? (
                        <div className={styles.accessNotice}>
                            <p>{aiAccessMessage}</p>
                            {!isAuthenticated && !isAuthLoading ? (
                                <a href={toPath("/login")}>Войти</a>
                            ) : null}
                            {isAuthenticated && !isPhoneVerified ? (
                                <a href={toPath("/profile")}>Открыть профиль</a>
                            ) : null}
                        </div>
                    ) : null}

                    {canUseAi && isLimitReached ? (
                        <div className={styles.usageNotice}>
                            <span>{usageText}</span>
                            <strong>Лимит на сегодня исчерпан</strong>
                        </div>
                    ) : null}

                    {canUseAi || messages.length > 0 ? (
                        <div className={styles.messagesWrap}>
                            <div
                                className={styles.messages}
                                ref={messagesRef}
                                onScroll={handleMessagesScroll}
                            >
                                {messages.length === 0 && canSendAi ? (
                                    <div className={styles.empty}>
                                        <p>Задай вопрос по C++ или выделенному фрагменту.</p>
                                    </div>
                                ) : null}

                                {messages.map((message) => (
                                    <div
                                        className={classNames(
                                            styles.message,
                                            message.role === "user" ? styles.messageUser : styles.messageAssistant,
                                        )}
                                        key={message.id}
                                        ref={(node) => setMessageRef(message.id, node)}
                                    >
                                        <span className={styles.messageRole}>
                                            {message.role === "user" ? "Ты" : "AI"}
                                        </span>
                                        <MessageContent content={message.content} role={message.role} />
                                    </div>
                                ))}

                                {isLoading ? (
                                    <div className={classNames(styles.message, styles.messageAssistant)}>
                                        <span className={styles.messageRole}>AI</span>
                                        <p>Думаю...</p>
                                    </div>
                                ) : null}
                            </div>

                            {showJumpToBottom ? (
                                <button
                                    type="button"
                                    className={styles.jumpBottom}
                                    onClick={jumpToLatestMessage}
                                >
                                    К последнему сообщению
                                </button>
                            ) : null}
                        </div>
                    ) : null}

                    {errorText ? <p className={styles.error}>{errorText}</p> : null}

                    {canUseAi ? (
                        <form className={styles.form} onSubmit={sendQuestion}>
                            <textarea
                                ref={textareaRef}
                                value={question}
                                onChange={(event) => setQuestion(event.target.value)}
                                placeholder={
                                    isLimitReached
                                        ? "Лимит на сегодня исчерпан"
                                        : selectedText
                                        ? "Что объяснить в выделенном фрагменте?"
                                        : "Спроси что-нибудь по C++..."
                                }
                                rows={3}
                                disabled={!canSendAi || isLoading}
                            />

                            <button type="submit" disabled={!canSendAi || isLoading || !question.trim()}>
                                Отправить
                            </button>
                        </form>
                    ) : null}

                    <span
                        className={classNames(styles.resizeZone, styles.resizeZoneLeft)}
                        onPointerDown={(event) => startResize(event, "left")}
                        aria-hidden="true"
                    />
                    <span
                        className={classNames(styles.resizeZone, styles.resizeZoneTop)}
                        onPointerDown={(event) => startResize(event, "top")}
                        aria-hidden="true"
                    />
                    <span
                        className={classNames(styles.resizeZone, styles.resizeZoneCorner)}
                        onPointerDown={(event) => startResize(event, "corner")}
                        aria-hidden="true"
                    />
                </aside>
            ) : null}
        </>
    );
}
