import { useMemo, useState } from "react";
import { CodeBlock } from "../components/CodeBlock";

const errors = [
  {
    title: "Забыли точку с запятой",
    symptom: "Компилятор часто ругается на следующую строку, хотя ошибка стоит строкой выше.",
    why: "C++ завершает большинство команд символом `;`. После объявления класса или структуры точка с запятой тоже обязательна.",
    bad: "class Student {\n};\n\nint age = 18",
    fixed: "class Student {\n};\n\nint age = 18;",
    remember: "Если компилятор ругается на следующую строку, часто ошибка находится строкой выше.",
  },
  {
    title: "Забыли #include",
    symptom: "Сообщения похожи на “cout was not declared”, “vector was not declared”, “runtime_error was not declared”.",
    why: "Компилятор должен знать, где объявлены `cout`, `cin`, `string`, `vector`, `sort` и `runtime_error`.",
    bad: "int main() {\n    cout << \"Hello\";\n}",
    fixed: "#include <iostream>\n\nusing namespace std;\n\nint main() {\n    cout << \"Hello\";\n}",
    remember: "`iostream` — ввод/вывод, `string` — строки, `vector` — список, `algorithm` — sort, `stdexcept` — runtime_error.",
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
    symptom: "Компилятор пишет, что поле private и недоступно в этом месте.",
    why: "Закрытое поле нельзя читать или менять напрямую. Для этого нужны методы.",
    bad: "Car car;\ncar.year = 2020;",
    fixed: "class Car {\nprivate:\n    int year;\npublic:\n    void setYear(int year) { this->year = year; }\n};",
    remember: "Если поле private, внешний код работает через метод.",
  },
  {
    title: "Забыли ClassName:: в .cpp",
    symptom: "Метод написан в `.cpp`, но он стал обычной функцией, а не методом класса.",
    why: "При реализации метода вне класса нужно указать, какому классу он принадлежит.",
    bad: "void print() {\n    cout << material;\n}",
    fixed: "void Bed::print() {\n    cout << material;\n}",
    remember: "`Bed::print` читается как “метод print класса Bed”.",
  },
  {
    title: "undefined reference",
    symptom: "Сборка проходит компиляцию, но на этапе линковки появляется `undefined reference to Bed::print()` или похожий текст.",
    why: "Объявление метода есть в `.hpp`, но реализация не найдена: метод не написан, имя не совпало или `.cpp` файл реализации не участвует в сборке.",
    bad: "g++ -std=c++17 main.cpp -o program",
    fixed: "g++ -std=c++17 main.cpp Bed.cpp -o program",
    remember: "Если метод объявлен в `.hpp`, его тело должно быть в `.cpp`, а этот `.cpp` должен участвовать в сборке.",
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
    why: "Нельзя обращаться к элементу, которого нет.",
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
    remember: "`try` почти всегда должен идти вместе с `catch`.",
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

export function CommonErrorsPage() {
  const [query, setQuery] = useState("");
  const filteredErrors = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return errors;
    return errors.filter((error) =>
      [error.title, error.symptom, error.why, error.remember]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [query]);

  return (
    <article className="reading-page compact-page">
      <p className="eyebrow">Справочник</p>
      <h1>Частые ошибки</h1>
      <p className="lead">
        Найди похожую ошибку, сравни плохой код с исправленным и вернись к задаче.
      </p>

      <section className="panel filters-panel">
        <label className="field">
          Поиск ошибки
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Например: vector, include, catch"
          />
        </label>
      </section>

      <div className="error-list">
        {filteredErrors.map((error) => (
          <details className="panel error-card" key={error.title}>
            <summary>
              <strong>{error.title}</strong>
              <span>{error.symptom}</span>
            </summary>
            <div className="error-card__body">
              <h3>Что означает</h3>
              <p>{error.why}</p>
              <div className="example-pair">
                <section className="example-box example-box--bad">
                  <h3>Ошибка</h3>
                  <CodeBlock code={error.bad} language="cpp" />
                </section>
                <section className="example-box example-box--good">
                  <h3>Правильно</h3>
                  <CodeBlock code={error.fixed} language="cpp" />
                </section>
              </div>
              <p className="remember-note">
                <strong>Как запомнить:</strong> {error.remember}
              </p>
            </div>
          </details>
        ))}
      </div>

      {filteredErrors.length === 0 && (
        <section className="panel">
          <p>Ничего не найдено. Попробуй другое слово из сообщения компилятора.</p>
        </section>
      )}
    </article>
  );
}
