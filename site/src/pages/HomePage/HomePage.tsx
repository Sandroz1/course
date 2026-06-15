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
    text: "Выбираешь первый короткий урок.",
  },
  {
    title: "Первая тема",
    text: "Понимаешь одну новую идею.",
  },
  {
    title: "Простой пример",
    text: "Повторяешь маленькую программу.",
  },
  {
    title: "Частая ошибка",
    text: "Смотришь, где обычно ломается код.",
  },
  {
    title: "Первая задача",
    text: "Проверяешь себя на практике.",
  },
];

const firstLessonItems = [
  {
    title: "Понять одну идею",
    text: "Один урок не пытается объяснить весь C++ сразу.",
  },
  {
    title: "Повторить пример",
    text: "Короткий пример показывает, что должно получиться.",
  },
  {
    title: "Проверить себя",
    text: "После темы есть задача с понятным результатом.",
  },
];

const nextRoutes = [
  {
    title: "База C++",
    text: "Начало для тех, кто ещё путается в переменных, выводе и условиях.",
    href: appRoutes.baseCppCourse,
  },
  {
    title: "ООП C++",
    text: "ООП — темы про классы и объекты, когда основы уже знакомы.",
    href: appRoutes.oopCppCourse,
  },
  {
    title: "Задачи",
    text: "Практика по темам: условие, файл, подсказки и проверка результата.",
    href: appRoutes.tasks,
  },
];

const supportItems = [
  "Короткие объяснения перед примером",
  "Частые ошибки рядом с темой",
  "Подсказки, если задача не получается",
  "Прогресс по открытым материалам",
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
              <h2 id="route-map-title">До первой задачи видно все шаги</h2>
            </div>

            <div className={styles.routeMap}>
              <svg
                className={styles.routeLine}
                viewBox="0 0 760 220"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M70 142 C180 56 285 60 372 124 S570 196 690 76" />
              </svg>
              <ol className={styles.routeSteps}>
                {routeSteps.map((step, index) => (
                  <li
                    className={clsx(index === 0 && styles.routeStepActive)}
                    key={step.title}
                  >
                    <span>{index + 1}</span>
                    <strong>{step.title}</strong>
                    <small>{step.text}</small>
                  </li>
                ))}
              </ol>
            </div>

            <p className={styles.routeHint}>
              Первый результат: программа выводит число на экран.
            </p>
          </section>
        </section>

        <section className={styles.section} aria-labelledby="first-lesson-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Первый урок</p>
            <h2 id="first-lesson-title">Что будет внутри</h2>
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
              <a className={styles.nextCard} href={toPath(route.href)} key={route.title}>
                <h3>{route.title}</h3>
                <p>{route.text}</p>
              </a>
            ))}
          </div>
        </section>

        <section className={styles.supportSection} aria-labelledby="support-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Если застрял</p>
            <h2 id="support-title">Что помогает продолжать</h2>
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
