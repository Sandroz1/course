import clsx from "clsx";

import { appRoutes } from "../../app/routes";
import { LinkButton } from "../../components/shared/ActionButton/ActionButton";
import { BrandLogo } from "../../components/shared/BrandLogo";
import { ThemeSwitcher } from "../../components/layout/ThemeSwitcher/ThemeSwitcher";
import { useAuth } from "../../context/AuthContext";
import {
  getCourseSections,
  isCourseSectionReady,
} from "../../data/courseSections";
import { tasks } from "../../data/tasks";
import { toPath } from "../../utils/slug";
import styles from "./HomePage.module.scss";

const routeSteps = [
  {
    title: "Старт",
    text: "первый урок",
  },
  {
    title: "Тема",
    text: "одна идея",
  },
  {
    title: "Пример",
    text: "короткий код",
  },
  {
    title: "Ошибка",
    text: "рядом с темой",
  },
  {
    title: "Задача",
    text: "проверка",
  },
];

const firstLessonItems = [
  {
    title: "Сначала смысл",
    text: "Коротко разбирается одна идея без длинной лекции.",
  },
  {
    title: "Потом код",
    text: "Рядом есть пример, который можно повторить руками.",
  },
  {
    title: "Затем проверка",
    text: "После объяснения открывается задача с понятным результатом.",
  },
];

const nextRoutes = [
  {
    title: "База C++",
    text: "Начни здесь, если переменные, вывод и условия ещё путаются.",
    action: "Открыть базу",
    href: appRoutes.baseCppCourse,
  },
  {
    title: "ООП C++",
    text: "Продолжай здесь, если уже писал простые программы и переходишь к классам.",
    action: "Открыть ООП",
    href: appRoutes.oopCppCourse,
  },
  {
    title: "Задачи",
    text: "Открой практику, если тема уже понятна и нужен файл для решения.",
    action: "Перейти к задачам",
    href: appRoutes.tasks,
  },
];

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const readySections =
    getCourseSections("base-cpp").filter(isCourseSectionReady).length +
    getCourseSections("oop-cpp").filter(isCourseSectionReady).length;
  const availableTasks = tasks.filter((task) => task.status === "available").length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <BrandLogo
          className={styles.brand}
          href={toPath(appRoutes.home)}
          ariaLabel="Uchicode — главная"
        />

        <nav className={styles.nav} aria-label="Публичная навигация">
          <a href={toPath(appRoutes.courses)}>Курсы</a>
          <a href={toPath(appRoutes.tasks)}>Задачи</a>
        </nav>

        <div className={styles.headerActions}>
          <ThemeSwitcher />
          <a
            className={styles.loginLink}
            href={toPath(isAuthenticated ? appRoutes.profile : appRoutes.login)}
          >
            {isAuthenticated ? "Профиль" : "Войти"}
          </a>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Для первого шага в C++</p>
            <h1 id="home-title">C++ становится понятнее, когда есть маршрут</h1>
            <p className={styles.lead}>
              Сначала открой короткий урок: там есть объяснение, пример и задача.
              Не нужно самому искать порядок в списке тем.
            </p>
            <div className={styles.heroActions}>
              <LinkButton href={toPath(appRoutes.baseCppCourse)} variant="primary">
                Начать первый урок
              </LinkButton>
              <a className={styles.secondaryLink} href={toPath(appRoutes.tasks)}>
                Посмотреть задачи
              </a>
            </div>
          </div>

          <section className={styles.mapCard} aria-labelledby="route-map-title">
            <div className={styles.mapHeader}>
              <p className={styles.eyebrow}>Первый маршрут</p>
              <h2 id="route-map-title">Сначала понятно, что делать</h2>
              <p>Путь короткий: открыть урок, разобрать пример и закрепить его задачей.</p>
            </div>

            <div className={styles.routePath}>
              <svg
                className={styles.routeLine}
                viewBox="0 0 760 120"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M42 62 C160 18 252 18 360 62 S592 106 718 54" />
              </svg>
              <ol className={styles.routeStations}>
                {routeSteps.map((step, index) => (
                  <li
                    className={clsx(index === 0 && styles.routeStationActive)}
                    key={step.title}
                  >
                    <span>{index + 1}</span>
                    <strong>{step.title}</strong>
                    <small>{step.text}</small>
                  </li>
                ))}
              </ol>
            </div>

            <article className={styles.activeStep}>
              <span>Активный шаг</span>
              <h3>Открой короткий урок</h3>
              <p>Разбери одну идею и повтори простой пример руками.</p>
            </article>
          </section>
        </section>

        <section className={styles.section} aria-labelledby="first-lesson-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Что внутри урока</p>
            <h2 id="first-lesson-title">Смысл, код и проверка рядом</h2>
          </div>
          <div className={styles.lessonList}>
            {firstLessonItems.map((item) => (
              <article className={styles.lessonItem} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="next-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Выбери вход</p>
            <h2 id="next-title">Откуда начать сейчас</h2>
          </div>
          <div className={styles.nextGrid}>
            {nextRoutes.map((route) => (
              <a
                className={styles.nextCard}
                href={toPath(route.href)}
                key={route.title}
                aria-label={`${route.action}: ${route.text}`}
              >
                <span className={styles.nextCardContent}>
                  <h3>{route.title}</h3>
                  <p>{route.text}</p>
                </span>
                <span className={styles.nextAction}>
                  {route.action}
                  <span aria-hidden="true">→</span>
                </span>
              </a>
            ))}
          </div>
          <p className={styles.statusLine}>
            Сейчас открыто: <strong>{readySections} тем</strong> и{" "}
            <strong>{availableTasks} задач</strong>. Остальные материалы добавляются по разделам.
          </p>
        </section>
      </main>
    </div>
  );
}
