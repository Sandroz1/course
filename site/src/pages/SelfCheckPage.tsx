import styles from "./SelfCheckPage.module.scss";

const checklistItems = [
  "Код компилируется без ошибок.",
  "Проверен простой запуск.",
  "Все пункты условия выполнены.",
  "Ввод пользователя обработан.",
  "Индексы не выходят за границы.",
  "Решение можно объяснить.",
];

const comparisonSteps = [
  "Сравни поля, методы, проверки и порядок действий.",
  "Не требуй совпадения строк один в один.",
  "Если нашлась хорошая идея, перенеси её вручную.",
];

const helpSteps = [
  "Вернись к первому сообщению компилятора.",
  "Проверь один маленький фрагмент отдельно.",
  "После исправления снова запусти программу.",
];

const errorSignals = [
  "Программа работает только на одном вводе.",
  "Меню ломается на неверном пункте.",
  "Удаление или редактирование падает на номере элемента.",
  "Код сложно объяснить без подсказок.",
];

export function SelfCheckPage() {
  return (
    <article className={`reading-page compact-page ${styles.root}`}>
      <header className="page-header">
        <p className="eyebrow">Самопроверка</p>
        <h1>Самопроверка</h1>
        <p className="lead">Короткая проверка перед переходом к следующей задаче.</p>
      </header>

      <section className={`panel ${styles.mainPanel}`} aria-labelledby="checklist-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Чек-лист</p>
          <h2 id="checklist-title">Проверка решения</h2>
        </div>

        <ul className={styles.checkList}>
          {checklistItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="compare-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Эталон</p>
          <h2 id="compare-title">Как сравнивать с примером</h2>
        </div>

        <ol>
          {comparisonSteps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className={`callout ${styles.helpSection}`} aria-labelledby="help-title">
        <div className={styles.sectionHeader}>
          <h2 id="help-title">Если не получается</h2>
        </div>

        <ul>
          {helpSteps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="signals-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Проверить ещё раз</p>
          <h2 id="signals-title">Частые признаки ошибки</h2>
        </div>

        <ul>
          {errorSignals.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
