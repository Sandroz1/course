import {
    FormEvent,
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
import clsx from "clsx";
import type { AiChatMessage, AiUsage } from "../../types/api";
import {
    AccessNotice,
    AssistantComposer,
    AssistantMessages,
    FloatingAiButton,
    PanelHeader,
    ResizeHandles,
    SelectedTextPreview,
    SelectionPopoverButton,
    UsageLimitNotice,
    type ChatMessage,
} from "./components/AssistantPanelParts";
import { useAiPanelSize } from "./hooks/useAiPanelSize";
import { useLessonSelection } from "./hooks/useLessonSelection";
import { isNearBottom } from "./panelSize";
import { getAiAccessMessage, getAiErrorMessage } from "./utils/errors";
import styles from "./AiAssistant.module.scss";

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

    async function sendQuestion(event: FormEvent<HTMLFormElement>) {
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
            <SelectionPopoverButton
                selectedText={selectedText}
                selectionPopover={selectionPopover}
                isOpen={isOpen}
                canUseAi={canUseAi}
                onAsk={askAboutSelectedText}
            />

            <FloatingAiButton
                isOpen={isOpen}
                onToggle={() => setIsOpen((value) => !value)}
            />

            {isOpen ? (
                <aside
                    className={clsx(styles.panel, isLockedPanel && styles.panelLocked)}
                    aria-label="AI помощник"
                    style={{
                        width: `${panelSize.width}px`,
                        height: isLockedPanel ? undefined : `${panelSize.height}px`,
                    }}
                >
                    <PanelHeader
                        selectedText={selectedText}
                        isAuthenticated={isAuthenticated}
                        isPhoneVerified={isPhoneVerified}
                        usageText={usageText}
                        onClose={() => setIsOpen(false)}
                    />

                    <SelectedTextPreview
                        selectedText={selectedText}
                        onClear={clearSelectedText}
                    />

                    <AccessNotice
                        message={canUseAi ? "" : aiAccessMessage}
                        isAuthenticated={isAuthenticated}
                        isAuthLoading={isAuthLoading}
                        isPhoneVerified={isPhoneVerified}
                    />

                    <UsageLimitNotice
                        isVisible={canUseAi && isLimitReached}
                        usageText={usageText}
                    />

                    {canUseAi || messages.length > 0 ? (
                        <AssistantMessages
                            messages={messages}
                            canSendAi={canSendAi}
                            isLoading={isLoading}
                            showJumpToBottom={showJumpToBottom}
                            messagesRef={messagesRef}
                            setMessageRef={setMessageRef}
                            onScroll={handleMessagesScroll}
                            onJumpToLatest={jumpToLatestMessage}
                        />
                    ) : null}

                    {errorText ? <p className={styles.error}>{errorText}</p> : null}

                    {canUseAi ? (
                        <AssistantComposer
                            question={question}
                            selectedText={selectedText}
                            isLimitReached={isLimitReached}
                            canSendAi={canSendAi}
                            isLoading={isLoading}
                            textareaRef={textareaRef}
                            onQuestionChange={setQuestion}
                            onSubmit={sendQuestion}
                        />
                    ) : null}

                    <ResizeHandles onStartResize={startResize} />
                </aside>
            ) : null}
        </>
    );
}
