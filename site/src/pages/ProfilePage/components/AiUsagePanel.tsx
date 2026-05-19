import clsx from "clsx";
import { formatAiUsage } from "../../../lib/aiUsage";
import type { AiUsage } from "../../../types/api";
import styles from "../ProfilePage.module.scss";

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function getAiUsagePercent(usage: AiUsage) {
  const limit = Number.isFinite(usage.limit) && usage.limit > 0 ? usage.limit : 0;
  if (!limit) return 0;

  const remaining = Number.isFinite(usage.remaining) ? Math.min(Math.max(usage.remaining, 0), limit) : 0;
  return clampPercent((remaining / limit) * 100);
}

export function AiUsagePanel({
  usage,
  isPhoneVerified,
  statusText,
}: {
  usage: AiUsage;
  isPhoneVerified: boolean;
  statusText: string;
}) {
  const displayedUsage = isPhoneVerified ? usage : { ...usage, remaining: 0 };
  const usagePercent = getAiUsagePercent(displayedUsage);

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>AI-лимит</h2>
      <div
        className={clsx(
          styles.aiStatus,
          isPhoneVerified ? styles.aiStatusAvailable : styles.aiStatusBlocked,
        )}
      >
        <strong>{isPhoneVerified ? "Доступен" : "Недоступен"}</strong>
        <span>{statusText}</span>
      </div>
      <div className={styles.aiLimit}>
        <span>{formatAiUsage(displayedUsage)}</span>
        <div aria-hidden="true">
          <span
            style={{
              width: `${usagePercent}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}
