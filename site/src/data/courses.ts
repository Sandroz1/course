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
    description:
      "Будущий курс перед ООП: переменные, ввод и вывод, условия, циклы, функции, массивы и строки.",
    status: "soon",
    order: 1,
    path: "/courses/base-cpp",
    sections: [],
  },
  {
    id: "oop-cpp",
    title: "ООП C++",
    shortTitle: "ООП C++",
    description:
      "Доступный курс: от подготовки к C++ до структур, классов, конструкторов и this.",
    status: "available",
    order: 2,
    path: "/course",
    sections: oopCppSectionSlugs,
  },
];

export function getCourseById(courseId: CourseId) {
  return courses.find((course) => course.id === courseId);
}

export function getAvailableCourses() {
  return courses.filter((course) => course.status === "available");
}
