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

function isInputSelection() {
    const activeElement = document.activeElement;
    const tagName = activeElement?.tagName?.toLowerCase();

    return tagName === "textarea" || tagName === "input";
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
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

    return {
        text: text.slice(0, 5000),
        position: {
            x: clamp(finalRect.left + finalRect.width / 2, 110, window.innerWidth - 110),
            y: Math.max(12, finalRect.top - 10),
        },
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
    const usageText = formatAiUsage(aiUsage);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const messagesRef = useRef<HTMLDivElement | null>(null);
    const messageRefs = useRef(new Map<string, HTMLDivElement>());
    const messageIdCounterRef = useRef(0);
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
        if (isOpen) {
            textareaRef.current?.focus();
        }
    }, [isOpen]);

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

        if (user && aiUsage.remaining <= 0) {
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
    }

    return (
        <>
            {selectedText && selectionPopover && !isOpen && canUseAi ? (
                <button
                    className={styles.selectionPopover}
                    type="button"
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
                    className={styles.panel}
                    aria-label="AI помощник"
                    style={{
                        width: `${panelSize.width}px`,
                        height: `${panelSize.height}px`,
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
                                <button type="button" onClick={() => setSelectedText("")}>
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

                    {canUseAi ? (
                        <div className={styles.usageNotice}>
                            <span>{usageText}</span>
                            {aiUsage.remaining <= 0 ? <strong>Лимит на сегодня исчерпан</strong> : null}
                        </div>
                    ) : null}

                    <div className={styles.messagesWrap}>
                        <div
                            className={styles.messages}
                            ref={messagesRef}
                            onScroll={handleMessagesScroll}
                        >
                            {messages.length === 0 ? (
                                <div className={styles.empty}>
                                    <p>
                                        Выдели фрагмент в теме → нажми «Спросить» → задай уточнение.
                                    </p>
                                    <p>
                                        Можно спросить, зачем нужен код, где ошибка или как написать
                                        проще.
                                    </p>
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

                    {errorText ? <p className={styles.error}>{errorText}</p> : null}

                    <form className={styles.form} onSubmit={sendQuestion}>
                        <textarea
                            ref={textareaRef}
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            placeholder={
                                !canUseAi
                                    ? aiAccessMessage
                                    : selectedText
                                    ? "Что объяснить в выделенном фрагменте?"
                                    : "Спроси что-нибудь по C++..."
                            }
                            rows={3}
                            disabled={!canUseAi || aiUsage.remaining <= 0 || isLoading}
                        />

                        <button type="submit" disabled={!canUseAi || aiUsage.remaining <= 0 || isLoading || !question.trim()}>
                            Отправить
                        </button>
                    </form>

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
