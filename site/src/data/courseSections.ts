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
import { delegatingConstructorsContent } from "../content/course/delegatingConstructors";
import { encapsulationContent } from "../content/course/encapsulation";
import { exceptionsContent } from "../content/course/exceptions";

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
    topics: ["hpp", "cpp", "include", "::"],
    status: "needs-theory",
    content: multifileProjectContent,
    relatedTaskIds: ["05-01-book-multifile", "05-02-bed-training", "task4-1-bed-one-file", "task4-2-bed-multifile", "task4-3-bed-include-guard"],
  },
  {
    slug: "preprocessor",
    number: "7",
    title: "Препроцессор",
    description: "Разберёшь, как подключаются библиотеки и свои заголовочные файлы, а также зачем нужны защиты от повторного подключения.",
    topics: ["include", "pragma once", "ifndef"],
    status: "needs-theory",
    content: preprocessorContent,
    relatedTaskIds: ["06-01-include-guard-book", "06-02-include-guard-car", "06-03-bed-include-guard", "task4-3-bed-include-guard"],
  },
  {
    slug: "initializer-list",
    number: "8",
    title: "Список инициализации",
    description: "Поймёшь, как задавать значения полям сразу при создании объекта и чем список инициализации отличается от присваивания в теле конструктора.",
    topics: ["initializer list", "constructor", "Plate"],
    status: "needs-theory",
    content: initializerListContent,
    relatedTaskIds: ["07-01-cup-initializer-list", "07-02-plate-default-constructor", "07-03-plate-full-constructor", "07-04-plate-vector-menu", "task5-1-plate"],
  },
  {
    slug: "vector",
    number: "9",
    title: "std::vector",
    description: "Научишься хранить список элементов, добавлять и удалять данные, проверять размер списка и использовать индексы в меню.",
    topics: ["vector", "push_back", "erase", "size", "empty"],
    status: "needs-theory",
    content: vectorContent,
    relatedTaskIds: ["08-01-vector-int-push-back", "08-02-vector-print-by-index", "08-03-vector-delete-by-number", "08-04-vector-empty-check", "08-05-vector-objects", "08-06-vector-sort", "08-07-vector-menu", "task5-2-worker"],
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

export const courseSections: CourseSection[] = oopCourseSections.map((section) => ({
  ...section,
  courseId: "oop-cpp",
}));

export function isCourseSectionReady(section: CourseSection) {
  return section.status === "available" || section.status === "ready";
}
