const guideSections = [
  {
    title: "Тема",
    items: [
      "Прочитай пример и разбор.",
      "Отметь новый синтаксис.",
      "Ответь на мини-проверку.",
    ],
  },
  {
    title: "Практика",
    items: ["Открой задачу.", "Создай нужные файлы.", "Проверяй код маленькими шагами."],
  },
  {
    title: "Ошибка компиляции",
    items: [
      "Читай первое сообщение сверху.",
      "Проверь `;`, скобки, `#include`, имена.",
      "Исправляй одну проблему за раз.",
    ],
  },
  {
    title: "Готово",
    items: [
      "Код компилируется.",
      "Все пункты условия выполнены.",
      "Решение можно объяснить.",
    ],
  },
];

export function GuidePage() {
  return (
    <article className="reading-page compact-page guide-page">
      <header className="page-header">
        <p className="eyebrow">Методика</p>
        <h1>Как учиться</h1>
        <p className="lead">Короткий порядок работы с темой и задачей.</p>
      </header>

      <div className="guide-list">
        {guideSections.map((section) => (
          <section className="guide-section" key={section.title}>
            <h2>{section.title}</h2>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
