import clsx from "clsx";
import styles from "./GuidePage.module.scss";

const steps = [
  {
    number: "01",
    title: "Разобрать тему",
    description: "Сначала пойми теорию, которая нужна для ближайшей задачи.",
    items: [
      "Найди новый синтаксис в примере.",
      "Пойми, где ввод, хранение, обработка и вывод.",
      "Ответь на мини-проверку и переходи к практике.",
    ],
  },
  {
    number: "02",
    title: "Написать задачу",
    description: "Собери рабочий минимум, затем добавляй логику частями.",
    items: [
      "Создай файлы из условия.",
      "Добейся компиляции каркаса.",
      "После каждой небольшой правки запускай программу.",
    ],
  },
  {
    number: "03",
    title: "Исправить ошибку",
    description: "Не перебирай код случайно. Работай с первым конкретным сообщением.",
    items: [
      "Читай первое сообщение сверху.",
      "Проверь `;`, скобки, `#include` и имена.",
      "Исправь одну причину и снова запусти сборку.",
    ],
  },
  {
    number: "04",
    title: "Проверить решение",
    description: "Перед переходом дальше проверь не только компиляцию.",
    items: [
      "Прогони простой сценарий вручную.",
      "Проверь ввод и крайние случаи.",
      "Сверь код с каждым пунктом условия.",
    ],
  },
];

const stuckTips = [
  {
    title: "Сборка не проходит",
    text: "Читай первое сообщение компилятора сверху. Исправь одну причину и собери снова.",
  },
  {
    title: "Работает не всегда",
    text: "Проверь пустой ввод, неверный пункт меню и крайние индексы.",
  },
  {
    title: "Сложно объяснить",
    text: "Разложи решение на шаги: ввод, данные, обработка, вывод.",
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
        <div className={styles.heroText}>
          <p className="eyebrow">Методика</p>
          <h1>Как учиться</h1>
          <p className="lead">
            Порядок работы без лишних кругов: понять пример, написать маленький шаг, запустить,
            проверить результат.
          </p>
        </div>
        <div className={styles.flowPanel} aria-label="Порядок обучения">
          <span>Главный цикл</span>
          <strong>Понял, написал, запустил, проверил</strong>
        </div>
      </header>

      <ol className={styles.steps}>
        {steps.map((section) => (
          <li className={styles.stepCard} key={section.title}>
            <div className={styles.stepHeader}>
              <span className={styles.stepNumber} aria-hidden="true">
                {section.number}
              </span>
              <div className={styles.stepText}>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>
            </div>
            <ul className={styles.actionList}>
              {section.items.map((item) => (
                <li key={item}>
                  <span aria-hidden="true" />
                  <p>{renderText(item)}</p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <section className={styles.summaryPanel}>
        <span>Если застрял</span>
        <h2>Проверяй конкретную причину</h2>
        <div className={styles.tipGrid}>
          {stuckTips.map((tip) => (
            <article key={tip.title}>
              <h3>{tip.title}</h3>
              <p>{tip.text}</p>
            </article>
          ))}
        </div>
      </section>
    </article>
  );
}
