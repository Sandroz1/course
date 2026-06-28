import { useEffect, useState } from "react";
import { appRoutes } from "../../../app/routes";
import { Button, LinkButton } from "../../../components/shared/ActionButton/ActionButton";
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

type DraftLoadState = "loading" | "ready" | "error";
type DraftSaveState = "idle" | "editing" | "saving" | "saved" | "save_error";

type CheckerDraftPanelProps = {
  availability: CheckerAvailability;
  starterCode: string;
  taskId: string;
};

function getSaveErrorMessage(error: unknown) {
  const kind = getCheckerErrorKind(error);

  if (kind === "auth_required") return "Войдите снова, чтобы сохранить черновик.";
  if (kind === "stale_version") return "Версия задачи изменилась. Обновите страницу перед сохранением.";
  if (kind === "source_too_large") return "Черновик превышает допустимый размер.";
  if (kind === "checker_unavailable") return "Сохранение временно недоступно. Код остался в редакторе.";
  return "Не удалось сохранить черновик. Код остался в редакторе.";
}

function findCurrentAttempt(attempts: CheckerAttempt[], taskVersion: number) {
  return attempts.find(
    (attempt) => attempt.task_version === taskVersion && attempt.status !== "archived",
  );
}

export function CheckerDraftPanel({ availability, starterCode, taskId }: CheckerDraftPanelProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const taskVersion = availability.task_version;
  const [sourceCode, setSourceCode] = useState(starterCode);
  const [attempt, setAttempt] = useState<CheckerAttempt | null>(null);
  const [loadState, setLoadState] = useState<DraftLoadState>("loading");
  const [saveState, setSaveState] = useState<DraftSaveState>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setSourceCode(starterCode);
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
        setAttempt(currentAttempt ?? null);
        setSourceCode(currentAttempt ? currentAttempt.code_snapshot : starterCode);
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
  }, [isAuthenticated, isAuthLoading, reloadKey, starterCode, taskId, taskVersion]);

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
      setSaveState("saved");
      setSaveMessage("Черновик сохранён.");
    } catch (error) {
      setSaveState("save_error");
      setSaveMessage(getSaveErrorMessage(error));
    }
  }

  function handleSourceChange(value: string) {
    setSourceCode(value);
    setSaveState("editing");
    setSaveMessage("Есть несохранённые изменения.");
  }

  const statusMessage =
    saveMessage ||
    (attempt
      ? "Сохранённый черновик загружен."
      : "Черновик ещё не сохранён.");

  return (
    <section className={styles.panel} aria-labelledby="checker-draft-title">
      <div className={styles.header}>
        <div>
          <h2 id="checker-draft-title">Моя попытка</h2>
          <p>Редактируйте решение здесь и сохраняйте его в своём аккаунте.</p>
        </div>
        <StatusBadge tone="muted">Автопроверка пока недоступна</StatusBadge>
      </div>

      <p className={styles.availabilityNote}>
        Черновик можно сохранить и продолжить позже. Код на этом этапе не запускается.
      </p>

      {isAuthLoading || loadState === "loading" ? (
        <p className={styles.stateMessage} aria-live="polite">
          Подготавливаем черновик...
        </p>
      ) : !isAuthenticated ? (
        <div className={styles.authNotice}>
          <p>Сохранение черновика доступно после входа.</p>
          <LinkButton href={toPath(appRoutes.login)} size="small" variant="secondary">
            Войти
          </LinkButton>
        </div>
      ) : loadState === "error" ? (
        <div className={styles.authNotice}>
          <p aria-live="polite">{saveMessage}</p>
          <Button size="small" variant="secondary" onClick={() => setReloadKey((value) => value + 1)}>
            Повторить
          </Button>
        </div>
      ) : (
        <div className={styles.editorArea}>
          <label htmlFor={`checker-draft-${taskId}`}>Код решения</label>
          <textarea
            id={`checker-draft-${taskId}`}
            className={styles.editor}
            value={sourceCode}
            spellCheck={false}
            wrap="off"
            aria-describedby={`checker-draft-status-${taskId}`}
            onChange={(event) => handleSourceChange(event.target.value)}
          />
          <div className={styles.actions}>
            <Button
              variant="primary"
              disabled={saveState === "saving"}
              onClick={() => void handleSave()}
            >
              {saveState === "saving" ? "Сохраняем..." : "Сохранить черновик"}
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
