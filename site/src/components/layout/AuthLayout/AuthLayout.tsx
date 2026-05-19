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
    title: "Сохраняй прогресс",
    text: "Уроки и задачи остаются в профиле.",
  },
  {
    title: "Задавай вопросы AI",
    text: "Помощник доступен после подтверждения телефона.",
  },
  {
    title: "Возвращайся к задачам",
    text: "Продолжай с того места, где остановился.",
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
          Вход нужен только для персональных функций: прогресса, профиля и AI-помощника.
        </p>
        <ul className={styles.benefits}>
          {benefits.map((benefit) => (
            <li className={styles.benefit} key={benefit.title}>
              <span className={styles.benefitMarker} aria-hidden="true" />
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
