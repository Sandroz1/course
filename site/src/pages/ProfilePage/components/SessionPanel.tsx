import clsx from "clsx";
import styles from "../ProfilePage.module.scss";

export function SessionPanel({ onLogout }: { onLogout: () => void }) {
  return (
    <section className={clsx(styles.card, styles.sessionCard)}>
      <h2 className={styles.cardTitle}>Сессия</h2>
      <button className={styles.dangerButton} type="button" onClick={onLogout}>
        Выйти
      </button>
    </section>
  );
}
