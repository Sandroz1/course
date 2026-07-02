import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Button } from "../../../components/shared/ActionButton/ActionButton";
import { CodeEditor } from "../../../components/shared/CodeEditor";
import { StatusBadge } from "../../../components/shared/LearningUi/LearningUi";
import { useAuth } from "../../../context/AuthContext";
import type { Task, TaskFile } from "../../../data/tasks";
import {
  getCheckerAttempts,
  getCheckerErrorKind,
  saveCheckerDraft,
} from "../../../lib/checkerApi";
import type { CheckerAvailability } from "../../../types/api";
import styles from "./TaskCodeWorkspace.module.scss";

const DEFAULT_CPP_STARTER = `#include <iostream>

using namespace std;

int main() {
    // TODO: напишите решение здесь
    return 0;
}
`;

const DRAFT_STORAGE_PREFIX = "uchicode:task-draft:v2";

type DraftSaveState = "idle" | "editing" | "saving" | "saved" | "save_error";
type CopyState = "idle" | "copied" | "copy_error";

type StoredTaskDraft = {
  files?: Record<string, string>;
  updatedAt?: string;
};

type TaskCodeWorkspaceProps = {
  checkerAvailability: CheckerAvailability | null;
  isCheckerAvailabilityLoading: boolean;
  isCheckerConfigured: boolean;
  task: Task;
};

function getStorageKey(taskId: string) {
  return `${DRAFT_STORAGE_PREFIX}:${taskId}`;
}

function getDisplayFileName(fileName: string) {
  return fileName.split("/").pop() ?? fileName;
}

function getInitialSource(file: TaskFile) {
  return file.starterCode.trim() ? file.starterCode : DEFAULT_CPP_STARTER;
}

function getStarterSources(files: TaskFile[]) {
  return files.map(getInitialSource);
}

function readStoredDraft(task: Task) {
  const starterSources = getStarterSources(task.files);

  if (typeof window === "undefined") {
    return { restored: false, sources: starterSources };
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(task.id));
    if (!rawValue) return { restored: false, sources: starterSources };

    const parsed = JSON.parse(rawValue) as StoredTaskDraft;
    const storedFiles = parsed.files;

    if (!storedFiles || typeof storedFiles !== "object") {
      return { restored: false, sources: starterSources };
    }

    let restored = false;
    const sources = task.files.map((file, index) => {
      const storedSource = storedFiles[file.fileName];

      if (typeof storedSource === "string") {
        restored = true;
        return storedSource;
      }

      return starterSources[index];
    });

    return { restored, sources };
  } catch {
    return { restored: false, sources: starterSources };
  }
}

function persistDraft(task: Task, sources: string[]) {
  if (typeof window === "undefined") return false;

  try {
    const files = Object.fromEntries(
      task.files.map((file, index) => [file.fileName, sources[index] ?? ""]),
    );

    window.localStorage.setItem(
      getStorageKey(task.id),
      JSON.stringify({
        files,
        updatedAt: new Date().toISOString(),
      } satisfies StoredTaskDraft),
    );
    return true;
  } catch {
    return false;
  }
}

function clearStoredDraft(taskId: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(getStorageKey(taskId));
  } catch {
    // Ignore storage cleanup errors: the editor state is already reset in memory.
  }
}

function renderTaskInline(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }

    return part;
  });
}

function getNextFileIndex(currentIndex: number, key: string, fileCount: number) {
  if (key === "Home") return 0;
  if (key === "End") return fileCount - 1;
  if (key === "ArrowLeft" || key === "ArrowUp") {
    return (currentIndex - 1 + fileCount) % fileCount;
  }
  if (key === "ArrowRight" || key === "ArrowDown") {
    return (currentIndex + 1) % fileCount;
  }

  return currentIndex;
}

function getCheckerStatusLabel({
  availability,
  isLoading,
}: {
  availability: CheckerAvailability | null;
  isLoading: boolean;
}) {
  if (isLoading) return "Проверяем статус";
  if (!availability) return "Черновик локально";
  if (availability.available) return "Черновик доступен";
  return "Без автопроверки";
}

function getCheckerNotice({
  availability,
  isLoading,
}: {
  availability: CheckerAvailability | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return "Проверяем статус автопроверки. Редактор уже доступен, код можно писать сразу.";
  }

  if (!availability) {
    return "Автопроверка не подключена для этой задачи или backend временно недоступен. Редактор сохраняет черновик в этом браузере.";
  }

  if (availability.available) {
    return "Данные задачи для будущей автопроверки найдены. Запуск кода в интерфейсе пока не включён.";
  }

  if (availability.reason === "runner_unavailable") {
    return "Автопроверка пока недоступна: runner не подключён. Это не мешает писать код и сохранять черновик.";
  }

  if (availability.reason === "temporarily_disabled") {
    return "Автопроверка временно отключена. Черновик можно редактировать и сохранить локально.";
  }

  return "Эта задача пока не подключена к автопроверке. Редактор работает как локальный черновик.";
}

function getSaveErrorMessage(error: unknown) {
  const kind = getCheckerErrorKind(error);

  if (kind === "auth_required") return "Локальный черновик сохранён, но для синхронизации с аккаунтом нужно войти снова.";
  if (kind === "stale_version") {
    return "Локальный черновик сохранён, но версия задачи изменилась. Обновите страницу перед синхронизацией с аккаунтом.";
  }
  if (kind === "source_too_large") return "Черновик сохранён локально, но превышает лимит backend-сохранения.";
  if (kind === "checker_unavailable") {
    return "Черновик сохранён локально. Backend-автопроверка сейчас недоступна.";
  }
  return "Черновик сохранён локально, но синхронизация с backend не прошла.";
}

function findCurrentAttempt(
  attempts: Awaited<ReturnType<typeof getCheckerAttempts>>["results"],
  taskVersion: number,
) {
  return attempts.find(
    (attempt) => attempt.task_version === taskVersion && attempt.status !== "archived",
  );
}

function copySelectedTextarea(textarea: HTMLTextAreaElement) {
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  }
}

async function copyText(value: string, sourceTextarea?: HTMLTextAreaElement | null) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (sourceTextarea && copySelectedTextarea(sourceTextarea)) {
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.inset = "-9999px";
  document.body.append(textarea);

  try {
    const didCopy = copySelectedTextarea(textarea);
    if (!didCopy) throw new Error("copy failed");
  } finally {
    textarea.remove();
  }
}

export function TaskCodeWorkspace({
  checkerAvailability,
  isCheckerAvailabilityLoading,
  isCheckerConfigured,
  task,
}: TaskCodeWorkspaceProps) {
  const { isAuthenticated } = useAuth();
  const hasUserEditedRef = useRef(false);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [draftSources, setDraftSources] = useState(() => getStarterSources(task.files));
  const [draftState, setDraftState] = useState<DraftSaveState>("idle");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const hasMultipleFiles = task.files.length > 1;
  const activeFile = task.files[activeFileIndex] ?? task.files[0];
  const activeSource = draftSources[activeFileIndex] ?? getInitialSource(activeFile);
  const activeFileTabId = `task-file-tab-${task.id}-${activeFileIndex}`;
  const activeFilePanelId = `task-file-panel-${task.id}-${activeFileIndex}`;
  const activeEditorId = `task-code-${task.id}-${activeFileIndex}`;
  const checkerNotice = getCheckerNotice({
    availability: checkerAvailability,
    isLoading: isCheckerAvailabilityLoading,
  });
  const canSyncBackendDraft =
    isAuthenticated &&
    isCheckerConfigured &&
    typeof checkerAvailability?.task_version === "number" &&
    task.files.length === 1;
  const sourceLimitBytes =
    canSyncBackendDraft ? checkerAvailability?.limits?.source_bytes : undefined;

  useEffect(() => {
    const { restored, sources } = readStoredDraft(task);
    const taskVersion = checkerAvailability?.task_version;

    hasUserEditedRef.current = false;
    setActiveFileIndex(0);
    setDraftSources(sources);
    setDraftState(restored ? "saved" : "idle");
    setCopyState("idle");
    setStatusMessage(
      restored
        ? "Восстановлен локальный черновик из этого браузера."
        : "Заготовка загружена. Изменения будут сохраняться в этом браузере.",
    );

    if (
      restored ||
      !isAuthenticated ||
      task.files.length !== 1 ||
      typeof taskVersion !== "number"
    ) {
      return undefined;
    }

    const controller = new AbortController();

    getCheckerAttempts(task.id, controller.signal)
      .then((page) => {
        if (controller.signal.aborted || hasUserEditedRef.current) return;

        const currentAttempt = findCurrentAttempt(page.results, taskVersion);
        if (!currentAttempt) return;

        const nextSources = [currentAttempt.code_snapshot];
        setDraftSources(nextSources);
        persistDraft(task, nextSources);
        setDraftState("saved");
        setStatusMessage("Восстановлен черновик из аккаунта.");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });

    return () => controller.abort();
  }, [checkerAvailability?.task_version, isAuthenticated, task]);

  function handleFileTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const nextIndex = getNextFileIndex(index, event.key, task.files.length);

    if (nextIndex === index) return;

    event.preventDefault();
    setActiveFileIndex(nextIndex);
  }

  function handleSourceChange(value: string) {
    hasUserEditedRef.current = true;
    const nextSources = [...draftSources];
    nextSources[activeFileIndex] = value;
    setDraftSources(nextSources);
    setCopyState("idle");

    if (persistDraft(task, nextSources)) {
      setDraftState("editing");
      setStatusMessage("Изменения автосохранены в этом браузере.");
      return;
    }

    setDraftState("save_error");
    setStatusMessage("Не удалось сохранить черновик в этом браузере. Скопируйте код перед уходом со страницы.");
  }

  async function handleSaveDraft() {
    if (draftState === "saving") return;

    setDraftState("saving");
    setStatusMessage("Сохраняем черновик...");

    if (!persistDraft(task, draftSources)) {
      setDraftState("save_error");
      setStatusMessage("Не удалось сохранить черновик в этом браузере. Скопируйте код перед уходом со страницы.");
      return;
    }

    if (!canSyncBackendDraft || !checkerAvailability?.task_version) {
      setDraftState("saved");
      setStatusMessage(
        !isAuthenticated
          ? "Черновик сохранён в этом браузере. Войдите в аккаунт, чтобы позже синхронизировать поддерживаемые задачи."
          : "Черновик сохранён в этом браузере. Backend-сохранение появится после подключения задачи к автопроверке.",
      );
      return;
    }

    try {
      const savedAttempt = await saveCheckerDraft(task.id, {
        task_version: checkerAvailability.task_version,
        source_code: activeSource,
      });
      const nextSources = [...draftSources];
      nextSources[0] = savedAttempt.code_snapshot;
      setDraftSources(nextSources);
      persistDraft(task, nextSources);
      setDraftState("saved");
      setStatusMessage("Черновик сохранён локально и синхронизирован с аккаунтом.");
    } catch (error) {
      setDraftState("save_error");
      setStatusMessage(getSaveErrorMessage(error));
    }
  }

  function handleResetDraft() {
    const starterSources = getStarterSources(task.files);
    setDraftSources(starterSources);
    clearStoredDraft(task.id);
    setDraftState("idle");
    setCopyState("idle");
    setStatusMessage("Заготовка восстановлена. Предыдущий локальный черновик удалён.");
  }

  async function handleCopyCurrentCode() {
    try {
      await copyText(
        activeSource,
        document.getElementById(activeEditorId) as HTMLTextAreaElement | null,
      );
      setCopyState("copied");
      setStatusMessage("Текущий файл скопирован.");
    } catch {
      setCopyState("copy_error");
      setStatusMessage("Не удалось скопировать код автоматически. Выделите текст в редакторе вручную.");
    }
  }

  return (
    <section className={styles.panel} aria-labelledby={`task-workspace-title-${task.id}`}>
      <div className={styles.header}>
        <div>
          <h2 id={`task-workspace-title-${task.id}`}>Рабочий код</h2>
          <p>
            Пишите решение прямо на странице. Это черновик: код не запускается и не отправляется на проверку,
            пока runner/Piston integration не будет включена отдельно.
          </p>
        </div>
        <StatusBadge tone={checkerAvailability?.available ? "info" : "warning"}>
          {getCheckerStatusLabel({
            availability: checkerAvailability,
            isLoading: isCheckerAvailabilityLoading,
          })}
        </StatusBadge>
      </div>

      <p className={styles.checkerNotice}>{checkerNotice}</p>

      {hasMultipleFiles && (
        <div className={styles.fileList} role="tablist" aria-label="Файлы задачи">
          {task.files.map((file, index) => (
            <button
              key={file.fileName}
              id={`task-file-tab-${task.id}-${index}`}
              className={index === activeFileIndex ? styles.fileTabActive : styles.fileTab}
              type="button"
              role="tab"
              aria-selected={index === activeFileIndex}
              aria-controls={`task-file-panel-${task.id}-${index}`}
              tabIndex={index === activeFileIndex ? 0 : -1}
              onClick={() => setActiveFileIndex(index)}
              onKeyDown={(event) => handleFileTabKeyDown(event, index)}
            >
              {getDisplayFileName(file.fileName)}
            </button>
          ))}
        </div>
      )}

      <div
        className={styles.filePanel}
        id={activeFilePanelId}
        role={hasMultipleFiles ? "tabpanel" : undefined}
        aria-labelledby={hasMultipleFiles ? activeFileTabId : undefined}
      >
        <div className={styles.filePanelHeader}>
          <div>
            <span>Текущий файл</span>
            <strong>{getDisplayFileName(activeFile.fileName)}</strong>
          </div>
          {hasMultipleFiles && <span>{activeFileIndex + 1} из {task.files.length}</span>}
        </div>

        {activeFile.description && (
          <p className={styles.fileDescription}>{renderTaskInline(activeFile.description)}</p>
        )}

        <CodeEditor
          id={activeEditorId}
          label={`Код: ${getDisplayFileName(activeFile.fileName)}`}
          value={activeSource}
          disabled={draftState === "saving"}
          describedBy={`task-code-status-${task.id}`}
          helpText="Редактор сохраняет черновик локально в браузере. Tab вставляет 4 пробела."
          sourceLimitBytes={sourceLimitBytes}
          onChange={handleSourceChange}
        />
      </div>

      <div className={styles.actions}>
        <Button
          variant="primary"
          disabled={draftState === "saving"}
          onClick={() => void handleSaveDraft()}
        >
          {draftState === "saving" ? "Сохраняем..." : "Сохранить черновик"}
        </Button>
        <Button variant="secondary" disabled={draftState === "saving"} onClick={handleResetDraft}>
          Сбросить к заготовке
        </Button>
        <Button
          variant="secondary"
          disabled={draftState === "saving"}
          onClick={() => void handleCopyCurrentCode()}
        >
          {copyState === "copied" ? "Скопировано" : "Скопировать текущий код"}
        </Button>
        <p
          id={`task-code-status-${task.id}`}
          className={styles.saveStatus}
          data-state={copyState === "copy_error" ? "save_error" : draftState}
          aria-live="polite"
        >
          {statusMessage}
        </p>
      </div>
    </section>
  );
}
