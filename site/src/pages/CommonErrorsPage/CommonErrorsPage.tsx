import { useMemo, useState } from "react";
import { CodeBlock } from "../../components/shared/CodeBlock/CodeBlock";
import { CollapsibleSection } from "../../components/shared/LearningUi/LearningUi";
import clsx from "clsx";
import styles from "./CommonErrorsPage.module.scss";

const errors = [
  {
    title: "Забыли точку с запятой",
    symptom: "Компилятор ругается на следующую строку, хотя пропуск стоит выше.",
    why: "В C++ большинство команд заканчивается `;`. После объявления класса или структуры `;` тоже обязателен.",
    bad: "class Student {\n};\n\nint age = 18",
    fixed: "class Student {\n};\n\nint age = 18;",
    remember: "Если ошибка указана на следующей строке, проверь строку выше.",
  },
  {
    title: "Забыли #include",
    symptom: "В сообщении есть `cout was not declared`, `vector was not declared` или похожий текст.",
    why: "Компилятору нужны заголовки, где объявлены `cout`, `cin`, `string`, `vector`, `sort` и `runtime_error`.",
    bad: "int main() {\n    cout << \"Hello\";\n}",
    fixed: "#include <iostream>\n\nusing namespace std;\n\nint main() {\n    cout << \"Hello\";\n}",
    remember: "`iostream` — ввод/вывод, `string` — строки, `vector` — список, `algorithm` — `sort`, `stdexcept` — `runtime_error`.",
  },
  {
    title: "Забыли public:",
    symptom: "Метод есть в классе, но вызов `car.print()` снаружи запрещён.",
    why: "В `class` всё закрыто по умолчанию. Если метод не поместить в `public`, его нельзя вызвать снаружи.",
    bad: "class Car {\n    void print() {}\n};\n\nCar car;\ncar.print();",
    fixed: "class Car {\npublic:\n    void print() {}\n};",
    remember: "Поля обычно private, методы для пользователя класса — public.",
  },
  {
    title: "Обращение к private полю",
    symptom: "Компилятор пишет, что поле `private` и недоступно в этом месте.",
    why: "Закрытое поле нельзя читать или менять напрямую. Внешний код должен использовать методы класса.",
    bad: "Car car;\ncar.year = 2020;",
    fixed: "class Car {\nprivate:\n    int year;\npublic:\n    void setYear(int year) { this->year = year; }\n};",
    remember: "Если поле `private`, внешний код обращается к нему через метод.",
  },
  {
    title: "Забыли ClassName:: в .cpp",
    symptom: "Метод написан в `.cpp`, но он стал обычной функцией, а не методом класса.",
    why: "При реализации метода вне класса нужно указать, какому классу он принадлежит.",
    bad: "void print() {\n    cout << material;\n}",
    fixed: "void Bed::print() {\n    cout << material;\n}",
    remember: "`Bed::print` читается как метод print класса Bed.",
  },
  {
    title: "undefined reference",
    symptom: "Компиляция прошла, но при линковке появился `undefined reference to Bed::print()` или похожий текст.",
    why: "Метод объявлен в `.hpp`, но реализация не найдена: тело не написано, имя не совпало или нужный `.cpp` не участвует в сборке.",
    bad: "g++ -std=c++17 main.cpp -o program",
    fixed: "g++ -std=c++17 main.cpp Bed.cpp -o program",
    remember: "Если метод объявлен в `.hpp`, его тело должно быть в `.cpp`, а этот файл должен участвовать в сборке.",
  },
  {
    title: "Несколько main",
    symptom: "Линковщик сообщает о повторном определении `main`.",
    why: "В одной программе может быть только одна точка входа.",
    bad: "int main() { return 0; }\nint main() { return 0; }",
    fixed: "// Компилируйте только один файл упражнения\nint main() {\n    return 0;\n}",
    remember: "Одно упражнение — один запускаемый файл или один многофайловый набор.",
  },
  {
    title: "Неправильный erase",
    symptom: "Удаляется не тот элемент или программа падает при неверном номере.",
    why: "Пользователь вводит номер с 1, а индекс vector начинается с 0.",
    bad: "cars.erase(cars.begin() + number);",
    fixed: "if (number >= 1 && number <= static_cast<int>(cars.size())) {\n    cars.erase(cars.begin() + number - 1);\n}",
    remember: "Номер пользователя минус один равен индексу.",
  },
  {
    title: "Выход за границы vector",
    symptom: "Программа падает или выводит мусор при обращении к несуществующему элементу.",
    why: "Нельзя обращаться к элементу, которого нет в `vector`.",
    bad: "cout << numbers[3];",
    fixed: "if (index >= 0 && index < static_cast<int>(numbers.size())) {\n    cout << numbers[index];\n}",
    remember: "Перед доступом по индексу проверяйте границы.",
  },
  {
    title: "cin << вместо cin >>",
    symptom: "Компилятор ругается на оператор около `cin`.",
    why: "Для ввода стрелки направлены из потока ввода в переменную.",
    bad: "cin << age;",
    fixed: "cin >> age;",
    remember: "`cin` забирает значение, поэтому `>>`.",
  },
  {
    title: "cout >> вместо cout <<",
    symptom: "Компилятор ругается на оператор около `cout`.",
    why: "Для вывода стрелки направлены в поток вывода.",
    bad: "cout >> age;",
    fixed: "cout << age;",
    remember: "`cout` отправляет значение наружу, поэтому `<<`.",
  },
  {
    title: "Забыли catch",
    symptom: "Исключение выброшено, но программа завершается аварийно вместо понятного сообщения.",
    why: "Если исключение выброшено и не поймано, программа аварийно завершится.",
    bad: "try {\n    cout << company.getIncome();\n}",
    fixed: "try {\n    cout << company.getIncome();\n} catch (const exception& error) {\n    cout << error.what();\n}",
    remember: "`try` обычно пишут вместе с `catch`, чтобы обработать ошибку.",
  },
  {
    title: "Неправильный include guard",
    symptom: "При повторном подключении заголовка появляется ошибка повторного объявления класса.",
    why: "Если забыть `#endif` или использовать одинаковые имена guard, заголовок защищён неправильно.",
    bad: "#ifndef BED_HPP\n#define BED_HPP\nclass Bed {};",
    fixed: "#ifndef BED_HPP\n#define BED_HPP\nclass Bed {};\n#endif",
    remember: "`#ifndef` открывает условие, `#endif` закрывает.",
  },
];

function getFoundLabel(count: number) {
  return `${count} ${count === 1 ? "найдена" : "найдено"}`;
}

function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, index) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={index}>{part.slice(1, -1)}</code>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function CommonErrorsPage() {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const filteredErrors = useMemo(() => {
    const value = trimmedQuery.toLowerCase();
    if (!value) return errors;
    return errors.filter((error) =>
      [error.title, error.symptom, error.why, error.bad, error.fixed, error.remember]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [trimmedQuery]);

  return (
    <article className={clsx("reading-page", "compact-page", styles.root)}>
      <header className={clsx("page-header", styles.header)}>
        <p className="eyebrow">Справочник</p>
        <h1>Частые ошибки</h1>
        <p className="lead">Короткие разборы типичных ошибок C++: причина, неверный пример и исправление.</p>
      </header>

      <section className={clsx("panel", styles.search)}>
        <div className={styles.searchField}>
          <label className={styles.field} htmlFor="common-errors-search">
            <span>Поиск</span>
            <input
              id="common-errors-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="vector, include, undefined reference"
              aria-describedby="common-errors-search-hint"
            />
          </label>
          <p className={styles.searchHint} id="common-errors-search-hint">
            Ищи по тексту ошибки, теме или фрагменту кода.
          </p>
        </div>
        <div className={styles.searchMeta}>
          <span className="count-badge" aria-live="polite">
            {getFoundLabel(filteredErrors.length)}
          </span>
          {trimmedQuery && (
            <button className={styles.clearButton} type="button" onClick={() => setQuery("")}>
              Сбросить
            </button>
          )}
        </div>
      </section>

      <div className={styles.list}>
        {filteredErrors.map((error) => (
          <CollapsibleSection
            className={styles.card}
            key={error.title}
            title={error.title}
            description={<InlineText text={error.symptom} />}
          >
            <div className={styles.cardBody}>
              <section className={styles.reason}>
                <h3>Почему так происходит</h3>
                <p>
                  <InlineText text={error.why} />
                </p>
              </section>
              <div className={styles.examplePair}>
                <section className={clsx(styles.exampleBox, styles.exampleBoxBad)}>
                  <h3>Ошибка</h3>
                  <CodeBlock code={error.bad} language="cpp" compact />
                </section>
                <section className={clsx(styles.exampleBox, styles.exampleBoxGood)}>
                  <h3>Правильно</h3>
                  <CodeBlock code={error.fixed} language="cpp" compact />
                </section>
              </div>
              <p className={styles.rememberNote}>
                <strong>Запомнить:</strong> <InlineText text={error.remember} />
              </p>
            </div>
          </CollapsibleSection>
        ))}
      </div>

      {filteredErrors.length === 0 && (
        <section className={clsx("panel", styles.emptyState)}>
          <h2>Ничего не найдено</h2>
          <p>Попробуй другое слово из сообщения компилятора или сбрось поиск.</p>
          {trimmedQuery && (
            <button className="button button--small button--ghost" type="button" onClick={() => setQuery("")}>
              Сбросить поиск
            </button>
          )}
        </section>
      )}
    </article>
  );
}
