export type TaskLevel = "easy" | "medium" | "hard";

export type TaskFile = {
  fileName: string;
  description: string;
  starterCode: string;
};

export type Task = {
  id: string;
  title: string;
  section: string;
  level: TaskLevel;
  topics: string[];
  theorySlug: string;
  goal: string;
  description: string;
  practicePath: string;
  whatToCreate: string[];
  files: TaskFile[];
  steps: string[];
  todoGuide?: string[];
  hints: string[];
  commonMistakes: string[];
  selfCheck: string[];
};

const starter = (title: string) => `#include <iostream>

using namespace std;

int main() {
    // TODO: ${title}
    return 0;
}
`;

const hppStarter = (name: string) => `#pragma once

#ifndef ${name.toUpperCase()}_HPP
#define ${name.toUpperCase()}_HPP

// TODO: объявите класс ${name}

#endif
`;

function singleTask(
  id: string,
  title: string,
  section: string,
  level: TaskLevel,
  theorySlug: string,
  topics: string[],
  practicePath: string,
  goal: string,
  details: Partial<Omit<Task, "id" | "title" | "section" | "level" | "theorySlug" | "topics" | "practicePath">> = {},
): Task {
  return {
    id,
    title,
    section,
    level,
    topics,
    theorySlug,
    goal,
    description: details.description ?? "Откройте файл из practice, прочитайте комментарии в начале файла и напишите решение вместо TODO. Сначала добейтесь компиляции, затем проверьте поведение на простых данных.",
    practicePath,
    whatToCreate: details.whatToCreate ?? [`Один файл: ${practicePath}`],
    files: [
      {
        fileName: practicePath,
        description: details.files?.[0]?.description ?? "Основной файл упражнения. Пишите код в нём, не добавляя готовое решение на сайт.",
        starterCode: details.files?.[0]?.starterCode ?? starter(title),
      },
    ],
    steps: details.steps ?? [
      "Откройте указанный файл в папке practice.",
      "Найдите TODO и прочитайте условие в комментариях.",
      "Напишите минимальный рабочий вариант, не пытаясь сразу сделать красиво.",
      "Скомпилируйте файл отдельно как C++17 программу.",
      "Если есть ошибка компилятора, исправляйте первую ошибку сверху, затем запускайте снова.",
    ],
    todoGuide: details.todoGuide,
    hints: details.hints ?? [
      "Сначала напишите каркас: include, using namespace std, int main.",
      "Не переписывайте условие в код. Переводите каждый пункт условия в одну-две строки C++.",
      "Если задача про класс или структуру, сначала выпишите поля на бумаге.",
    ],
    commonMistakes: details.commonMistakes ?? [
      "Забывают точку с запятой после объявления или после класса.",
      "Пишут весь код сразу и потом трудно понять, где ошибка.",
      "Не проверяют программу после маленьких шагов.",
    ],
    selfCheck: details.selfCheck ?? [
      "Файл компилируется без ошибок.",
      "Код содержит именно те элементы, которые перечислены в условии.",
      "Вы можете объяснить, зачем нужна каждая переменная или функция.",
    ],
  };
}

function multiTask(
  id: string,
  title: string,
  section: string,
  level: TaskLevel,
  theorySlug: string,
  topics: string[],
  practicePath: string,
  files: TaskFile[],
  goal: string,
  details: Partial<Omit<Task, "id" | "title" | "section" | "level" | "theorySlug" | "topics" | "practicePath">> = {},
): Task {
  return {
    id,
    title,
    section,
    level,
    topics,
    theorySlug,
    goal,
    description: details.description ?? "Это многофайловая задача. В заголовочном файле объявляйте класс, в .cpp реализуйте методы, а в main.cpp проверяйте работу объекта.",
    practicePath,
    whatToCreate: details.whatToCreate ?? files.map((file) => file.fileName),
    files,
    steps: details.steps ?? [
      "Откройте все файлы задачи.",
      "В .hpp оставьте объявление класса: поля и заголовки методов.",
      "В .cpp подключите .hpp и реализуйте методы через ClassName::methodName.",
      "В main.cpp создайте объект и вызовите методы для проверки.",
      "При сборке компилируйте main.cpp вместе с файлом реализации .cpp.",
    ],
    todoGuide: details.todoGuide,
    hints: details.hints ?? [
      "Если компилятор знает класс, но линковщик ругается на метод, скорее всего не подключён файл реализации .cpp.",
      "В .hpp обычно не пишут тела больших методов.",
      "Имя метода в .cpp должно совпадать с объявлением в .hpp.",
    ],
    commonMistakes: details.commonMistakes ?? [
      "Забывают ClassName:: перед методом в .cpp.",
      "Подключают .cpp через include вместо .hpp.",
      "Собирают только main.cpp и получают ошибку линковки.",
    ],
    selfCheck: details.selfCheck ?? [
      "Класс объявлен один раз в .hpp.",
      "Методы реализованы в .cpp.",
      "main.cpp содержит только запуск и проверку поведения.",
    ],
  };
}

export const tasks: Task[] = [
  singleTask("00-01-minimal-program", "Минимальная программа C++", "00. Основы", "easy", "basics", ["main", "return"], "practice/00_basics/ex01_minimal_program.cpp", "Понять минимальный каркас C++ программы.", {
    hints: ["Нужны `#include <iostream>`, `using namespace std;`, `int main()` и `return 0;`.", "`main` — точка входа: без неё обычная консольная программа не запустится."],
    selfCheck: ["Есть `int main()`.", "В конце есть `return 0;`.", "Все фигурные скобки закрыты."],
  }),
  singleTask("00-02-print-hello", "Вывод строки Hello", "00. Основы", "easy", "basics", ["cout"], "practice/00_basics/ex02_print_hello.cpp", "Научиться выводить текст через cout.", {
    hints: ["Строка в C++ пишется в двойных кавычках.", "Для вывода используйте `cout << \"Hello\";`."],
  }),
  singleTask("00-03-input-age", "Ввод возраста", "00. Основы", "easy", "basics", ["cin", "int"], "practice/00_basics/ex03_input_age.cpp", "Считать число в переменную `age`.", {
    hints: ["Сначала объявите `int age;`.", "Для ввода используйте `cin >> age;`, стрелки направлены в переменную."],
    commonMistakes: ["Пишут `cin << age`, хотя для ввода нужен оператор `>>`.", "Используют переменную до объявления."],
  }),
  singleTask("00-04-if-age", "Проверка возраста через if", "00. Основы", "easy", "basics", ["if", "bool"], "practice/00_basics/ex04_if_age.cpp", "Научиться выбирать действие по условию.", {
    hints: ["Условие возраста обычно выглядит как `if (age >= 18)`.", "Добавьте `else`, если нужно вывести второй вариант."],
  }),
  singleTask("00-05-for-loop", "Цикл for от 1 до 10", "00. Основы", "easy", "basics", ["for"], "practice/00_basics/ex05_for_loop.cpp", "Повторить вывод чисел через цикл.", {
    hints: ["Цикл можно начать с `int i = 1`.", "Условие продолжения: `i <= 10`.", "После каждой итерации нужно увеличить `i++`."],
  }),
  singleTask("00-06-function-square", "Функция квадрата числа", "00. Основы", "easy", "basics", ["function", "return"], "practice/00_basics/ex06_function_square.cpp", "Написать функцию `getSquare`, которая возвращает квадрат числа.", {
    hints: ["Функция должна вернуть значение, значит тип может быть `int`.", "Квадрат числа `x` — это `x * x`."],
    selfCheck: ["`getSquare(5)` возвращает `25`.", "Функция не печатает результат вместо возврата, если по условию нужен `return`."],
  }),
  singleTask("00-07-simple-menu", "Простое меню через while", "00. Основы", "easy", "basics", ["while", "menu"], "practice/00_basics/ex07_simple_menu.cpp", "Сделать меню, которое повторяется до выбора выхода.", {
    hints: ["Создайте переменную `choice`.", "Запускайте цикл, пока `choice` не равен пункту выхода.", "После вывода меню считывайте новый выбор через `cin`."],
  }),

  singleTask("01-01-empty-person-struct", "Пустая структура Person", "01. Структуры", "easy", "struct", ["struct"], "practice/01_struct/ex01_empty_person_struct.cpp", "Объявить структуру `Person`.", {
    hints: ["После закрывающей скобки структуры обязательно ставится `;`.", "Поля можно добавить позже, сначала важен сам синтаксис `struct Person { };`."],
  }),
  singleTask("01-02-person-object", "Объект структуры Person", "01. Структуры", "easy", "struct", ["struct", "object"], "practice/01_struct/ex02_person_object.cpp", "Создать объект структуры и заполнить поля.", {
    hints: ["Создание объекта выглядит как `Person person;`.", "К полям обращаются через точку: `person.name`."],
  }),
  singleTask("01-03-print-person-function", "Функция печати Person", "01. Структуры", "easy", "struct", ["const reference"], "practice/01_struct/ex03_print_person_function.cpp", "Передать структуру в функцию без копирования.", {
    hints: ["Для функции печати используйте `const Person& person`.", "`const` защищает объект от изменения внутри функции."],
  }),
  singleTask("01-04-edit-person-function", "Функция редактирования Person", "01. Структуры", "easy", "struct", ["reference"], "practice/01_struct/ex04_edit_person_function.cpp", "Изменить структуру через ссылку.", {
    hints: ["Если функция должна менять объект, нужен параметр `Person& person` без `const`.", "Изменяйте поля через точку."],
  }),
  singleTask("01-05-product-struct", "Структура Product", "01. Структуры", "easy", "struct", ["fields"], "practice/01_struct/ex05_product_struct.cpp", "Самостоятельно описать товар через структуру.", {
    hints: ["Подумайте, какие поля есть у товара: название, цена, количество.", "Напишите отдельную функцию печати товара."],
  }),

  singleTask("02-01-empty-car-class", "Пустой класс Car", "02. Классы", "medium", "classes", ["class"], "practice/02_classes/ex01_empty_car_class.cpp", "Объявить класс `Car` и понять отличие от struct."),
  singleTask("02-02-private-field", "Закрытое поле класса", "02. Классы", "medium", "classes", ["private"], "practice/02_classes/ex02_private_field.cpp", "Добавить поле в `private` и увидеть, что прямой доступ снаружи закрыт.", {
    hints: ["Внутри `class` всё закрыто по умолчанию, но лучше явно написать `private:`.", "Пока не пишите сложные методы, цель — понять доступ."],
  }),
  singleTask("02-03-public-method", "Открытый метод класса", "02. Классы", "medium", "classes", ["public", "method"], "practice/02_classes/ex03_public_method.cpp", "Добавить метод в `public` и вызвать его у объекта.", {
    hints: ["Метод вызывается через точку: `car.print();`.", "Не забудьте скобки при вызове метода."],
  }),
  singleTask("02-04-car-input-print", "Ввод и вывод Car", "02. Классы", "medium", "classes", ["input", "print"], "practice/02_classes/ex04_car_input_print.cpp", "Сделать класс `Car`, который умеет вводить и печатать свои данные."),
  singleTask("02-05-sort-cars-by-year", "Сортировка машин по году", "02. Классы", "medium", "classes", ["vector", "sort"], "practice/02_classes/ex05_sort_cars_by_year.cpp", "Соединить класс `Car`, `vector` и сортировку по году.", {
    hints: ["Добавьте метод `getYear()`, чтобы сравнивать машины снаружи без доступа к private полю.", "Функция сравнения должна возвращать `bool`."],
  }),

  singleTask("03-01-default-constructor", "Конструктор по умолчанию", "03. Конструкторы", "medium", "constructors-destructors", ["constructor"], "practice/03_constructors_destructors/ex01_default_constructor.cpp", "Написать конструктор без параметров."),
  singleTask("03-02-parameter-constructor", "Конструктор с параметрами", "03. Конструкторы", "medium", "constructors-destructors", ["constructor"], "practice/03_constructors_destructors/ex02_parameter_constructor.cpp", "Создать объект сразу с начальными значениями."),
  singleTask("03-03-constructor-overload", "Перегрузка конструкторов", "03. Конструкторы", "medium", "constructors-destructors", ["overload"], "practice/03_constructors_destructors/ex03_constructor_overload.cpp", "Написать несколько конструкторов с разными параметрами."),
  singleTask("03-04-destructor-message", "Сообщение из деструктора", "03. Конструкторы", "medium", "constructors-destructors", ["destructor"], "practice/03_constructors_destructors/ex04_destructor_message.cpp", "Увидеть момент удаления объекта."),
  singleTask("03-05-student-lifecycle", "Жизненный цикл Student", "03. Конструкторы", "medium", "constructors-destructors", ["constructor", "destructor"], "practice/03_constructors_destructors/ex05_student_lifecycle.cpp", "Показать создание и уничтожение объекта `Student`."),

  singleTask("04-01-setter-without-this-problem", "Проблема name = name", "04. this", "medium", "this", ["this"], "practice/04_this/ex01_setter_without_this_problem.cpp", "Понять, почему параметр может заслонять поле."),
  singleTask("04-02-setter-with-this", "Сеттер с this", "04. this", "medium", "this", ["this"], "practice/04_this/ex02_setter_with_this.cpp", "Исправить сеттер через `this->field = field`."),
  singleTask("04-03-constructor-with-this", "Конструктор с this", "04. this", "medium", "this", ["this", "constructor"], "practice/04_this/ex03_constructor_with_this.cpp", "Заполнить поля конструктора через `this`."),
  singleTask("04-04-planet-this", "Класс Planet и this", "04. this", "medium", "this", ["this", "class"], "practice/04_this/ex04_planet_this.cpp", "Применить `this` в классе планеты."),

  multiTask("05-01-book-multifile", "Book: первый многофайловый проект", "05. Многофайловый проект", "medium", "multifile-project", ["hpp", "cpp"], "practice/05_multifile_project/ex01_book", [
    { fileName: "practice/05_multifile_project/ex01_book/main.cpp", description: "Точка входа: создайте Book и вызовите методы.", starterCode: starter("проверка Book") },
    { fileName: "practice/05_multifile_project/ex01_book/Book.hpp", description: "Объявление класса Book.", starterCode: hppStarter("Book") },
    { fileName: "practice/05_multifile_project/ex01_book/Book.cpp", description: "Реализация методов Book через Book::method.", starterCode: '#include "Book.hpp"\n#include <iostream>\n\nusing namespace std;\n\n// TODO: реализуйте методы Book\n' },
  ], "Разделить класс Book на main.cpp, Book.hpp и Book.cpp."),
  multiTask("05-02-bed-training", "Bed: тренировочный многофайловый проект", "05. Многофайловый проект", "medium", "multifile-project", ["hpp", "cpp", "class"], "practice/05_multifile_project/ex02_bed_training", [
    { fileName: "practice/05_multifile_project/ex02_bed_training/main.cpp", description: "Проверка класса Bed.", starterCode: starter("проверка Bed") },
    { fileName: "practice/05_multifile_project/ex02_bed_training/Bed.hpp", description: "Объявление класса Bed.", starterCode: hppStarter("Bed") },
    { fileName: "practice/05_multifile_project/ex02_bed_training/Bed.cpp", description: "Реализация методов Bed.", starterCode: '#include "Bed.hpp"\n#include <iostream>\n\nusing namespace std;\n\n// TODO: реализуйте методы Bed\n' },
  ], "Потренироваться выносить класс Bed в отдельные файлы."),

  singleTask("06-01-include-guard-book", "Include guard для Book.hpp", "06. Препроцессор", "medium", "preprocessor", ["include guard"], "practice/06_preprocessor/ex01_include_guard_book.hpp", "Защитить заголовочный файл от повторного подключения."),
  singleTask("06-02-include-guard-car", "Include guard для Car.hpp", "06. Препроцессор", "medium", "preprocessor", ["include guard"], "practice/06_preprocessor/ex02_include_guard_car.hpp", "Написать защиту заголовочного файла `Car.hpp`."),
  multiTask("06-03-bed-include-guard", "Include guard для Bed.hpp", "06. Препроцессор", "medium", "preprocessor", ["pragma once", "ifndef"], "practice/06_preprocessor/ex03_bed_include_guard", [
    { fileName: "practice/06_preprocessor/ex03_bed_include_guard/Bed.hpp", description: "Добавьте `#pragma once`, `#ifndef`, `#define`, `#endif`.", starterCode: hppStarter("Bed") },
  ], "Защитить `Bed.hpp` классическим include guard."),

  singleTask("07-01-cup-initializer-list", "Cup со списком инициализации", "07. Список инициализации", "medium", "initializer-list", ["initializer list"], "practice/07_initializer_list/ex01_cup_initializer_list.cpp", "Написать конструктор через список инициализации."),
  singleTask("07-02-plate-default-constructor", "Plate: конструктор по умолчанию", "07. Список инициализации", "medium", "initializer-list", ["constructor"], "practice/07_initializer_list/ex02_plate_default_constructor.cpp", "Инициализировать поля `Plate` значениями по умолчанию."),
  singleTask("07-03-plate-full-constructor", "Plate: полный конструктор", "07. Список инициализации", "medium", "initializer-list", ["constructor"], "practice/07_initializer_list/ex03_plate_full_constructor.cpp", "Передать все поля плитки через параметры конструктора."),
  singleTask("07-04-plate-vector-menu", "Plate: vector и меню", "07. Список инициализации", "medium", "initializer-list", ["vector", "menu"], "practice/07_initializer_list/ex04_plate_vector_menu.cpp", "Соединить класс `Plate`, список инициализации и меню."),

  singleTask("08-01-vector-int-push-back", "vector<int> и push_back", "08. vector", "medium", "vector", ["push_back"], "practice/08_vector/ex01_vector_int_push_back.cpp", "Добавить числа в `vector<int>`."),
  singleTask("08-02-vector-print-by-index", "Вывод vector по индексам", "08. vector", "medium", "vector", ["index"], "practice/08_vector/ex02_vector_print_by_index.cpp", "Пройти по vector циклом и вывести элементы."),
  singleTask("08-03-vector-delete-by-number", "Удаление из vector по номеру", "08. vector", "medium", "vector", ["erase"], "practice/08_vector/ex03_vector_delete_by_number.cpp", "Безопасно удалить элемент по номеру пользователя."),
  singleTask("08-04-vector-empty-check", "Проверка vector на пустоту", "08. vector", "medium", "vector", ["empty"], "practice/08_vector/ex04_vector_empty_check.cpp", "Проверить список через `empty()` перед работой."),
  singleTask("08-05-vector-objects", "vector с объектами", "08. vector", "medium", "vector", ["vector<Car>"], "practice/08_vector/ex05_vector_objects.cpp", "Хранить объекты класса в vector."),
  singleTask("08-06-vector-sort", "Сортировка vector", "08. vector", "medium", "vector", ["sort"], "practice/08_vector/ex06_vector_sort.cpp", "Отсортировать элементы vector по выбранному полю."),
  singleTask("08-07-vector-menu", "Меню на основе vector", "08. vector", "medium", "vector", ["menu"], "practice/08_vector/ex07_vector_menu.cpp", "Сделать меню добавления, вывода и удаления элементов."),

  singleTask("09-01-simple-delegation", "Простое делегирование конструктора", "09. Делегирование", "medium", "delegating-constructors", ["delegation"], "practice/09_delegating_constructors/ex01_simple_delegation.cpp", "Вызвать один конструктор из другого."),
  singleTask("09-02-worker-constructors", "Worker: несколько конструкторов", "09. Делегирование", "medium", "delegating-constructors", ["Worker"], "practice/09_delegating_constructors/ex02_worker_constructors.cpp", "Сделать несколько способов создания рабочего."),
  singleTask("09-03-worker-edit-without-id", "Worker: редактирование без id", "09. Делегирование", "medium", "delegating-constructors", ["id"], "practice/09_delegating_constructors/ex03_worker_edit_without_id.cpp", "Редактировать поля рабочего, но не менять id."),
  singleTask("09-04-worker-vector-menu", "Worker: vector и меню", "09. Делегирование", "medium", "delegating-constructors", ["vector", "menu"], "practice/09_delegating_constructors/ex04_worker_vector_menu.cpp", "Сделать меню для списка рабочих."),

  singleTask("10-01-private-field-getter", "Закрытое поле и геттер", "10. Инкапсуляция", "medium", "encapsulation", ["getter"], "practice/10_encapsulation/ex01_private_field_getter.cpp", "Прочитать private поле через public геттер."),
  singleTask("10-02-setter-validation", "Сеттер с проверкой", "10. Инкапсуляция", "medium", "encapsulation", ["setter"], "practice/10_encapsulation/ex02_setter_validation.cpp", "Не пропустить неправильное значение в объект."),
  singleTask("10-03-explicit-constructor", "explicit-конструктор", "10. Инкапсуляция", "medium", "encapsulation", ["explicit"], "practice/10_encapsulation/ex03_explicit_constructor.cpp", "Понять, зачем запрещают неявные преобразования."),
  singleTask("10-04-planet-getters-setters", "Planet: геттеры и сеттеры", "10. Инкапсуляция", "medium", "encapsulation", ["getters", "setters"], "practice/10_encapsulation/ex04_planet_getters_setters.cpp", "Закрыть поля планеты и дать контролируемый доступ."),
  singleTask("10-05-planet-sort-by-field", "Planet: сортировка по выбранному полю", "10. Инкапсуляция", "medium", "encapsulation", ["sort"], "practice/10_encapsulation/ex05_planet_sort_by_field.cpp", "Сортировать планеты через геттеры."),

  singleTask("11-01-throw-runtime-error", "throw runtime_error", "11. Исключения", "medium", "exceptions", ["throw"], "practice/11_exceptions/ex01_throw_runtime_error.cpp", "Выбросить исключение при запрещённой ситуации."),
  singleTask("11-02-try-catch", "try/catch", "11. Исключения", "medium", "exceptions", ["try", "catch"], "practice/11_exceptions/ex02_try_catch.cpp", "Поймать исключение и вывести текст ошибки."),
  singleTask("11-03-getter-with-exception", "Геттер с исключением", "11. Исключения", "medium", "exceptions", ["getter"], "practice/11_exceptions/ex03_getter_with_exception.cpp", "Ограничить доступ к данным через исключение."),
  singleTask("11-04-company-hidden-data", "Company: скрытые данные", "11. Исключения", "medium", "exceptions", ["Company"], "practice/11_exceptions/ex04_company_hidden_data.cpp", "Скрыть часть данных компании по правилам задачи."),
  singleTask("11-05-company-menu", "Company: меню с обработкой ошибок", "11. Исключения", "medium", "exceptions", ["menu", "try/catch"], "practice/11_exceptions/ex05_company_menu.cpp", "Сделать меню, которое не падает при исключениях."),

  singleTask("task2-1-person", "Задача 2.1: структура Person", "12. Большие задачи", "hard", "struct", ["struct", "date"], "practice/big_tasks/task2_1_person.cpp", "Создать `Person`, посчитать возраст и определить знак зодиака.", {
    description: "Это первая большая задача на проектирование сущности. Нужно собрать данные человека в `struct Person`, не разносить имя, фамилию и дату рождения по отдельным переменным, а затем написать функции, которые читают эту структуру и считают дополнительные данные.",
    whatToCreate: ["`struct Person`", "поля `firstName`, `lastName`, `birthDay`, `birthMonth`, `birthYear`", "функцию ввода человека", "функцию вычисления возраста", "функцию определения знака зодиака", "функцию вывода всех данных"],
    todoGuide: ["В `struct Person` добавьте поля имени, фамилии и даты рождения.", "В `main` создайте объект `Person person;`.", "Считайте значения в поля через точку: `person.firstName`, `person.birthYear`.", "Напишите функцию `getAge(const Person& person)`.", "Напишите функцию `getZodiacSign(const Person& person)`.", "В функции вывода покажите исходные данные, возраст и знак зодиака.", "Проверьте несколько дат рождения, чтобы условия знака зодиака не работали только на одном примере."],
    steps: ["Опишите `struct Person` до `main`.", "Создайте объект `Person person;`.", "Считайте имя, фамилию, день, месяц и год рождения.", "Напишите `getAge(const Person& person)`.", "Напишите `getZodiacSign(const Person& person)`.", "Выведите исходные поля, возраст и знак зодиака."],
    hints: ["Для функции, которая только читает человека, используйте `const Person& person`.", "Знак зодиака удобно определять цепочкой условий по месяцу и дню.", "Начните с одного знака зодиака, проверьте, затем добавляйте остальные.", "Возраст можно считать приблизительно от текущего года, если в условии не требуется точная дата."],
    commonMistakes: ["Хранят имя и дату рождения в отдельных переменных вместо `Person`.", "Передают `Person` по значению в функции печати.", "Путают день и месяц в условиях знака зодиака.", "Пишут слишком большую функцию, где ввод, расчёт и вывод смешаны вместе."],
    selfCheck: ["Все данные человека находятся внутри `Person`.", "Функции, которые не меняют объект, принимают `const Person&`.", "Для разных дат возвращаются разные знаки зодиака.", "Вывод показывает и исходные, и вычисленные данные."],
    files: [{ fileName: "practice/big_tasks/task2_1_person.cpp", description: "Один файл большой задачи Person.", starterCode: `#include <iostream>
#include <string>

using namespace std;

struct Person {
    // TODO: поля человека
};

int main() {
    // TODO: создать Person, считать данные, вывести возраст и знак зодиака
    return 0;
}
` }],
  }),
  singleTask("task3-1-car", "Задача 3.1: класс Car", "12. Большие задачи", "hard", "classes", ["class", "vector", "sort"], "practice/big_tasks/task3_1_car.cpp", "Создать класс `Car`, ввести список машин и отсортировать по году.", {
    description: "Задача закрепляет классы: автомобиль должен стать отдельной сущностью с закрытыми полями и открытыми методами. После проверки одного автомобиля нужно перейти к списку `vector<Car>` и сортировке по году выпуска.",
    whatToCreate: ["класс `Car`", "private поля: марка, пробег, год выпуска, страна-производитель, мощность", "public методы `input`, `print`, `getYear`", "`vector<Car> cars`", "ввод количества автомобилей", "сортировку по году выпуска"],
    todoGuide: ["Сначала объявите класс `Car`.", "Добавьте private-поля: `brand`, `mileage`, `year`, `country`, `power`.", "Добавьте метод `input()`, который запрашивает значения через `cin`.", "Добавьте метод `print() const`, который выводит данные автомобиля.", "Добавьте `getYear() const`, чтобы сортировка могла получить год выпуска.", "В `main` создайте `vector<Car> cars`.", "Введите количество автомобилей.", "В цикле создавайте `Car`, вызывайте `input()` и добавляйте через `push_back()`.", "Отсортируйте `cars` через `sort` и функцию сравнения по `getYear()`.", "Выведите все автомобили после сортировки."],
    steps: ["Опишите класс `Car` с private полями.", "Добавьте метод `input()` для ввода одной машины.", "Добавьте метод `print() const` для вывода одной машины.", "Добавьте `int getYear() const`.", "В `main` считайте количество машин.", "В цикле создавайте `Car car`, вызывайте `car.input()` и добавляйте через `cars.push_back(car)`.", "Отсортируйте `cars` по `getYear()`.", "Выведите отсортированный список."],
    hints: ["Сортировке не нужен доступ к private-полю `year`, если есть `getYear()`.", "Функция сравнения должна возвращать `true`, если первая машина должна стоять раньше второй.", "Проверьте сначала один объект `Car`, и только потом добавляйте `vector<Car>`.", "Для сортировки понадобится `<algorithm>`."],
    commonMistakes: ["Делают поля `public` и сортируют через `car.year`.", "Забывают `#include <vector>` или `#include <algorithm>`.", "Пытаются сортировать до заполнения списка.", "Пишут `getYear` без `return`.", "Смешивают ввод всех машин внутри класса вместо ввода одной машины."],
    selfCheck: ["Поля машины закрыты.", "Один объект `Car` умеет вводиться и выводиться.", "Список хранится в `vector<Car>`.", "Сортировка использует `getYear()`.", "После сортировки машины выводятся в правильном порядке."],
    files: [{ fileName: "practice/big_tasks/task3_1_car.cpp", description: "Один файл большой задачи Car.", starterCode: `#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

class Car {
private:
    // TODO: поля автомобиля

public:
    void input();
    void print() const;
    int getYear() const;
};

int main() {
    vector<Car> cars;
    // TODO: ввод, push_back, sort, вывод
    return 0;
}
` }],
  }),
  singleTask("task3-2-student", "Задача 3.2: класс Student", "12. Большие задачи", "hard", "constructors-destructors", ["class", "constructor", "destructor", "menu"], "practice/big_tasks/task3_2_student.cpp", "Создать класс `Student` с конструкторами, деструктором, редактированием и меню.", {
    description: "Задача показывает жизненный цикл объекта: как студент создаётся через конструктор, как редактируется, как выводится и когда вызывается деструктор.",
    whatToCreate: ["класс `Student`", "поля: имя, возраст, идентификатор, класс обучения", "конструктор по умолчанию", "конструктор с параметрами", "деструктор с сообщением", "методы `edit` и `print`", "меню для работы с объектом"],
    todoGuide: ["В классе `Student` добавьте private-поля: имя, возраст, id, класс обучения.", "Напишите конструктор по умолчанию с безопасными начальными значениями.", "Напишите конструктор с параметрами для полного создания студента.", "Добавьте деструктор `~Student()` с сообщением, где выводится имя.", "Добавьте `print() const`, который показывает все поля.", "Добавьте `edit()`, который меняет редактируемые поля.", "В `main` создайте студента и меню: показать, редактировать, выйти.", "Проверьте, что конструктор и деструктор выводят сообщения в понятные моменты."],
    steps: ["Опишите private поля студента.", "Напишите конструктор по умолчанию.", "Напишите конструктор с параметрами.", "Напишите деструктор `~Student()` с учебным сообщением.", "Добавьте метод `print() const`.", "Добавьте метод `edit()`.", "Сделайте меню: показать, редактировать, выйти."],
    hints: ["Конструктор называется как класс и не имеет `void`.", "Деструктор называется `~Student` и не принимает параметры.", "id можно показать, но не обязательно редактировать.", "Сначала проверьте создание одного объекта без меню."],
    commonMistakes: ["Пишут `void Student()` и думают, что это конструктор.", "Создают деструктор с параметрами.", "Печатают сообщение деструктора и пугаются, что оно появляется при выходе из области видимости.", "Меняют id там, где он должен оставаться постоянным."],
    selfCheck: ["При создании студента вызывается конструктор.", "При завершении работы виден вызов деструктора.", "Метод `edit` меняет нужные поля.", "Метод `print` выводит все данные студента.", "Меню повторяется до выхода."],
    files: [{ fileName: "practice/big_tasks/task3_2_student.cpp", description: "Один файл большой задачи Student.", starterCode: `#include <iostream>
#include <string>

using namespace std;

class Student {
private:
    // TODO: поля студента

public:
    Student();
    Student(string name, int age, int id, string className);
    ~Student();
    void edit();
    void print() const;
};

int main() {
    // TODO: создать Student и меню
    return 0;
}
` }],
  }),
  singleTask("task3-3-planet", "Задача 3.3: класс Planet", "12. Большие задачи", "hard", "this", ["class", "this", "constructor"], "practice/big_tasks/task3_3_planet.cpp", "Создать систему планет через класс и конструктор с параметрами.", {
    description: "Задача закрепляет `this` и конструктор с параметрами. Нужно создать класс планеты и несколько объектов, где параметры конструктора записываются в одноимённые поля через `this->`.",
    whatToCreate: ["класс `Planet`", "поля: название, радиус, масса или расстояние", "конструктор с параметрами", "метод вывода", "массив или `vector` планет"],
    todoGuide: ["Объявите класс `Planet`.", "Добавьте поля планеты: `name`, `radius`, `mass` или другие из условия.", "Напишите конструктор с параметрами с такими же именами.", "В конструкторе присвойте поля через `this->name = name`.", "Добавьте метод `print() const`.", "В `main` создайте несколько планет.", "Сложите планеты в массив или `vector<Planet>`.", "Выведите систему планет циклом."],
    steps: ["Опишите поля планеты.", "Напишите конструктор с параметрами.", "Если параметры называются как поля, используйте `this->field = field`.", "Создайте несколько планет.", "Выведите систему планет циклом."],
    hints: ["`this->name = name` означает: поле текущего объекта получает значение параметра.", "Начните с двух планет, потом добавьте остальные.", "Если используете `vector<Planet>`, добавляйте объекты через `push_back`."],
    commonMistakes: ["Пишут `name = name`, из-за чего поле не получает значение.", "Создают конструктор с `void`.", "Путают поля планеты и локальные переменные.", "Выводят только одну планету вместо списка."],
    selfCheck: ["Планеты создаются через конструктор с параметрами.", "`this->` используется там, где имена совпадают.", "Вывод показывает несколько планет.", "Каждый объект хранит свои данные."],
    files: [{ fileName: "practice/big_tasks/task3_3_planet.cpp", description: "Один файл большой задачи Planet.", starterCode: `#include <iostream>
#include <string>
#include <vector>

using namespace std;

class Planet {
private:
    // TODO: поля планеты

public:
    Planet(/* TODO: параметры */);
    void print() const;
};

int main() {
    vector<Planet> planets;
    // TODO: добавить планеты и вывести список
    return 0;
}
` }],
  }),
  singleTask("task4-1-bed-one-file", "Задача 4.1: Bed в одном файле", "12. Большие задачи", "hard", "multifile-project", ["class", "methods outside class"], "practice/big_tasks/task4_1_bed_one_file.cpp", "Описать `Bed`, вынеся реализации методов за пределы класса.", {
    description: "Это переход к стилю, который позже понадобится в многофайловом проекте: внутри класса остаются объявления методов, а реализации пишутся ниже через `Bed::methodName`.",
    whatToCreate: ["класс `Bed`", "поля: двухъярусная, количество мест, материал, стоимость", "конструктор по умолчанию", "конструктор с параметрами", "методы `edit` и `print`", "реализации методов за пределами класса"],
    todoGuide: ["В классе `Bed` объявите private-поля: двухъярусная ли кровать, количество мест, материал, стоимость.", "Внутри класса оставьте только объявления конструкторов и методов.", "Ниже класса реализуйте конструкторы через `Bed::Bed`.", "Реализуйте `Bed::edit()`, чтобы менять поля.", "Реализуйте `Bed::print() const`, чтобы выводить состояние объекта.", "В `main` создайте объект `Bed`.", "Вызовите `print()`, затем `edit()`, затем снова `print()`.", "Проверьте, что поля инициализируются в конструкторах."],
    steps: ["В классе объявите поля и методы.", "После класса реализуйте конструкторы через `Bed::Bed`.", "Реализуйте `Bed::edit`.", "Реализуйте `Bed::print`.", "В `main` создайте объект и проверьте методы."],
    hints: ["Внутри класса оставьте только объявления методов.", "Реализация вне класса требует `Bed::`.", "Поля должны получать значения в конструкторах, а не висеть неинициализированными."],
    commonMistakes: ["Забывают `Bed::` перед именем метода.", "Реализуют метод внутри класса, хотя задача просит вынести реализацию.", "Не инициализируют поля в конструкторе.", "Путают `bool` для двухъярусной кровати с текстом."],
    selfCheck: ["В классе видны объявления методов.", "Реализации написаны ниже класса.", "Оба конструктора работают.", "Методы `edit` и `print` используют поля объекта."],
    files: [{ fileName: "practice/big_tasks/task4_1_bed_one_file.cpp", description: "Один файл большой задачи Bed.", starterCode: `#include <iostream>
#include <string>

using namespace std;

class Bed {
private:
    // TODO: поля кровати

public:
    Bed();
    Bed(bool isBunk, int places, string material, double price);
    void edit();
    void print() const;
};

// TODO: реализации Bed::Bed, Bed::edit, Bed::print

int main() {
    // TODO: создать Bed и проверить методы
    return 0;
}
` }],
  }),
  multiTask("task4-2-bed-multifile", "Задача 4.2: Bed в трёх файлах", "12. Большие задачи", "hard", "multifile-project", ["hpp", "cpp"], "practice/big_tasks/task4_2_bed", [
    { fileName: "practice/big_tasks/task4_2_bed/main.cpp", description: "Точка входа: создать объект Bed, вызвать методы, сделать простое меню или проверку.", starterCode: '#include "Bed.hpp"\n\nint main() {\n    // TODO: создать Bed и проверить методы\n    return 0;\n}\n' },
    { fileName: "practice/big_tasks/task4_2_bed/Bed.hpp", description: "Заголовочный файл: только объявление класса Bed, поля и прототипы методов.", starterCode: '#pragma once\n\n#include <string>\n\nclass Bed {\nprivate:\n    // TODO: поля кровати\n\npublic:\n    Bed();\n    Bed(bool isBunk, int places, std::string material, double price);\n    void edit();\n    void print() const;\n};\n' },
    { fileName: "practice/big_tasks/task4_2_bed/Bed.cpp", description: "Файл реализации: подключить Bed.hpp и написать методы через Bed::.", starterCode: '#include "Bed.hpp"\n#include <iostream>\n\nusing namespace std;\n\n// TODO: реализуйте конструкторы, edit и print через Bed::\n' },
  ], "Разделить задачу `Bed` на `main.cpp`, `Bed.hpp`, `Bed.cpp`.", {
    description: "Та же сущность Bed, но теперь код нужно разложить по трём файлам: объявление класса отдельно, реализация отдельно, запуск отдельно.",
    whatToCreate: ["`main.cpp` для запуска", "`Bed.hpp` с объявлением класса", "`Bed.cpp` с реализациями методов", "корректные `#include`", "сборку, где участвуют `main.cpp` и `Bed.cpp`"],
    todoGuide: ["В `Bed.hpp` объявите класс `Bed`, поля и прототипы методов.", "В `Bed.hpp` не пишите полные тела `edit()` и `print()`.", "В `Bed.cpp` подключите `#include \"Bed.hpp\"`.", "В `Bed.cpp` реализуйте методы через `Bed::edit()` и `Bed::print()`.", "В `main.cpp` подключите `Bed.hpp`.", "В `main.cpp` создайте объект `Bed` и вызовите методы.", "При сборке компилируйте `main.cpp` вместе с `Bed.cpp`.", "Если появилась `undefined reference`, проверьте, что `Bed.cpp` участвует в сборке."],
    steps: ["В `Bed.hpp` объявите класс.", "В `Bed.cpp` подключите `Bed.hpp`.", "Реализуйте методы через `Bed::`.", "В `main.cpp` подключите `Bed.hpp`.", "Создайте объект и проверьте методы.", "При компиляции убедитесь, что подключён `Bed.cpp`."],
    hints: ["В `.hpp` не пишите полные тела больших методов.", "Если забыть скомпилировать `Bed.cpp`, будет ошибка линковки.", "`main.cpp` не должен подключать `Bed.cpp` напрямую."],
    commonMistakes: ["Пишут реализацию методов в `Bed.hpp` без необходимости.", "Забывают `#include \"Bed.hpp\"` в `Bed.cpp`.", "Забывают добавить `Bed.cpp` в сборку.", "Пишут `print()` вместо `Bed::print()`."],
    selfCheck: ["В `Bed.hpp` только объявление класса.", "В `Bed.cpp` реализации методов.", "`main.cpp` создаёт объект и не содержит код класса.", "Проект собирается только при участии `Bed.cpp`."],
  }),
  multiTask("task4-3-bed-include-guard", "Задача 4.3: Bed с include guard", "12. Большие задачи", "hard", "preprocessor", ["include guard", "multifile"], "practice/big_tasks/task4_3_bed", [
    { fileName: "practice/big_tasks/task4_3_bed/main.cpp", description: "Проверка класса Bed и повторного подключения заголовка.", starterCode: '#include "Bed.hpp"\n#include "Bed.hpp"\n\nint main() {\n    // TODO: создать Bed и проверить, что двойной include не ломает сборку\n    return 0;\n}\n' },
    { fileName: "practice/big_tasks/task4_3_bed/Bed.hpp", description: "Класс Bed с `#pragma once` и классическим include guard.", starterCode: '#pragma once\n\n#ifndef BED_HPP\n#define BED_HPP\n\n#include <string>\n\nclass Bed {\nprivate:\n    // TODO: поля кровати\n\npublic:\n    Bed();\n    void print() const;\n};\n\n#endif\n' },
    { fileName: "practice/big_tasks/task4_3_bed/Bed.cpp", description: "Реализация методов Bed.", starterCode: '#include "Bed.hpp"\n#include <iostream>\n\nusing namespace std;\n\n// TODO: реализуйте методы Bed\n' },
  ], "Добавить защиту заголовочного файла в многофайловой задаче.", {
    description: "Задача показывает, зачем заголовочный файл защищают от повторного подключения. Нужно сохранить многофайловую структуру и добавить include guard.",
    whatToCreate: ["`#pragma once`", "`#ifndef BED_HPP`", "`#define BED_HPP`", "`#endif`", "класс `Bed` внутри защиты", "проверку двойным `#include`"],
    todoGuide: ["В начале `Bed.hpp` добавьте `#pragma once`.", "Ниже добавьте `#ifndef BED_HPP`.", "Следующей строкой добавьте `#define BED_HPP`.", "Разместите объявление класса `Bed` внутри блока guard.", "В конце `Bed.hpp` добавьте `#endif`.", "В `main.cpp` подключите `Bed.hpp` два раза для проверки.", "Оставьте реализации методов в `Bed.cpp`.", "Соберите проект и убедитесь, что повторное подключение не даёт ошибку."],
    steps: ["Откройте `Bed.hpp`.", "Добавьте `#pragma once` сверху.", "Добавьте `#ifndef BED_HPP` и `#define BED_HPP`.", "Оставьте объявление класса внутри guard.", "Закройте файл через `#endif`.", "В `main.cpp` подключите `Bed.hpp` два раза для проверки."],
    hints: ["Имя guard должно быть уникальным для файла.", "`#endif` закрывает `#ifndef`.", "Двойное подключение не должно давать повторное объявление класса."],
    commonMistakes: ["Забывают `#endif`.", "Пишут разные имена в `#ifndef` и `#define`.", "Ставят класс вне include guard.", "Путают `<iostream>` и `\"Bed.hpp\"`."],
    selfCheck: ["`Bed.hpp` содержит и `#pragma once`, и классический guard.", "Двойной include не ломает компиляцию.", "Методы всё ещё реализованы в `Bed.cpp`.", "В `main.cpp` нет реализации класса."],
  }),
  singleTask("task5-1-plate", "Задача 5.1: класс Plate", "12. Большие задачи", "hard", "initializer-list", ["initializer list", "vector", "menu"], "practice/big_tasks/task5_1_plate.cpp", "Создать класс `Plate` со списком инициализации, заранее заданными объектами и меню.", {
    description: "Задача соединяет список инициализации конструктора и `vector`. Нужно создать класс плитки, заранее добавить несколько плиток и сделать меню добавления, вывода и удаления.",
    whatToCreate: ["класс `Plate`", "поля: высота, ширина, толщина, вес, материал, производитель, стоимость", "конструктор по умолчанию", "полный конструктор через список инициализации", "`vector<Plate> plates`", "3-5 заранее созданных плиток", "меню добавления, вывода и удаления"],
    todoGuide: ["Объявите класс `Plate`.", "Добавьте private-поля: высота, ширина, толщина, вес, материал, производитель, стоимость.", "Напишите конструктор по умолчанию через список инициализации.", "Напишите полный конструктор через список инициализации.", "Добавьте метод `print() const`.", "В `main` создайте `vector<Plate> plates`.", "Добавьте 3-5 готовых плиток через `push_back`.", "Сделайте меню: показать список, добавить плитку, удалить плитку, выйти.", "При удалении проверяйте номер от 1 до `plates.size()`."],
    steps: ["Опишите private поля.", "Напишите конструктор по умолчанию через список инициализации.", "Напишите полный конструктор через список инициализации.", "Добавьте метод `print() const`.", "Создайте `vector<Plate>` и заполните 3-5 объектами.", "Сделайте меню.", "При удалении проверяйте номер."],
    hints: ["Список инициализации начинается после `:`.", "Поля в списке разделяются запятыми.", "Создайте объект `Plate plate(...);` и добавьте через `plates.push_back(plate)`.", "Удаление делайте через `plates.erase(plates.begin() + number - 1)` только после проверки."],
    commonMistakes: ["Инициализируют поля присваиванием в теле конструктора вместо списка.", "Забывают заранее добавить плитки.", "Удаляют без проверки номера.", "Не обновляют список после добавления или удаления."],
    selfCheck: ["Оба конструктора используют список инициализации.", "В списке есть заранее созданные плитки.", "Можно добавить новую плитку.", "Можно удалить плитку по корректному номеру.", "После изменения список выводится актуально."],
    files: [{ fileName: "practice/big_tasks/task5_1_plate.cpp", description: "Один файл большой задачи Plate.", starterCode: `#include <iostream>
#include <string>
#include <vector>

using namespace std;

class Plate {
private:
    // TODO: поля плитки

public:
    Plate();
    Plate(/* TODO: все параметры */);
    void print() const;
};

int main() {
    vector<Plate> plates;
    // TODO: заранее добавить плитки и сделать меню
    return 0;
}
` }],
  }),
  singleTask("task5-2-worker", "Задача 5.2: класс Worker", "12. Большие задачи", "hard", "delegating-constructors", ["delegation", "vector", "menu"], "practice/big_tasks/task5_2_worker.cpp", "Создать `Worker` с делегирующими конструкторами и меню списка работников.", {
    description: "Задача закрепляет делегирование конструкторов и работу со списком объектов. Рабочий имеет id, который задаётся при создании и не редактируется, а список рабочих хранится в `vector<Worker>`.",
    whatToCreate: ["класс `Worker`", "поля: id, ФИО, пол, возраст, должность, отдел", "полный конструктор", "короткие конструкторы, делегирующие полному", "`vector<Worker> workers`", "меню вывода, редактирования, добавления, удаления", "редактирование без изменения id"],
    todoGuide: ["Объявите класс `Worker`.", "Добавьте private-поля: id, ФИО, пол, возраст, должность, отдел.", "Напишите полный конструктор со всеми полями.", "Напишите короткий конструктор, который вызывает полный через `: Worker(...)`.", "Добавьте метод `print() const`.", "Добавьте метод редактирования, который не меняет id.", "В `main` создайте `vector<Worker> workers`.", "Сделайте меню вывода, добавления, редактирования и удаления.", "При удалении и редактировании проверяйте номер пользователя.", "Переводите номер пользователя в индекс через `number - 1`."],
    steps: ["Опишите поля `Worker`.", "Напишите полный конструктор.", "Напишите короткие конструкторы через делегирование.", "Добавьте `print()` и `editWithoutId()`.", "Создайте `vector<Worker> workers`.", "В меню добавляйте рабочего через `workers.push_back(worker)`.", "При удалении проверяйте номер от 1 до `workers.size()`.", "При редактировании не меняйте id."],
    hints: ["Короткий конструктор должен вызывать полный: `: Worker(id, name, ... )`.", "id не должен иметь обычный сеттер.", "Для удаления используйте `workers.erase(workers.begin() + number - 1)`.", "Сначала проверьте добавление и вывод, потом редактирование и удаление."],
    commonMistakes: ["Повторяют одну и ту же инициализацию во всех конструкторах.", "Позволяют менять id при редактировании.", "Удаляют элемент без проверки номера.", "Путают номер пользователя и индекс `vector`."],
    selfCheck: ["Короткие конструкторы делегируют полному.", "id задаётся при создании.", "Меню умеет вывести всех работников.", "Добавление, редактирование и удаление работают.", "Удаление не падает на неверном номере."],
    files: [{ fileName: "practice/big_tasks/task5_2_worker.cpp", description: "Один файл большой задачи Worker.", starterCode: `#include <iostream>
#include <string>
#include <vector>

using namespace std;

class Worker {
private:
    // TODO: id, ФИО, пол, возраст, должность, отдел

public:
    Worker(/* TODO: полный набор */);
    Worker(int id, string fullName);
    void editWithoutId();
    void print() const;
};

int main() {
    vector<Worker> workers;
    // TODO: меню работников
    return 0;
}
` }],
  }),
  singleTask("task6-1-planet-getters-sort", "Задача 6.1: Planet с геттерами и сортировкой", "12. Большие задачи", "hard", "encapsulation", ["getters", "setters", "sort"], "practice/big_tasks/task6_1_planet_getters_sort.cpp", "Закрыть поля `Planet`, добавить геттеры/сеттеры и сортировать по выбранному полю.", {
    description: "Задача закрепляет инкапсуляцию: поля планеты должны быть закрыты, изменение идёт через сеттеры с проверками, а сортировка — через геттеры.",
    whatToCreate: ["класс `Planet`", "private поля планеты", "геттеры для каждого поля", "сеттеры для редактируемых полей", "проверки в сеттерах", "`vector<Planet> planets`", "меню выбора поля сортировки", "сортировку через геттеры"],
    todoGuide: ["Объявите класс `Planet`.", "Добавьте private-поля планеты.", "Для каждого поля добавьте геттер.", "Для редактируемых числовых полей добавьте сеттер с проверкой.", "Добавьте `print() const`.", "В `main` создайте `vector<Planet> planets`.", "Добавьте несколько планет.", "Спросите у пользователя, по какому полю сортировать.", "Для каждого варианта сортировки используйте соответствующий геттер.", "Выведите список после сортировки."],
    steps: ["Опишите private поля.", "Добавьте геттеры `getName`, `getRadius`, `getMass` и другие.", "Добавьте сеттеры с проверками.", "Создайте список планет.", "Спросите у пользователя поле сортировки.", "В зависимости от выбора вызовите `sort` с нужным геттером.", "Выведите отсортированный список."],
    hints: ["Сортировка снаружи не должна обращаться к private-полям.", "Сеттеры не должны пропускать отрицательный радиус или массу.", "Для строкового поля сравнивайте строки через `<`.", "Начните с сортировки по одному полю, затем добавьте остальные варианты."],
    commonMistakes: ["Делают поля public.", "Пишут сеттеры без проверок.", "Сортируют через прямой доступ к полю.", "Не обрабатывают неверный выбор поля сортировки.", "Дублируют одинаковый код вывода вместо метода `print`."],
    selfCheck: ["Все поля закрыты.", "Для каждого поля есть геттер.", "Сеттеры проверяют числовые значения.", "Пользователь может выбрать поле сортировки.", "Сортировка использует геттеры."],
    files: [{ fileName: "practice/big_tasks/task6_1_planet_getters_sort.cpp", description: "Один файл большой задачи Planet.", starterCode: `#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

class Planet {
private:
    // TODO: private поля

public:
    // TODO: геттеры и сеттеры
    void print() const;
};

int main() {
    vector<Planet> planets;
    // TODO: выбор поля сортировки и sort
    return 0;
}
` }],
  }),
  singleTask("task6-2-company", "Задача 6.2: Company", "12. Большие задачи", "hard", "exceptions", ["encapsulation", "exceptions", "vector", "menu"], "practice/big_tasks/task6_2_company.cpp", "Создать `Company` с закрытыми данными, вычисляемыми показателями, ограничениями доступа и исключениями.", {
    description: "Финальная задача объединяет инкапсуляцию, вычисляемые поля, `vector`, меню и исключения. Компания сама решает, какие данные можно показать, а меню должно ловить запреты через `try/catch`.",
    whatToCreate: ["класс `Company`", "редактируемые поля: имя, доходы, расходы", "вычисляемые поля: оборот, чистая прибыль", "тип компании, задаваемый только при создании", "метод пересчёта вычисляемых полей", "геттеры с ограничением доступа", "`throw runtime_error` в геттерах", "`try/catch` в меню", "`vector<Company> companies`", "заранее добавленные компании"],
    todoGuide: ["Объявите класс `Company`.", "Добавьте private-поля: имя, доходы, расходы, оборот, чистая прибыль, тип компании.", "Добавьте приватный метод `recalculate()`.", "В конструкторе задайте тип компании и начальные показатели.", "В сеттерах доходов и расходов вызывайте `recalculate()`.", "В геттерах проверьте правила доступа.", "Если доступ запрещён, выбрасывайте `runtime_error`.", "В `main` создайте `vector<Company> companies`.", "Добавьте несколько компаний заранее.", "Сделайте меню вывода, добавления, редактирования и удаления.", "В местах вывода закрытых данных используйте `try/catch`.", "Проверьте государственную компанию и частную компанию с оборотом меньше 5 миллионов."],
    steps: ["Опишите private поля компании.", "Добавьте конструктор, где задаётся тип компании.", "Добавьте метод `recalculate()` для оборота и чистой прибыли.", "В сеттерах доходов и расходов вызывайте `recalculate()`.", "В геттерах проверяйте правила доступа.", "Если доступ запрещён, выбрасывайте `runtime_error`.", "Создайте `vector<Company>` с несколькими компаниями.", "Сделайте меню вывода, редактирования, добавления и удаления.", "В местах вывода закрытых данных используйте `try/catch`.", "Проверьте государственную компанию и частную компанию с малым оборотом."],
    hints: ["Ограничения доступа должны жить в геттерах, а не только в меню.", "После изменения доходов или расходов чистая прибыль должна пересчитываться.", "`catch (const exception& error)` позволит вывести `error.what()`.", "Тип компании не должен редактироваться после создания.", "Не возвращайте `0`, если доступ запрещён: это выглядит как настоящие данные."],
    commonMistakes: ["Возвращают `0` вместо исключения.", "Забывают пересчитать прибыль после сеттера.", "Разрешают менять тип компании после создания.", "Не обрабатывают исключение в меню.", "Проверяют доступ только перед выводом, но оставляют геттеры открытыми.", "Удаляют компанию из `vector` без проверки номера."],
    selfCheck: ["Государственная компания скрывает доходы, расходы и прибыль.", "Частная компания с оборотом меньше 5 миллионов скрывает все данные кроме имени.", "После изменения доходов/расходов вычисляемые поля обновляются.", "Меню не падает при запрете доступа.", "Тип компании задаётся только при создании.", "В списке есть заранее добавленные компании."],
    files: [{ fileName: "practice/big_tasks/task6_2_company.cpp", description: "Один файл большой задачи Company.", starterCode: `#include <exception>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

using namespace std;

class Company {
private:
    // TODO: имя, доходы, расходы, оборот, чистая прибыль, тип компании

    void recalculate();

public:
    Company(/* TODO: параметры создания */);
    // TODO: сеттеры, геттеры с проверками, print
};

int main() {
    vector<Company> companies;
    // TODO: заранее добавить компании и сделать меню с try/catch
    return 0;
}
` }],
  }),
];
