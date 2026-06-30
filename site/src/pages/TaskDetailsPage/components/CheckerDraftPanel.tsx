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
  if (kind === "stale_version") {
    return "Версия задачи изменилась. Обновите страницу перед сохранением.";
  }
  if (kind === "source_too_large") return "Черновик превышает допустимый размер.";
  if (kind === "checker_unavailable") {
    return "Сервис автопроверки недоступен. Черновик остался в редакторе.";
  }
  return "Не удалось сохранить черновик. Код остался в редакторе.";
}

function findCurrentAttempt(attempts: CheckerAttempt[], taskVersion: number) {
  return attempts.find(
    (attempt) => attempt.task_version === taskVersion && attempt.status !== "archived",
  );
}

function formatSourceLimit(bytes?: number) {
  if (!bytes) return "ограничен лимитом задачи";
  if (bytes < 1024) return `до ${bytes} байт`;
  return `до ${Math.floor(bytes / 1024)} КБ`;
}

export function CheckerDraftPanel({ availability, starterCode, taskId }: CheckerDraftPanelProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const taskVersion = availability.task_version;
  const sourceLimitLabel = formatSourceLimit(availability.limits?.source_bytes);
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
            : "Не удалось загрузить сохраненный черновик.",
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
      setSaveMessage("Черновик сохранен.");
    } catch (error) {
      setSaveState("save_error");
      setSaveMessage(getSaveErrorMessage(error));
    }
  }

  function handleSourceChange(value: string) {
    setSourceCode(value);
    setSaveState("editing");
    setSaveMessage("Есть несохраненные изменения.");
  }

  const statusMessage =
    saveMessage ||
    (attempt
      ? "Сохраненный черновик загружен."
      : "Черновик еще не сохранен.");

  return (
    <section className={styles.panel} aria-labelledby="checker-draft-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Черновик решения</p>
          <h2 id="checker-draft-title">Моя попытка</h2>
          <p>
            Можно написать решение и сохранить его в аккаунте. Запуск кода появится
            только после отдельной безопасной интеграции runner.
          </p>
        </div>
        <StatusBadge tone="muted">Автопроверка выключена</StatusBadge>
      </div>

      <div className={styles.checkerNotice}>
        <strong>Что доступно сейчас</strong>
        <span>Черновик решения сохраняется на сервере для этой версии задачи.</span>
        <strong>Что недоступно</strong>
        <span>Код не запускается, результаты проверки и статусы выполнения не показываются.</span>
      </div>

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
          <div className={styles.editorHeader}>
            <label htmlFor={`checker-draft-${taskId}`}>Код решения</label>
            <span>Размер {sourceLimitLabel}</span>
          </div>
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
