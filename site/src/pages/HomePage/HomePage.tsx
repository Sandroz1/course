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
            <p className={clsx(styles.eyebrow, styles.heroEyebrow)}>C++ с нуля</p>
            <h1 id="home-title">Начни C++ с понятного первого шага</h1>
            <p className={styles.lead}>
              Короткое объяснение, пример, типичная ошибка и задача идут по порядку.
              Начни с базы и не трать время на поиск следующей темы.
            </p>
            <div className={styles.heroActions}>
              <LinkButton href={toPath(appRoutes.baseCppCourse)} variant="primary">
                Начать с базы C++
              </LinkButton>
              <a className={styles.secondaryLink} href={toPath(appRoutes.tasks)}>
                Открыть каталог задач
              </a>
            </div>
            <p className={styles.availabilityLine}>
              Открыто сейчас: <strong>{readySections} тем</strong> и{" "}
              <strong>{availableTasks} задач</strong>.
            </p>
          </div>

          <section className={styles.mapCard} aria-labelledby="route-map-title">
            <div className={styles.mapHeader}>
              <p className={styles.eyebrow}>Первое занятие</p>
              <h2 id="route-map-title">От темы до первой задачи</h2>
              <p>Один маршрут показывает, что открыть и что сделать дальше.</p>
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
              <div>
                <h3>Открой базу C++</h3>
                <p>Первая тема объясняет устройство минимальной программы и даёт короткое задание.</p>
              </div>
            </article>
          </section>
        </section>

        <section className={styles.lessonSection} aria-labelledby="first-lesson-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Одна тема</p>
            <h2 id="first-lesson-title">Сначала смысл, затем код</h2>
            <p>Материал разбит на короткие действия, поэтому сразу понятно, что проверить.</p>
          </div>
          <ol className={styles.lessonList}>
            {firstLessonItems.map((item, index) => (
              <li className={styles.lessonItem} key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.routesSection} aria-labelledby="next-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Выбери старт</p>
            <h2 id="next-title">Продолжи со своего уровня</h2>
            <p>База — для первого знакомства, ООП — после синтаксиса, задачи — для закрепления.</p>
          </div>
          <div className={styles.routeList}>
            {nextRoutes.map((route) => (
              <a
                className={styles.routeLink}
                href={toPath(route.href)}
                key={route.title}
                aria-label={`${route.action}: ${route.text}`}
              >
                <span className={styles.routeContent}>
                  <h3>{route.title}</h3>
                  <p>{route.text}</p>
                </span>
                <span className={styles.routeAction}>
                  {route.action}
                  <span aria-hidden="true">→</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
