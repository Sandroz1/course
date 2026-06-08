import type { CourseId } from "./courses";
import type { ContentStatus } from "./status";

export type CourseSection = {
  courseId: CourseId;
  slug: string;
  number: string;
  title: string;
  description: string;
  topics: string[];
  status: ContentStatus;
  content: string;
  relatedTaskIds: string[];
};

import { algorithmsContent } from "../content/baseCpp/algorithms";
import { conditionsContent } from "../content/baseCpp/conditions";
import { doWhileLoopContent } from "../content/baseCpp/doWhileLoop";
import { forLoopContent } from "../content/baseCpp/forLoop";
import { introToolsContent } from "../content/baseCpp/introTools";
import { loopAccumulationContent } from "../content/baseCpp/loopAccumulation";
import { switchCaseContent } from "../content/baseCpp/switchCase";
import { ternaryOperatorContent } from "../content/baseCpp/ternaryOperator";
import { whileLoopContent } from "../content/baseCpp/whileLoop";
import { basicsContent } from "../content/course/basics";
import { oopContent } from "../content/course/oop";
import { structsContent } from "../content/course/structs";
import { classesContent } from "../content/course/classes";
import { constructorsDestructorsContent } from "../content/course/constructorsDestructors";
import { thisKeywordContent } from "../content/course/thisKeyword";
import { multifileProjectContent } from "../content/course/multifileProject";
import { preprocessorContent } from "../content/course/preprocessor";
import { initializerListContent } from "../content/course/initializerList";
import { vectorContent } from "../content/course/vector";
import { unaryOperatorOverloadingContent } from "../content/course/unaryOperatorOverloading";
import { inheritanceContent } from "../content/course/inheritance";
import { virtualMethodsContent } from "../content/course/virtualMethods";
import { delegatingConstructorsContent } from "../content/course/delegatingConstructors";
import { encapsulationContent } from "../content/course/encapsulation";
import { exceptionsContent } from "../content/course/exceptions";

const baseCppCourseSections: Array<Omit<CourseSection, "courseId">> = [
  {
    slug: "intro-tools",
    number: "0",
    title: "Введение и инструменты",
    description: "Разберёшься, как учиться программированию, зачем нужны IDE, компилятор, проект и файл `main.cpp`, а также как спокойно работать с задачей и ошибками.",
    topics: ["learning", "IDE", "compiler", "project", "main.cpp", "algorithm"],
    status: "needs-theory",
    content: introToolsContent,
    relatedTaskIds: [],
  },
  {
    slug: "algorithms",
    number: "1",
    title: "Алгоритмы",
    description: "Поймёшь, что такое алгоритм, исполнитель и результат, как записывать шаги обычным текстом, псевдокодом и блок-схемой, а также как находить выбор и повторение до написания кода.",
    topics: ["algorithm", "executor", "pseudocode", "flowchart", "branching", "cycle"],
    status: "needs-theory",
    content: algorithmsContent,
    relatedTaskIds: [],
  },
  {
    slug: "first-program",
    number: "2",
    title: "Первая программа C++",
    description: "Минимальный каркас программы, вывод в консоль и первые синтаксические правила. Теория будет добавлена позже.",
    topics: ["main", "iostream", "cout", "return 0"],
    status: "needs-theory",
    content: "",
    relatedTaskIds: [],
  },
  {
    slug: "variables",
    number: "3",
    title: "Переменные, типы и операции",
    description: "Значения, базовые типы данных и простые вычисления. Теория будет добавлена позже.",
    topics: ["variables", "types", "int", "double", "operators"],
    status: "needs-theory",
    content: "",
    relatedTaskIds: [],
  },
  {
    slug: "input-output",
    number: "4",
    title: "Ввод и вывод",
    description: "Чтение данных с клавиатуры и вывод результата в консоль. Теория будет добавлена позже.",
    topics: ["cin", "cout", "input", "output"],
    status: "needs-theory",
    content: "",
    relatedTaskIds: [],
  },
  {
    slug: "conditions",
    number: "5",
    title: "Условный оператор if/else",
    description: "Разберёшь, зачем программе условия, как работают `if`, `else` и `else if`, как сравнивать числа и какие ошибки чаще всего встречаются в первых условных конструкциях.",
    topics: ["if", "else", "else if", "true", "false", "comparison"],
    status: "available",
    content: conditionsContent,
    relatedTaskIds: [],
  },
  {
    slug: "ternary-operator",
    number: "6",
    title: "Тернарный оператор",
    description: "Поймёшь, как коротко выбрать одно из двух значений через `условие ? значение_если_истина : значение_если_ложь`, когда такая запись уместна и когда лучше оставить обычный `if/else`.",
    topics: ["ternary operator", "condition", "value selection", "if else"],
    status: "available",
    content: ternaryOperatorContent,
    relatedTaskIds: [],
  },
  {
    slug: "switch-case",
    number: "7",
    title: "switch/case",
    description: "Разберёшь, как выбирать один вариант из нескольких конкретных значений через `switch`, `case`, `break` и `default`, и когда такая запись удобнее цепочки `if/else`.",
    topics: ["switch", "case", "break", "default", "menu"],
    status: "available",
    content: switchCaseContent,
    relatedTaskIds: [],
  },
  {
    slug: "for-loop",
    number: "8",
    title: "Цикл for",
    description: "Разберёшь, зачем нужны циклы, как устроен `for`, что такое счётчик, условие продолжения и шаг, а также как выводить диапазоны чисел и повторять действия заданное количество раз.",
    topics: ["for", "loop", "counter", "range", "step"],
    status: "available",
    content: forLoopContent,
    relatedTaskIds: [],
  },
  {
    slug: "while-loop",
    number: "9",
    title: "Цикл while",
    description: "Разберёшь, как работает цикл с условием перед телом, когда он удобнее `for`, как вводить данные до стоп-значения и считать сумму с количеством.",
    topics: ["while", "loop", "condition", "sum", "count"],
    status: "available",
    content: whileLoopContent,
    relatedTaskIds: [],
  },
  {
    slug: "do-while-loop",
    number: "10",
    title: "Цикл do while",
    description: "Разберёшь, как работает цикл, который выполняет тело хотя бы один раз, чем он отличается от `while`, где полезен и почему после условия нужна точка с запятой.",
    topics: ["do while", "loop", "condition", "menu", "repeat"],
    status: "available",
    content: doWhileLoopContent,
    relatedTaskIds: [],
  },
  {
    slug: "loop-accumulation",
    number: "11",
    title: "Сумма, количество и min/max в циклах",
    description: "Научишься накапливать сумму, считать количество значений, находить минимум и максимум, выбирать начальные значения и не добавлять стоп-значение в результат.",
    topics: ["sum", "count", "average", "min", "max", "for", "while"],
    status: "available",
    content: loopAccumulationContent,
    relatedTaskIds: [],
  },
];

const oopCourseSections: Array<Omit<CourseSection, "courseId">> = [
  {
    slug: "basics",
    number: "0",
    title: "Подготовка",
    description: "Разберёшь базовый каркас C++ программы: `main`, подключение библиотек, ввод и вывод, типы, условия, циклы, функции и массивы.",
    topics: ["main", "include", "iostream", "cout", "cin", "types", "if", "for"],
    status: "available",
    content: basicsContent,
    relatedTaskIds: ["00-01-minimal-program", "00-02-print-hello", "00-03-input-age", "00-04-if-age", "00-05-for-loop", "00-06-function-square", "00-07-simple-menu"],
  },
  {
    slug: "oop",
    number: "1",
    title: "Что такое ООП",
    description: "Поймёшь, зачем нужен ООП: как находить сущности в задаче, отличать класс от объекта и связывать данные с действиями.",
    topics: ["oop", "class", "object", "field", "method", "state", "behavior"],
    status: "available",
    content: oopContent,
    relatedTaskIds: ["task2-1-person", "task3-1-car", "task3-2-student", "task3-3-planet"],
  },
  {
    slug: "struct",
    number: "2",
    title: "Структуры",
    description: "Научишься собирать связанные данные в одну структуру, создавать объект `Person`, обращаться к его полям через точку и передавать его в функции.",
    topics: ["struct", "field", "object", "const reference"],
    status: "available",
    content: structsContent,
    relatedTaskIds: ["01-01-empty-person-struct", "01-02-person-object", "01-03-print-person-function", "01-04-edit-person-function", "01-05-product-struct", "task2-1-person"],
  },
  {
    slug: "classes",
    number: "3",
    title: "Классы",
    description: "Научишься описывать собственные типы данных: создавать класс, добавлять поля и методы, закрывать данные через `private` и работать с объектами через `public`-методы.",
    topics: ["class", "private", "public", "method"],
    status: "available",
    content: classesContent,
    relatedTaskIds: ["02-01-empty-car-class", "02-02-private-field", "02-03-public-method", "02-04-car-input-print", "02-05-sort-cars-by-year", "task3-1-car"],
  },
  {
    slug: "constructors-destructors",
    number: "4",
    title: "Конструкторы и деструкторы",
    description: "Разберёшь, как объект получает начальные значения через конструктор, чем отличаются конструкторы с параметрами и когда вызывается деструктор.",
    topics: ["constructor", "destructor", "overload"],
    status: "available",
    content: constructorsDestructorsContent,
    relatedTaskIds: ["03-01-default-constructor", "03-02-parameter-constructor", "03-03-constructor-overload", "03-04-destructor-message", "03-05-student-lifecycle", "task3-2-student"],
  },
  {
    slug: "this",
    number: "5",
    title: "this",
    description: "Поймёшь, как метод отличает поля текущего объекта от параметров и зачем в коде появляется запись `this->name = name`.",
    topics: ["this", "setter", "constructor"],
    status: "available",
    content: thisKeywordContent,
    relatedTaskIds: ["04-01-setter-without-this-problem", "04-02-setter-with-this", "04-03-constructor-with-this", "04-04-planet-this", "task3-3-planet"],
  },
  {
    slug: "multifile-project",
    number: "6",
    title: "Многофайловый проект",
    description: "Научишься разделять класс по файлам: объявлять его в `.hpp`, реализовывать методы в `.cpp` и проверять работу в `main.cpp`.",
    topics: ["hpp", "cpp", "include", "ClassName::method"],
    status: "available",
    content: multifileProjectContent,
    relatedTaskIds: ["05-01-book-multifile", "05-02-bed-training", "task4-1-bed-one-file", "task4-2-bed-multifile", "task4-3-bed-include-guard"],
  },
  {
    slug: "preprocessor",
    number: "7",
    title: "Препроцессор",
    description: "Разберёшь, как подключаются библиотеки и свои заголовочные файлы, а также зачем нужны защиты от повторного подключения.",
    topics: ["include", "pragma once", "ifndef"],
    status: "available",
    content: preprocessorContent,
    relatedTaskIds: ["06-01-include-guard-book", "06-02-include-guard-car", "06-03-bed-include-guard", "task4-3-bed-include-guard"],
  },
  {
    slug: "initializer-list",
    number: "8",
    title: "Список инициализации",
    description: "Поймёшь, как задавать значения полям сразу при создании объекта и чем список инициализации отличается от присваивания в теле конструктора.",
    topics: ["initializer list", "constructor", "Plate"],
    status: "available",
    content: initializerListContent,
    relatedTaskIds: ["08-01-plate-constructors", "08-02-plate-store", "task5-1-plate"],
  },
  {
    slug: "vector",
    number: "9",
    title: "std::vector",
    description: "Научишься хранить список элементов, добавлять и удалять данные, проверять размер списка и использовать индексы в меню.",
    topics: ["vector", "push_back", "emplace_back", "erase", "clear", "size", "empty", "pop_back"],
    status: "available",
    content: vectorContent,
    relatedTaskIds: ["09-vector-01-numbers", "09-vector-02-students", "09-vector-03-menu"],
  },
  {
    slug: "unary-operator-overloading",
    number: "9.2",
    title: "Перегрузка унарных операторов",
    description: "Разберёшь, как перегрузить `++`, `--`, унарный `-`, `operator int()` и `operator[]` для учебного динамического массива `MyArray`.",
    topics: ["operator", "unary operator", "operator[]", "operator int", "MyArray"],
    status: "needs-theory",
    content: unaryOperatorOverloadingContent,
    relatedTaskIds: ["09-05-myarray-unary-operators"],
  },
  {
    slug: "inheritance",
    number: "10.1",
    title: "Наследование",
    description: "Разберёшь, как связаны базовый и дочерний классы, зачем писать `public` при наследовании и почему private-поля родителя недоступны напрямую.",
    topics: ["inheritance", "base class", "derived class", "public", "protected", "private"],
    status: "needs-theory",
    content: inheritanceContent,
    relatedTaskIds: ["10-06-body-area-body"],
  },
  {
    slug: "virtual-methods",
    number: "10.2",
    title: "Виртуальные методы",
    description: "Разберёшь, зачем нужен `virtual`, как работает `override` и почему при вызове через указатель на базовый класс выбирается метод настоящего объекта.",
    topics: ["virtual", "override", "base pointer", "polymorphism", "virtual destructor"],
    status: "needs-theory",
    content: virtualMethodsContent,
    relatedTaskIds: ["10-07-old-nouveau-virtual", "10-08-garage-virtual-raw-pointers"],
  },
  {
    slug: "delegating-constructors",
    number: "10",
    title: "Делегирование конструкторов",
    description: "Один конструктор вызывает другой, чтобы не повторять инициализацию.",
    topics: ["delegation", "constructor", "Worker"],
    status: "needs-theory",
    content: delegatingConstructorsContent,
    relatedTaskIds: ["09-01-simple-delegation", "09-02-worker-constructors", "09-03-worker-edit-without-id", "09-04-worker-vector-menu", "task5-2-worker"],
  },
  {
    slug: "encapsulation",
    number: "11",
    title: "Инкапсуляция",
    description: "Научишься закрывать данные внутри класса, давать к ним контролируемый доступ через геттеры и сеттеры и проверять значения перед записью.",
    topics: ["private", "getter", "setter", "explicit"],
    status: "needs-theory",
    content: encapsulationContent,
    relatedTaskIds: ["10-01-private-field-getter", "10-02-setter-validation", "10-03-explicit-constructor", "10-04-planet-getters-setters", "10-05-planet-sort-by-field", "task6-1-planet-getters-sort", "task6-2-company"],
  },
  {
    slug: "exceptions",
    number: "12",
    title: "Исключения",
    description: "Поймёшь, как сообщать об ошибках через исключения, ловить их в нужном месте и показывать понятное сообщение пользователю.",
    topics: ["throw", "try", "catch", "runtime_error"],
    status: "needs-theory",
    content: exceptionsContent,
    relatedTaskIds: ["11-01-throw-runtime-error", "11-02-try-catch", "11-03-getter-with-exception", "11-04-company-hidden-data", "11-05-company-menu", "task6-2-company"],
  },
];

export const courseSections: CourseSection[] = [
  ...baseCppCourseSections.map((section) => ({
    ...section,
    courseId: "base-cpp" as const,
  })),
  ...oopCourseSections.map((section) => ({
    ...section,
    courseId: "oop-cpp" as const,
  })),
];

export function isCourseSectionReady(section: CourseSection) {
  return section.status === "available" || section.status === "ready";
}

export function getCourseSections(courseId: CourseId) {
  return courseSections.filter((section) => section.courseId === courseId);
}

export function getCourseSectionBySlug(courseId: CourseId, slug: string) {
  return courseSections.find((section) => section.courseId === courseId && section.slug === slug);
}

export function getCourseSectionPath(section: CourseSection) {
  return section.courseId === "oop-cpp"
    ? `/course/${section.slug}`
    : `/courses/${section.courseId}/${section.slug}`;
}
