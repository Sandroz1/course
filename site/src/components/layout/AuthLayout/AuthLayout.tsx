import type { ReactNode } from "react";

import styles from "./AuthLayout.module.scss";

type AuthLayoutProps = {
  children: ReactNode;
  description: string;
  footer: ReactNode;
  title: string;
};

const benefits = [
  {
    title: "Продолжай уроки",
    text: "Возвращайся к последнему открытому разделу.",
  },
  {
    title: "Подключай AI",
    text: "Помощник откроется после подтверждения телефона.",
  },
  {
    title: "Управляй профилем",
    text: "Телефон и сессия находятся в одном месте.",
  },
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

      <aside className={styles.context} aria-label="Возможности аккаунта">
        <p className={styles.contextEyebrow}>Аккаунт Uchicode</p>
        <h2 className={styles.contextTitle}>Один аккаунт для обучения</h2>
        <p className={styles.contextText}>
          Вход открывает личные функции без лишних настроек на каждом устройстве.
        </p>
        <ul className={styles.benefits}>
          {benefits.map((benefit) => (
            <li className={styles.benefit} key={benefit.title}>
              <span>
                <strong>{benefit.title}</strong>
                <span>{benefit.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </article>
  );
}
