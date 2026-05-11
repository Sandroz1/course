import type { ReactNode } from "react";

import styles from "./AuthLayout.module.scss";

type AuthLayoutProps = {
  children: ReactNode;
  description: string;
  footer: ReactNode;
  title: string;
};

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
    </article>
  );
}
