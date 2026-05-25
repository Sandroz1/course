import clsx from "clsx";
import styles from "./GuidePage.module.scss";

const steps = [
  {
    number: "01",
    title: "Прочитай условие",
    description: "Сначала отдели входные данные от результата.",
    items: [
      "Запиши, что пользователь вводит.",
      "Запиши, что программа должна вывести или изменить.",
      "Отметь файлы, которые нужно открыть или создать.",
    ],
  },
  {
    number: "02",
    title: "Собери каркас",
    description: "Сначала получи минимальный код, который собирается.",
    items: [
      "Оставь только нужные `#include`, `main` и место для решения.",
      "Если задача про класс, сначала свяжи `.hpp`, `.cpp` и `main.cpp`.",
      "Запусти сборку до основной логики.",
    ],
  },
  {
    number: "03",
    title: "Пиши маленькими шагами",
    description: "Каждый шаг должен быть проверяемым.",
    items: [
      "Добавь одно поле, метод, условие или вывод.",
      "Собери проект после изменения.",
      "Не копи несколько новых ошибок перед запуском.",
    ],
  },
  {
    number: "04",
    title: "Разбирай ошибки сверху",
    description: "Первая ошибка компилятора часто вызывает остальные.",
    items: [
      "Читай первое сообщение сверху.",
      "Проверь `;`, скобки, `#include` и имена.",
      "Исправь одну причину и снова собери.",
    ],
  },
  {
    number: "05",
    title: "Используй подсказки вовремя",
    description: "Открывай подсказку после своей попытки.",
    items: [
      "Сначала запиши свой план в двух-трёх строках.",
      "Если застрял, открой подсказку к задаче.",
      "После подсказки снова попробуй написать код сам.",
    ],
  },
  {
    number: "06",
    title: "Отмечай готовое после проверки",
    description: "Статус меняй только после проверки условия.",
    items: [
      "Прогони простой сценарий вручную.",
      "Сверь результат с каждым пунктом условия.",
      "Только после этого отмечай задачу выполненной.",
    ],
  },
];

const stuckTips = [
  {
    title: "Не знаешь, с чего начать",
    text: "Выпиши три строки: вход, действие, результат.",
  },
  {
    title: "Сборка не проходит",
    text: "Исправляй первое сообщение компилятора сверху. После каждого исправления запускай сборку снова.",
  },
  {
    title: "Решение стало слишком большим",
    text: "Оставь только текущий шаг: ввод, расчёт или вывод. Остальное добавляй после проверки.",
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
            Короткий порядок работы с задачей: понять условие, собрать минимальный
            вариант, писать по одному шагу и проверять результат.
          </p>
        </div>
        <div className={styles.flowPanel} aria-label="Короткий порядок работы">
          <span>Коротко</span>
          <strong>Условие, каркас, маленький шаг, проверка.</strong>
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
                  <p>{renderText(item)}</p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <section className={styles.summaryPanel}>
        <span>Если застрял</span>
        <h2>Проверь конкретную причину</h2>
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
