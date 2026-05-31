import type { ReactNode } from "react";

import styles from "./AuthLayout.module.scss";

type AuthLayoutProps = {
  children: ReactNode;
  description: string;
  footer: ReactNode;
  title: string;
};

const accountBenefits = [
  {
    title: "Прогресс",
    text: "уроки и задачи остаются отмеченными.",
  },
  {
    title: "Разделы",
    text: "последние открытые темы доступны после входа.",
  },
  {
    title: "Профиль",
    text: "настройки хранятся в аккаунте.",
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

      <aside className={styles.context} aria-label="Что сохраняется в аккаунте">
        <div className={styles.contextHeader}>
          <h2 className={styles.contextTitle}>Продолжайте с любого устройства</h2>
          <p className={styles.contextText}>
            Аккаунт сохраняет прогресс и возвращает к последним разделам.
          </p>
        </div>

        <ul className={styles.benefits}>
          {accountBenefits.map((item, index) => (
            <li className={styles.benefit} key={item.title}>
              <span className={styles.benefitMark} aria-hidden="true">
                {index + 1}
              </span>
              <span className={styles.benefitBody}>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className={styles.contextNote}>
          Материалы можно смотреть без аккаунта, но прогресс не сохранится.
        </p>
      </aside>
    </article>
  );
}
