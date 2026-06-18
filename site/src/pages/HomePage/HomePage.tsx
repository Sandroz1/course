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
    title: "Открыть",
    text: "базу C++",
  },
  {
    title: "Понять",
    text: "одну тему",
  },
  {
    title: "Повторить",
    text: "пример",
  },
  {
    title: "Проверить",
    text: "ошибку",
  },
  {
    title: "Решить",
    text: "задачу",
  },
];

const firstLessonItems = [
  {
    title: "Короткое объяснение",
    text: "Сначала показано, зачем нужна тема и где она встречается в коде.",
  },
  {
    title: "Маленький пример",
    text: "Код можно набрать руками и сразу увидеть, что должна сделать программа.",
  },
  {
    title: "Понятный результат",
    text: "В задаче заранее написано, какой вывод или поведение нужно получить.",
  },
];

const nextRoutes = [
  {
    title: "База C++",
    text: "Если переменные, вывод и условия ещё не стали привычными.",
    action: "Начать базу",
    href: appRoutes.baseCppCourse,
  },
  {
    title: "ООП C++",
    text: "Темы про классы и объекты после базового синтаксиса.",
    action: "Открыть ООП C++",
    href: appRoutes.oopCppCourse,
  },
  {
    title: "Задачи",
    text: "Если тема уже понятна и нужен конкретный файл для практики.",
    action: "Открыть задачи",
    href: appRoutes.tasks,
  },
];

export function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
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
          <span className={styles.authSlot}>
            {isLoading ? (
              <span className={styles.authPlaceholder} aria-hidden="true" />
            ) : (
              <a
                className={styles.loginLink}
                href={toPath(isAuthenticated ? appRoutes.profile : appRoutes.login)}
              >
                {isAuthenticated ? "Профиль" : "Войти"}
              </a>
            )}
          </span>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Учебник с практикой</p>
            <h1 id="home-title">Начни C++ с понятного первого шага</h1>
            <p className={styles.lead}>
              Uchicode даёт короткие темы и задачи с понятным результатом.
              Если ты только начинаешь, открой базу C++ и двигайся по порядку.
            </p>
            <div className={styles.heroActions}>
              <LinkButton href={toPath(appRoutes.baseCppCourse)} variant="primary">
                Начать с базы C++
              </LinkButton>
              <a className={styles.secondaryLink} href={toPath(appRoutes.tasks)}>
                Открыть каталог задач
              </a>
            </div>
          </div>

          <section className={styles.mapCard} aria-labelledby="route-map-title">
            <div className={styles.mapHeader}>
              <p className={styles.eyebrow}>Карта первого маршрута</p>
              <h2 id="route-map-title">Пять шагов до первой задачи</h2>
              <p>Карта показывает порядок, чтобы не выбирать тему вслепую.</p>
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
              <span>Шаг 1</span>
              <h3>Открой базу C++</h3>
              <p>Начни с темы про минимальную программу: там видно, какой файл открыть и что запустить.</p>
            </article>
          </section>
        </section>

        <section className={styles.section} aria-labelledby="first-lesson-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Формат урока</p>
            <h2 id="first-lesson-title">Внутри темы нет лишних блоков</h2>
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
            <h2 id="next-title">Куда перейти после главной</h2>
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
            Доступно сейчас: <strong>{readySections} тем</strong> и{" "}
            <strong>{availableTasks} задач</strong>. Новые темы добавляются по порядку.
          </p>
        </section>
      </main>
    </div>
  );
}
