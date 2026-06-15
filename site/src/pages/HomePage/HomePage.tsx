import clsx from "clsx";

import { appRoutes } from "../../app/routes";
import { LinkButton } from "../../components/shared/ActionButton/ActionButton";
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
    title: "Один небольшой шаг",
    text: "Урок берёт одну тему и не перегружает новыми словами.",
  },
  {
    title: "Пример рядом",
    text: "Сразу видно, что написать и какой результат ожидать.",
  },
  {
    title: "Задача после объяснения",
    text: "Проверяешь именно этот шаг, а не весь язык сразу.",
  },
];

const nextRoutes = [
  {
    title: "База C++",
    text: "Если переменные, вывод и условия ещё путаются.",
    action: "Начать базу",
    href: appRoutes.baseCppCourse,
  },
  {
    title: "ООП C++",
    text: "ООП — темы про классы и объекты после основ.",
    action: "Открыть ООП",
    href: appRoutes.oopCppCourse,
  },
  {
    title: "Задачи",
    text: "Если хочешь сразу открыть практику по темам.",
    action: "Перейти к задачам",
    href: appRoutes.tasks,
  },
];

const supportItems = [
  "Типовая ошибка объясняется рядом с темой",
  "Подсказки помогают сделать следующий шаг",
  "Прогресс показывает открытые материалы",
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
        <a className={styles.brand} href={toPath(appRoutes.home)} aria-label="Uchicode — главная">
          <img src="/brand/uchicode-icon.png" alt="" aria-hidden="true" />
          <span>
            <span>uchi</span>code.ru
          </span>
        </a>

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
              Uchicode ведёт от первого шага к задачам: короткое объяснение,
              простой пример и практика в одном месте.
            </p>
            <div className={styles.heroActions}>
              <LinkButton href={toPath(appRoutes.baseCppCourse)} variant="primary">
                Начать с нуля
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
            <p className={styles.eyebrow}>Первый урок</p>
            <h2 id="first-lesson-title">Один урок — один шаг</h2>
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
            <p className={styles.eyebrow}>Куда идти дальше</p>
            <h2 id="next-title">Выбери подходящий вход</h2>
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
        </section>

        <section className={styles.supportSection} aria-labelledby="support-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Когда не получилось</p>
            <h2 id="support-title">Помощь рядом с темой</h2>
          </div>
          <ul className={styles.supportList}>
            {supportItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <p className={styles.statusLine}>
          Сейчас открыто: <strong>{readySections} тем</strong> и{" "}
          <strong>{availableTasks} задач</strong>.
        </p>
      </main>
    </div>
  );
}
