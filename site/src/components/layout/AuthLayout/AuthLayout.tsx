import type { ReactNode } from "react";

import styles from "./AuthLayout.module.scss";

type AuthLayoutProps = {
  children: ReactNode;
  description: string;
  footer: ReactNode;
  title: string;
};

const savedItems = [
  "прогресс по урокам и задачам",
  "последние открытые разделы",
  "настройки профиля",
];

export function AuthLayout({ children, description, footer, title }: AuthLayoutProps) {
  return (
    <article className={styles.root}>
      <section className={styles.card}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Аккаунт</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </header>

        {children}

        <p className={styles.footer}>{footer}</p>
      </section>

      <aside className={styles.context} aria-label="Что сохраняется в аккаунте">
        <h2 className={styles.contextTitle}>Что сохраняется</h2>
        <ul className={styles.benefits}>
          {savedItems.map((item) => (
            <li className={styles.benefit} key={item}>
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </article>
  );
}
