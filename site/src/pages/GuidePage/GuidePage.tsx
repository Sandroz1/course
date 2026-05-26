import clsx from "clsx";
import styles from "./GuidePage.module.scss";

const steps = [
  {
    number: "01",
    title: "Разбери условие",
    summary: "Перед кодом пойми, какой результат нужно получить.",
    checkpoints: [
      "Что дано на входе.",
      "Что программа должна вывести, изменить или сохранить.",
      "В каких файлах нужно писать решение.",
    ],
  },
  {
    number: "02",
    title: "Собери минимальный код",
    summary: "Сначала нужен проект, который компилируется без основной логики.",
    checkpoints: [
      "Оставь нужные `#include` и `main`.",
      "Если есть класс, свяжи `.hpp`, `.cpp` и `main.cpp`.",
      "Запусти сборку до написания решения.",
    ],
  },
  {
    number: "03",
    title: "Добавь одно действие",
    summary: "Не пиши всё сразу. Один шаг проще проверить.",
    checkpoints: [
      "Добавь одно условие, поле, метод, расчёт или вывод.",
      "Сразу запусти сборку.",
      "Если появилась ошибка, сначала исправь её.",
    ],
  },
  {
    number: "04",
    title: "Проверь результат",
    summary: "Задача готова только после ручной проверки.",
    checkpoints: [
      "Прогони простой пример.",
      "Сверь результат с условием.",
      "После проверки меняй статус задачи.",
    ],
  },
];

const stuckTips = [
  {
    title: "Не понял условие",
    text: "Раздели задачу на три пункта: входные данные, действие, ожидаемый результат.",
  },
  {
    title: "Ошибка компиляции",
    text: "Исправь первое сообщение сверху. Не добавляй новый код, пока ошибка не исчезнет.",
  },
  {
    title: "Код запутался",
    text: "Вернись к последнему рабочему шагу. Проверь его отдельно, потом продолжай.",
  },
];

function renderText(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }

    return part;
  });
}

export function GuidePage() {
  return (
    <article className={clsx("reading-page", styles.root)}>
      <header className={styles.hero}>
        <p className="eyebrow">Методика</p>
        <h1>Как учиться</h1>
        <p className="lead">
          Решай задачу коротким циклом: понял условие, собрал минимальный код,
          добавил одно действие, проверил результат.
        </p>
      </header>

      <section className={styles.processPanel} aria-labelledby="guide-process-title">
        <div className={styles.sectionHeader}>
          <span>Порядок работы</span>
          <h2 id="guide-process-title">Один цикл для каждой задачи</h2>
        </div>

        <ol className={styles.processList}>
          {steps.map((step) => (
            <li className={styles.processItem} key={step.number}>
              <span className={styles.stepNumber} aria-hidden="true">
                {step.number}
              </span>

              <div className={styles.stepBody}>
                <h3>{step.title}</h3>
                <p>{step.summary}</p>

                <ul className={styles.checkList}>
                  {step.checkpoints.map((item) => (
                    <li key={item}>{renderText(item)}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.helpPanel} aria-labelledby="stuck-title">
        <div className={styles.sectionHeader}>
          <span>Если застрял</span>
          <h2 id="stuck-title">Что мешает продолжить</h2>
        </div>

        <div className={styles.tipGrid}>
          {stuckTips.map((tip) => (
            <article key={tip.title}>
              <h3>{tip.title}</h3>
              <p>{renderText(tip.text)}</p>
            </article>
          ))}
        </div>
      </section>
    </article>
  );
}