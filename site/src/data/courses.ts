import type { ContentStatus } from "./status";

export type CourseId = "base-cpp" | "oop-cpp";
export type CourseStatus = Extract<ContentStatus, "available" | "soon" | "draft">;

export type Course = {
  id: CourseId;
  title: string;
  shortTitle: string;
  description: string;
  status: CourseStatus;
  order: number;
  path: string;
  sections?: string[];
};

export const baseCppSectionSlugs = ["intro-tools", "algorithms"];

export const oopCppSectionSlugs = [
  "basics",
  "oop",
  "struct",
  "classes",
  "constructors-destructors",
  "this",
  "multifile-project",
  "preprocessor",
  "initializer-list",
  "vector",
  "delegating-constructors",
  "encapsulation",
  "exceptions",
];

export const courses: Course[] = [
  {
    id: "base-cpp",
    title: "База C++",
    shortTitle: "База C++",
    description: "Основы C++ перед ООП: алгоритмы, переменные, условия, циклы, функции, массивы, указатели, строки и файлы.",
    status: "soon",
    order: 1,
    path: "/courses/base-cpp",
    sections: baseCppSectionSlugs,
  },
  {
    id: "oop-cpp",
    title: "ООП C++",
    shortTitle: "ООП C++",
    description: "Структуры, классы, конструкторы, this и практика.",
    status: "available",
    order: 2,
    path: "/courses/oop-cpp",
    sections: oopCppSectionSlugs,
  },
];

export function getCourseById(courseId: CourseId) {
  return courses.find((course) => course.id === courseId);
}

export function getAvailableCourses() {
  return courses.filter((course) => course.status === "available");
}
