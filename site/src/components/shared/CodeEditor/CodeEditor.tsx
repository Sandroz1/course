import { type KeyboardEvent } from "react";
import clsx from "clsx";
import styles from "./CodeEditor.module.scss";

const INDENT = "    ";

type CodeEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  describedBy?: string;
  disabled?: boolean;
  helpText?: string;
  languageLabel?: string;
  sourceLimitBytes?: number;
  className?: string;
};

function getUtf8Bytes(value: string) {
  return new TextEncoder().encode(value).length;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.ceil(bytes / 1024)} KB`;
}

function getLineCount(value: string) {
  return value.length === 0 ? 1 : value.split("\n").length;
}

function setSelectionAfterRender(textarea: HTMLTextAreaElement, start: number, end = start) {
  window.requestAnimationFrame(() => {
    textarea.setSelectionRange(start, end);
  });
}

function getRemovableIndent(value: string, selectionStart: number) {
  const lineStart = value.lastIndexOf("\n", Math.max(selectionStart - 1, 0)) + 1;
  const beforeCaret = value.slice(lineStart, selectionStart);
  return beforeCaret.match(/ {1,4}$/)?.[0] ?? "";
}

export function CodeEditor({
  id,
  label,
  value,
  onChange,
  describedBy,
  disabled = false,
  helpText,
  languageLabel = "C++17",
  sourceLimitBytes,
  className,
}: CodeEditorProps) {
  const sourceBytes = getUtf8Bytes(value);
  const isOverLimit = sourceLimitBytes !== undefined && sourceBytes > sourceLimitBytes;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab") return;

    event.preventDefault();

    const textarea = event.currentTarget;
    const { selectionStart, selectionEnd } = textarea;

    if (event.shiftKey) {
      const removableIndent = getRemovableIndent(value, selectionStart);

      if (!removableIndent) return;

      const nextValue =
        value.slice(0, selectionStart - removableIndent.length) + value.slice(selectionStart);
      const nextSelection = selectionStart - removableIndent.length;

      onChange(nextValue);
      setSelectionAfterRender(
        textarea,
        nextSelection,
        Math.max(nextSelection, selectionEnd - removableIndent.length),
      );
      return;
    }

    const nextValue = value.slice(0, selectionStart) + INDENT + value.slice(selectionEnd);
    const nextSelection = selectionStart + INDENT.length;

    onChange(nextValue);
    setSelectionAfterRender(textarea, nextSelection);
  }

  return (
    <div className={clsx(styles.root, className)}>
      <div className={styles.header}>
        <label htmlFor={id}>{label}</label>
        <span>{languageLabel}</span>
      </div>

      {helpText && <p className={styles.help}>{helpText}</p>}

      <textarea
        id={id}
        className={styles.textarea}
        value={value}
        spellCheck={false}
        wrap="off"
        disabled={disabled}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className={styles.footer}>
        <span>{getLineCount(value)} строк</span>
        <span className={clsx(isOverLimit && styles.overLimit)}>
          {formatBytes(sourceBytes)}
          {sourceLimitBytes !== undefined && ` / ${formatBytes(sourceLimitBytes)}`}
        </span>
        <span>Tab = 4 пробела</span>
      </div>
    </div>
  );
}
