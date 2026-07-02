import clsx from "clsx";
import type { ReactNode } from "react";
import { StatusBadge } from "../../../components/shared/LearningUi/LearningUi";
import type { CheckerSubmission } from "../../../types/api";
import styles from "./CheckerResultPanel.module.scss";

type StatusTone = "ready" | "success" | "warning" | "info" | "muted";

type CheckerResultPanelProps = {
  submission?: CheckerSubmission | null;
  showRuntimeOutput?: boolean;
  action?: ReactNode;
  className?: string;
};

type StatusMeta = {
  label: string;
  tone: StatusTone;
  description: string;
};

const STATUS_META = {
  queued: {
    label: "В очереди",
    tone: "info",
    description: "Решение ожидает проверки.",
  },
  compiling: {
    label: "Компиляция",
    tone: "info",
    description: "Код компилируется перед запуском тестов.",
  },
  running: {
    label: "Запуск",
    tone: "info",
    description: "Решение выполняется на тестах.",
  },
  accepted: {
    label: "Решение принято",
    tone: "success",
    description: "Все проверенные тесты пройдены.",
  },
  wrong_answer: {
    label: "Неверный ответ",
    tone: "warning",
    description: "Код запустился, но результат отличается от ожидаемого.",
  },
  compile_error: {
    label: "Ошибка компиляции",
    tone: "warning",
    description: "Компилятор не смог собрать решение.",
  },
  runtime_error: {
    label: "Ошибка выполнения",
    tone: "warning",
    description: "Программа завершилась с ошибкой во время запуска.",
  },
  time_limit: {
    label: "Превышено время",
    tone: "warning",
    description: "Программа работала дольше разрешённого лимита.",
  },
  output_limit: {
    label: "Слишком большой вывод",
    tone: "warning",
    description: "Программа вывела слишком много данных.",
  },
  internal_error: {
    label: "Ошибка проверки",
    tone: "warning",
    description: "Проверка не завершилась корректно. Попробуйте позже.",
  },
} satisfies Record<CheckerSubmission["status"], StatusMeta>;

const RUNTIME_OUTPUT_STATUSES = new Set<CheckerSubmission["status"]>([
  "wrong_answer",
  "runtime_error",
  "time_limit",
  "output_limit",
  "internal_error",
]);

const MAX_VISIBLE_OUTPUT_CHARS = 2400;

function getVisibleOutput(output: string) {
  if (output.length <= MAX_VISIBLE_OUTPUT_CHARS) {
    return { value: output, isTruncated: false };
  }

  return {
    value: `${output.slice(0, MAX_VISIBLE_OUTPUT_CHARS)}\n...`,
    isTruncated: true,
  };
}

function getTestSummary(submission: CheckerSubmission) {
  if (submission.total_tests <= 0) return "Тесты пока не отображаются.";

  return `${submission.passed_tests} из ${submission.total_tests} тестов пройдено`;
}

function formatMetric(value: number | null, suffix: string) {
  return value === null ? "нет данных" : `${value} ${suffix}`;
}

function CheckerOutputBlock({ title, output }: { title: string; output: string }) {
  const normalizedOutput = output.trimEnd();

  if (!normalizedOutput) return null;

  const { value, isTruncated } = getVisibleOutput(normalizedOutput);

  return (
    <div className={styles.outputBlock}>
      <strong>{title}</strong>
      <pre>{value}</pre>
      {isTruncated && <span>Вывод обрезан для безопасного отображения.</span>}
    </div>
  );
}

export function CheckerResultPanel({
  submission,
  showRuntimeOutput = false,
  action,
  className,
}: CheckerResultPanelProps) {
  if (!submission) return null;

  const meta = STATUS_META[submission.status];
  const compilerOutput = submission.status === "compile_error" ? submission.compiler_output : "";
  const runtimeOutput =
    showRuntimeOutput && RUNTIME_OUTPUT_STATUSES.has(submission.status)
      ? submission.runtime_output
      : "";

  return (
    <section className={clsx(styles.panel, className)} aria-labelledby={`checker-result-${submission.id}`}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Результат проверки</p>
          <h2 id={`checker-result-${submission.id}`}>{meta.label}</h2>
          <p>{meta.description}</p>
        </div>
        <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
      </div>

      <dl className={styles.metrics} aria-label="Краткая сводка проверки">
        <div>
          <dt>Тесты</dt>
          <dd>{getTestSummary(submission)}</dd>
        </div>
        <div>
          <dt>Время</dt>
          <dd>{formatMetric(submission.execution_time_ms, "мс")}</dd>
        </div>
        <div>
          <dt>Память</dt>
          <dd>{formatMetric(submission.memory_used_kb, "КБ")}</dd>
        </div>
      </dl>

      <CheckerOutputBlock title="Сообщение компилятора" output={compilerOutput} />
      <CheckerOutputBlock title="Вывод программы" output={runtimeOutput} />

      {action && <div className={styles.action}>{action}</div>}
    </section>
  );
}
