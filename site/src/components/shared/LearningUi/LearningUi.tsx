import { type ReactNode, useId, useState } from "react";
import clsx from "clsx";
import { Button } from "../ActionButton/ActionButton";
import styles from "./LearningUi.module.scss";

type StatusTone = "ready" | "success" | "warning" | "info" | "muted";

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className={styles.backLink} href={href}>
      <span aria-hidden="true" />
      {children}
    </a>
  );
}

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={clsx("status-badge", `status-badge--${tone}`, className)}>
      {children}
    </span>
  );
}

export function MetaRow({
  children,
  compact = false,
  className,
}: {
  children: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return <div className={clsx(styles.metaRow, compact && styles.metaRowCompact, className)}>{children}</div>;
}

export function MetaItem({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={clsx(styles.metaItem, className)}>
      <strong>{label}</strong>
      <span>{children}</span>
    </span>
  );
}

export function TaskActionBar({
  title,
  description,
  actionLabel,
  disabled,
  primary = false,
  message,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  disabled?: boolean;
  primary?: boolean;
  message?: string;
  onAction: () => void;
}) {
  const hasMessage = Boolean(message);

  return (
    <section className={styles.taskActionBar}>
      <div className={styles.actionText}>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <Button
        variant={primary ? "primary" : "secondary"}
        disabled={disabled}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
      <p
        className={clsx(styles.actionMessage, !hasMessage && styles.actionMessageEmpty)}
        aria-live="polite"
      >
        {message || "\u00a0"}
      </p>
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("panel", styles.emptyState, className)}>
      <div className={styles.emptyStateText}>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action && <div className={styles.emptyStateAction}>{action}</div>}
    </section>
  );
}

export function CollapsibleSection({
  title,
  description,
  countLabel,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  countLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  const contentId = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className={clsx("panel", styles.collapsible, isOpen && styles.collapsibleOpen, className)}>
      <button
        className={styles.collapsibleButton}
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className={styles.collapsibleText}>
          <strong>{title}</strong>
          {description && <small>{description}</small>}
        </span>
        {countLabel && (
          <span className={clsx("count-badge", "count-badge--compact", styles.collapsibleCount)}>
            {countLabel}
          </span>
        )}
        <span className={styles.collapsibleChevron} aria-hidden="true" />
      </button>
      <div className={styles.collapsibleContent} id={contentId} hidden={!isOpen}>
        {children}
      </div>
    </section>
  );
}
