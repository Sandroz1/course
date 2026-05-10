import {
    FormEvent,
    type PointerEvent as ReactPointerEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import { isApiConfigured } from "../lib/api";
import { sendAiChat } from "../lib/aiApi";
import type { AiChatMessage } from "../types/api";

type ResizeDirection = "left" | "top" | "corner";

const MIN_PANEL_WIDTH = 340;
const MAX_PANEL_WIDTH = 760;
const MIN_PANEL_HEIGHT = 420;
const MAX_PANEL_HEIGHT_CAP = 820;
const STORAGE_KEY_PANEL_SIZE = "aiPanelSize";

function readStoredPanelSize(): { width: number; height: number } {
    const fallback = { width: 430, height: 620 };
    const saved = localStorage.getItem(STORAGE_KEY_PANEL_SIZE);

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

export function AiAssistant() {
    if (!isApiConfigured()) {
        return null;
    }

    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [selectedText, setSelectedText] = useState("");
    const [selectionPopover, setSelectionPopover] =
        useState<SelectionPopover | null>(null);
    const [messages, setMessages] = useState<AiChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [showJumpToBottom, setShowJumpToBottom] = useState(false);
    const [panelSize, setPanelSize] = useState(() =>
        clampPanelSize(readStoredPanelSize())
    );

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const messagesRef = useRef<HTMLDivElement | null>(null);
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
                target.closest(".ai-selection-popover") ||
                target.closest(".ai-panel") ||
                target.closest(".ai-floating-button")
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

        const element = messagesRef.current;

        if (!element) {
            return;
        }

        if (shouldStickToBottomRef.current) {
            window.requestAnimationFrame(() => {
                element.scrollTo({ top: element.scrollHeight, behavior: "auto" });

                if (isNearBottom(element)) {
                    setShowJumpToBottom(false);
                }
            });
        } else {
            window.requestAnimationFrame(() => {
                setShowJumpToBottom(!isNearBottom(element));
            });
        }
    }, [messages, isLoading, isOpen]);

    function handleMessagesScroll() {
        const element = messagesRef.current;

        if (!element) {
            return;
        }

        shouldStickToBottomRef.current = isNearBottom(element);
        setShowJumpToBottom(!shouldStickToBottomRef.current);
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
            localStorage.setItem(
                STORAGE_KEY_PANEL_SIZE,
                JSON.stringify(panelSizeDuringResizeRef.current)
            );
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

        const userMessage: AiChatMessage = {
            role: "user",
            content: selectedText
                ? `Вопрос по выделенному тексту: ${cleanQuestion}`
                : cleanQuestion,
        };

        shouldStickToBottomRef.current = true;
        setShowJumpToBottom(false);
        setMessages((currentMessages) => [...currentMessages, userMessage]);
        setQuestion("");
        setErrorText("");
        setIsLoading(true);

        try {
            const data = await sendAiChat({
                question: cleanQuestion,
                selectedText,
                history: messages.slice(-8),
            });

            setMessages((currentMessages) => [
                ...currentMessages,
                {
                    role: "assistant",
                    content: data.answer || "Пустой ответ от модели.",
                },
            ]);
        } catch (error) {
            setErrorText(
                error instanceof Error
                    ? error.message
                    : "Не удалось получить ответ от AI"
            );
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
            {selectedText && selectionPopover && !isOpen ? (
                <button
                    className="ai-selection-popover"
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
                className="ai-floating-button"
                type="button"
                onClick={() => setIsOpen((value) => !value)}
                aria-label={isOpen ? "Закрыть помощника" : "Открыть помощника"}
            >
                {isOpen ? "×" : "AI"}
            </button>

            {isOpen ? (
                <aside
                    className="ai-panel"
                    aria-label="AI помощник"
                    style={{
                        width: `${panelSize.width}px`,
                        height: `${panelSize.height}px`,
                    }}
                >
                    <div className="ai-panel-header">
                        <div>
                            <p>AI помощник</p>
                            <h2>
                                {selectedText ? "Вопрос по выделенному" : "Помощник по C++"}
                            </h2>
                        </div>

                        <button
                            type="button"
                            className="ai-panel-close"
                            onClick={() => setIsOpen(false)}
                            aria-label="Закрыть помощника"
                        >
                            ×
                        </button>
                    </div>

                    {selectedText ? (
                        <div className="ai-selected-text">
                            <div className="ai-selected-text-top">
                                <span>Выделенный текст из темы</span>
                                <button type="button" onClick={() => setSelectedText("")}>
                                    убрать
                                </button>
                            </div>
                            <p>{selectedText}</p>
                        </div>
                    ) : null}

                    <div className="ai-messages-wrap">
                        <div
                            className="ai-messages"
                            ref={messagesRef}
                            onScroll={handleMessagesScroll}
                        >
                            {messages.length === 0 ? (
                                <div className="ai-empty">
                                    <p>
                                        Выдели фрагмент в теме → нажми «Спросить» → задай уточнение.
                                    </p>
                                    <p>
                                        Можно спросить, зачем нужен код, где ошибка или как написать
                                        проще.
                                    </p>
                                </div>
                            ) : null}

                            {messages.map((message, index) => (
                                <div
                                    className={`ai-message ai-message-${message.role}`}
                                    key={`${message.role}-${index}`}
                                >
                                    <span>{message.role === "user" ? "Ты" : "AI"}</span>
                                    <p>{message.content}</p>
                                </div>
                            ))}

                            {isLoading ? (
                                <div className="ai-message ai-message-assistant">
                                    <span>AI</span>
                                    <p>Думаю...</p>
                                </div>
                            ) : null}
                        </div>

                        {showJumpToBottom ? (
                            <button
                                type="button"
                                className="ai-jump-bottom"
                                onClick={jumpToLatestMessage}
                            >
                                К последнему сообщению
                            </button>
                        ) : null}
                    </div>

                    {errorText ? <p className="ai-error">{errorText}</p> : null}

                    <form className="ai-form" onSubmit={sendQuestion}>
                        <textarea
                            ref={textareaRef}
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            placeholder={
                                selectedText
                                    ? "Что объяснить в выделенном фрагменте?"
                                    : "Спроси что-нибудь по C++..."
                            }
                            rows={3}
                        />

                        <button type="submit" disabled={isLoading || !question.trim()}>
                            Отправить
                        </button>
                    </form>

                    <span
                        className="ai-resize-zone ai-resize-zone--left"
                        onPointerDown={(event) => startResize(event, "left")}
                        aria-hidden="true"
                    />
                    <span
                        className="ai-resize-zone ai-resize-zone--top"
                        onPointerDown={(event) => startResize(event, "top")}
                        aria-hidden="true"
                    />
                    <span
                        className="ai-resize-zone ai-resize-zone--corner"
                        onPointerDown={(event) => startResize(event, "corner")}
                        aria-hidden="true"
                    />
                </aside>
            ) : null}
        </>
    );
}
