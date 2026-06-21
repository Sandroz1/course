import clsx from "clsx";
import type {
    FormEvent,
    PointerEvent as ReactPointerEvent,
    RefObject,
} from "react";

import { appRoutes } from "../../../app/routes";
import type { AiChatMessage } from "../../../types/api";
import { toPath } from "../../../utils/slug";
import styles from "../AiAssistant.module.scss";
import type { SelectionPopover } from "../utils/selection";
import { MessageContent } from "./MessageContent";

export type ChatMessage = AiChatMessage & { id: string };

type ResizeDirection = "left" | "top" | "corner";

export function SelectionPopoverButton({
    selectedText,
    selectionPopover,
    isOpen,
    canUseAi,
    onAsk,
}: {
    selectedText: string;
    selectionPopover: SelectionPopover | null;
    isOpen: boolean;
    canUseAi: boolean;
    onAsk: () => void;
}) {
    if (!selectedText || !selectionPopover || isOpen || !canUseAi) {
        return null;
    }

    return (
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
            onClick={onAsk}
        >
            Спросить у AI
        </button>
    );
}

export function FloatingAiButton({
    isOpen,
    onToggle,
}: {
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            className={styles.floatingButton}
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? "Закрыть помощника" : "Открыть помощника"}
        >
            {isOpen ? "×" : "AI"}
        </button>
    );
}

export function PanelHeader({
    selectedText,
    isAuthenticated,
    isPhoneVerified,
    usageText,
    onClose,
}: {
    selectedText: string;
    isAuthenticated: boolean;
    isPhoneVerified: boolean;
    usageText: string;
    onClose: () => void;
}) {
    return (
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
                onClick={onClose}
                aria-label="Закрыть помощника"
            >
                ×
            </button>
        </div>
    );
}

export function SelectedTextPreview({
    selectedText,
    onClear,
}: {
    selectedText: string;
    onClear: () => void;
}) {
    if (!selectedText) {
        return null;
    }

    return (
        <div className={styles.selectedText}>
            <div className={styles.selectedTextTop}>
                <span>Выделенный текст из темы</span>
                <button type="button" onClick={onClear}>
                    убрать
                </button>
            </div>
            <p>{selectedText}</p>
        </div>
    );
}

export function AccessNotice({
    message,
    isAuthenticated,
    isAuthLoading,
    isPhoneVerified,
}: {
    message: string;
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    isPhoneVerified: boolean;
}) {
    if (!message) {
        return null;
    }

    return (
        <div className={styles.accessNotice}>
            <p>{message}</p>
            {!isAuthenticated && !isAuthLoading ? (
                <a href={toPath(appRoutes.login)}>Войти</a>
            ) : null}
            {isAuthenticated && !isPhoneVerified ? (
                <a href={toPath(appRoutes.profile)}>Открыть профиль</a>
            ) : null}
        </div>
    );
}

export function UsageLimitNotice({
    isVisible,
    usageText,
}: {
    isVisible: boolean;
    usageText: string;
}) {
    if (!isVisible) {
        return null;
    }

    return (
        <div className={styles.usageNotice}>
            <span>{usageText}</span>
            <strong>Лимит на сегодня исчерпан</strong>
        </div>
    );
}

export function AssistantMessages({
    messages,
    canSendAi,
    isLoading,
    showJumpToBottom,
    messagesRef,
    setMessageRef,
    onScroll,
    onJumpToLatest,
}: {
    messages: ChatMessage[];
    canSendAi: boolean;
    isLoading: boolean;
    showJumpToBottom: boolean;
    messagesRef: RefObject<HTMLDivElement | null>;
    setMessageRef: (id: string, node: HTMLDivElement | null) => void;
    onScroll: () => void;
    onJumpToLatest: () => void;
}) {
    return (
        <div className={styles.messagesWrap}>
            <div
                className={styles.messages}
                ref={messagesRef}
                onScroll={onScroll}
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
                    onClick={onJumpToLatest}
                >
                    К последнему сообщению
                </button>
            ) : null}
        </div>
    );
}

export function AssistantComposer({
    question,
    selectedText,
    isLimitReached,
    canSendAi,
    isLoading,
    textareaRef,
    onQuestionChange,
    onSubmit,
}: {
    question: string;
    selectedText: string;
    isLimitReached: boolean;
    canSendAi: boolean;
    isLoading: boolean;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    onQuestionChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
    return (
        <form className={styles.form} onSubmit={onSubmit}>
            <textarea
                ref={textareaRef}
                value={question}
                onChange={(event) => onQuestionChange(event.target.value)}
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
    );
}

export function ResizeHandles({
    onStartResize,
}: {
    onStartResize: (
        event: ReactPointerEvent<HTMLSpanElement>,
        direction: ResizeDirection
    ) => void;
}) {
    return (
        <>
            <span
                className={clsx(styles.resizeZone, styles.resizeZoneLeft)}
                onPointerDown={(event) => onStartResize(event, "left")}
                aria-hidden="true"
            />
            <span
                className={clsx(styles.resizeZone, styles.resizeZoneTop)}
                onPointerDown={(event) => onStartResize(event, "top")}
                aria-hidden="true"
            />
            <span
                className={clsx(styles.resizeZone, styles.resizeZoneCorner)}
                onPointerDown={(event) => onStartResize(event, "corner")}
                aria-hidden="true"
            />
        </>
    );
}
