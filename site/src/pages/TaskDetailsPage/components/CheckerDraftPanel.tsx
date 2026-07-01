import { useEffect, useState } from "react";
import { appRoutes } from "../../../app/routes";
import { Button, LinkButton } from "../../../components/shared/ActionButton/ActionButton";
import { CodeEditor } from "../../../components/shared/CodeEditor";
import { StatusBadge } from "../../../components/shared/LearningUi/LearningUi";
import { useAuth } from "../../../context/AuthContext";
import {
  getCheckerAttempts,
  getCheckerErrorKind,
  saveCheckerDraft,
} from "../../../lib/checkerApi";
import type { CheckerAttempt, CheckerAvailability } from "../../../types/api";
import { toPath } from "../../../utils/slug";
import styles from "./CheckerDraftPanel.module.scss";

const DEFAULT_CPP_STARTER = `#include <iostream>

using namespace std;

int main() {
    // Напишите решение здесь
    return 0;
}
`;

type DraftLoadState = "loading" | "ready" | "error";
type DraftSaveState = "idle" | "editing" | "saving" | "saved" | "save_error";

type CheckerDraftPanelProps = {
  availability: CheckerAvailability;
  starterCode: string;
  taskId: string;
};

function getInitialSource(starterCode: string) {
  return starterCode.trim() ? starterCode : DEFAULT_CPP_STARTER;
}

function getSaveErrorMessage(error: unknown) {
  const kind = getCheckerErrorKind(error);

  if (kind === "auth_required") return "Войдите снова, чтобы сохранить черновик.";
  if (kind === "stale_version") {
    return "Версия задачи изменилась. Обновите страницу перед сохранением.";
  }
  if (kind === "source_too_large") return "Черновик превышает допустимый размер.";
  if (kind === "checker_unavailable") {
    return "Автопроверка недоступна. Черновик остался в редакторе.";
  }
  return "Не удалось сохранить черновик. Код остался в редакторе.";
}

function getCheckerNotice(availability: CheckerAvailability) {
  if (availability.reason === "runner_unavailable") {
    return "Проверка решений готовится: runner ещё не подключён.";
  }

  if (availability.reason === "temporarily_disabled") {
    return "Проверка временно отключена. Черновик можно сохранить и вернуться позже.";
  }

  return "Проверка решения пока недоступна для этой версии задачи.";
}

function findCurrentAttempt(attempts: CheckerAttempt[], taskVersion: number) {
  return attempts.find(
    (attempt) => attempt.task_version === taskVersion && attempt.status !== "archived",
  );
}

export function CheckerDraftPanel({ availability, starterCode, taskId }: CheckerDraftPanelProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const taskVersion = availability.task_version;
  const initialSource = getInitialSource(starterCode);
  const [sourceCode, setSourceCode] = useState(initialSource);
  const [savedSourceCode, setSavedSourceCode] = useState(initialSource);
  const [attempt, setAttempt] = useState<CheckerAttempt | null>(null);
  const [loadState, setLoadState] = useState<DraftLoadState>("loading");
  const [saveState, setSaveState] = useState<DraftSaveState>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const hasUnsavedChanges = sourceCode !== savedSourceCode;

  useEffect(() => {
    setSourceCode(initialSource);
    setSavedSourceCode(initialSource);
    setAttempt(null);
    setSaveState("idle");
    setSaveMessage("");

    if (!taskVersion || isAuthLoading) {
      setLoadState("loading");
      return;
    }

    if (!isAuthenticated) {
      setLoadState("ready");
      return;
    }

    const controller = new AbortController();
    setLoadState("loading");

    getCheckerAttempts(taskId, controller.signal)
      .then((page) => {
        const currentAttempt = findCurrentAttempt(page.results, taskVersion);
        const nextSource = currentAttempt ? currentAttempt.code_snapshot : initialSource;

        setAttempt(currentAttempt ?? null);
        setSourceCode(nextSource);
        setSavedSourceCode(nextSource);
        setSaveState(currentAttempt ? "saved" : "idle");
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;

        const kind = getCheckerErrorKind(error);
        setSaveMessage(
          kind === "auth_required"
            ? "Войдите снова, чтобы загрузить черновик."
            : "Не удалось загрузить сохранённый черновик.",
        );
        setLoadState("error");
      });

    return () => controller.abort();
  }, [initialSource, isAuthenticated, isAuthLoading, reloadKey, taskId, taskVersion]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  if (!taskVersion) return null;

  async function handleSave() {
    if (!taskVersion || !isAuthenticated || loadState !== "ready" || saveState === "saving") {
      return;
    }

    setSaveState("saving");
    setSaveMessage("Сохраняем черновик...");

    try {
      const savedAttempt = await saveCheckerDraft(taskId, {
        task_version: taskVersion,
        source_code: sourceCode,
      });
      setAttempt(savedAttempt);
      setSourceCode(savedAttempt.code_snapshot);
      setSavedSourceCode(savedAttempt.code_snapshot);
      setSaveState("saved");
      setSaveMessage("Черновик сохранён.");
    } catch (error) {
      setSaveState("save_error");
      setSaveMessage(getSaveErrorMessage(error));
    }
  }

  function handleSourceChange(value: string) {
    setSourceCode(value);

    if (value === savedSourceCode) {
      setSaveState(attempt ? "saved" : "idle");
      setSaveMessage(attempt ? "Сохранённый черновик загружен." : "Черновик ещё не сохранён.");
      return;
    }

    setSaveState("editing");
    setSaveMessage("Есть несохранённые изменения.");
  }

  const canSave =
    isAuthenticated &&
    loadState === "ready" &&
    saveState !== "saving" &&
    (hasUnsavedChanges || !attempt);
  const statusMessage =
    saveMessage ||
    (attempt
      ? "Сохранённый черновик загружен."
      : isAuthenticated
        ? "Черновик ещё не сохранён."
        : "Войдите, чтобы сохранить код в аккаунте.");

  return (
    <section className={styles.panel} aria-labelledby="checker-draft-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Черновик решения</p>
          <h2 id="checker-draft-title">Моя попытка</h2>
          <p>
            Пишите решение прямо на странице задачи. Сейчас сохраняется только черновик:
            запуск и проверка кода появятся после отдельной безопасной runner-интеграции.
          </p>
        </div>
        <StatusBadge tone={availability.available ? "info" : "warning"}>
          Автопроверка недоступна
        </StatusBadge>
      </div>

      <div className={styles.checkerNotice}>
        <strong>Редактор</strong>
        <span>Код можно писать здесь как обычный C++ файл main.cpp.</span>
        <strong>Сохранение</strong>
        <span>
          {isAuthenticated
            ? "Черновик сохраняется в аккаунте для текущей версии задачи."
            : "Чтобы сохранить черновик между устройствами и сессиями, войдите в аккаунт."}
        </span>
        <strong>Проверка</strong>
        <span>{getCheckerNotice(availability)}</span>
      </div>

      {isAuthLoading || loadState === "loading" ? (
        <p className={styles.stateMessage} aria-live="polite">
          Подготавливаем редактор...
        </p>
      ) : loadState === "error" ? (
        <div className={styles.authNotice}>
          <p aria-live="polite">{saveMessage}</p>
          <Button size="small" variant="secondary" onClick={() => setReloadKey((value) => value + 1)}>
            Повторить
          </Button>
        </div>
      ) : (
        <div className={styles.editorArea}>
          <CodeEditor
            id={`checker-draft-${taskId}`}
            label="Код решения"
            value={sourceCode}
            disabled={saveState === "saving"}
            describedBy={`checker-draft-status-${taskId}`}
            helpText="Редактор не запускает код. Используйте его как черновик для одного файла C++."
            sourceLimitBytes={availability.limits?.source_bytes}
            onChange={handleSourceChange}
          />

          <div className={styles.actions}>
            {isAuthenticated ? (
              <Button
                variant="primary"
                disabled={!canSave}
                onClick={() => void handleSave()}
              >
                {saveState === "saving" ? "Сохраняем..." : "Сохранить черновик"}
              </Button>
            ) : (
              <LinkButton href={toPath(appRoutes.login)} variant="primary">
                Войти, чтобы сохранить
              </LinkButton>
            )}
            <Button
              variant="secondary"
              disabled
              title="Автопроверка будет подключена после отдельной runner-интеграции."
            >
              Проверить решение
            </Button>
            <p
              id={`checker-draft-status-${taskId}`}
              className={styles.saveStatus}
              data-state={saveState}
              aria-live="polite"
            >
              {statusMessage}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
