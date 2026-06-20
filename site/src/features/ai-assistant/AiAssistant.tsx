import {
    FormEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import { appRoutes } from "../../app/routes";
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
import clsx from "clsx";
import type { AiChatMessage, AiUsage } from "../../types/api";
import { toPath } from "../../utils/slug";
import { MessageContent } from "./components/MessageContent";
import { useAiPanelSize } from "./hooks/useAiPanelSize";
import { useLessonSelection } from "./hooks/useLessonSelection";
import { isNearBottom } from "./panelSize";
import { getAiAccessMessage, getAiErrorMessage } from "./utils/errors";
import styles from "./AiAssistant.module.scss";

type ChatMessage = AiChatMessage & { id: string };

function focusTextareaAtEnd(textarea: HTMLTextAreaElement | null) {
    if (!textarea || textarea.disabled) {
        return;
    }

    textarea.focus({ preventScroll: true });

    const caretPosition = textarea.value.length;
    textarea.setSelectionRange(caretPosition, caretPosition);
}

export function AiAssistant() {
    if (!isApiConfigured()) {
        return null;
    }

    return <AiAssistantPanel />;
}

function AiAssistantPanel() {
    const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [showJumpToBottom, setShowJumpToBottom] = useState(false);
    const { panelSize, startResize } = useAiPanelSize();
    const {
        selectedText,
        setSelectedText,
        selectionPopover,
        setSelectionPopover,
    } = useLessonSelection({
        isOpen,
        classNames: {
            selectionPopover: styles.selectionPopover,
            panel: styles.panel,
            floatingButton: styles.floatingButton,
        },
    });
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
    }, [setSelectionPopover]);

    useEffect(() => {
        setAiUsage(getLocalAiUsage(user?.id));

        function syncUsage() {
            setAiUsage(getLocalAiUsage(user?.id));
        }

        window.addEventListener(AI_USAGE_UPDATED_EVENT, syncUsage);

        return () => window.removeEventListener(AI_USAGE_UPDATED_EVENT, syncUsage);
    }, [user?.id]);

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
            setErrorText("API временно недоступен.");
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
                    className={clsx(
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
                    className={clsx(styles.panel, isLockedPanel && styles.panelLocked)}
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
                                <a href={toPath(appRoutes.login)}>Войти</a>
                            ) : null}
                            {isAuthenticated && !isPhoneVerified ? (
                                <a href={toPath(appRoutes.profile)}>Открыть профиль</a>
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
                                        className={clsx(
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
                                    <div className={clsx(styles.message, styles.messageAssistant)}>
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
                        className={clsx(styles.resizeZone, styles.resizeZoneLeft)}
                        onPointerDown={(event) => startResize(event, "left")}
                        aria-hidden="true"
                    />
                    <span
                        className={clsx(styles.resizeZone, styles.resizeZoneTop)}
                        onPointerDown={(event) => startResize(event, "top")}
                        aria-hidden="true"
                    />
                    <span
                        className={clsx(styles.resizeZone, styles.resizeZoneCorner)}
                        onPointerDown={(event) => startResize(event, "corner")}
                        aria-hidden="true"
                    />
                </aside>
            ) : null}
        </>
    );
}
