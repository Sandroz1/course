import { classNames } from "../shared/lib/classNames";
import styles from "./GuidePage.module.scss";

const guideSections = [
  {
    number: "01",
    title: "Тема",
    summary: "Сначала разбери идею и новый синтаксис без спешки.",
    items: [
      "Прочитай пример и разбор.",
      "Отметь новый синтаксис.",
      "Ответь на мини-проверку.",
    ],
  },
  {
    number: "02",
    title: "Практика",
    summary: "После теории сразу закрепи тему в задаче.",
    items: ["Открой задачу.", "Создай нужные файлы.", "Проверяй код маленькими шагами."],
  },
  {
    number: "03",
    title: "Ошибка компиляции",
    summary: "Ошибки исправляй последовательно, начиная с первой.",
    items: [
      "Читай первое сообщение сверху.",
      "Проверь `;`, скобки, `#include`, имена.",
      "Исправляй одну проблему за раз.",
    ],
  },
  {
    number: "04",
    title: "Готово",
    summary: "Перед переходом дальше проверь решение по трём признакам.",
    items: [
      "Код компилируется.",
      "Все пункты условия выполнены.",
      "Решение можно объяснить.",
    ],
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
    <article className={classNames("reading-page", styles.root)}>
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <p className="eyebrow">Методика</p>
          <h1>Как учиться</h1>
          <p className="lead">
            Короткий порядок работы с темой и задачей: сначала понять пример, потом закрепить
            практикой и спокойно разобрать ошибки.
          </p>
        </div>
        <div className={styles.flowPanel} aria-label="Порядок обучения">
          <span>Рабочий цикл</span>
          <strong>Тема, практика, ошибка, проверка</strong>
        </div>
      </header>

      <ol className={styles.steps}>
        {guideSections.map((section) => (
          <li className={styles.stepCard} key={section.title}>
            <div className={styles.stepHeader}>
              <span className={styles.stepNumber} aria-hidden="true">
                {section.number}
              </span>
              <div>
                <h2>{section.title}</h2>
                <p>{section.summary}</p>
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
        <span>Короткая проверка</span>
        <h2>Перед тем как идти дальше</h2>
        <p>
          Если код компилируется, все пункты условия выполнены и решение можно объяснить своими
          словами, переходи к следующей теме.
        </p>
      </section>
    </article>
  );
}
