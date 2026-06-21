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

export const baseCppSectionSlugs = [
  "intro-tools",
  "algorithms",
  "first-program",
  "variables",
  "input-output",
  "conditions",
  "ternary-operator",
  "switch-case",
  "for-loop",
  "while-loop",
  "do-while-loop",
  "loop-accumulation",
];

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
  "unary-operator-overloading",
  "inheritance",
  "virtual-methods",
  "encapsulation",
  "exceptions",
];

export const courses: Course[] = [
  {
    id: "base-cpp",
    title: "База C++",
    shortTitle: "База C++",
    description: "Базовый C++ перед ООП: открыты условия, циклы и накопление значений; ранние темы на доработке.",
    status: "available",
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

const coursesById = new Map(courses.map((course) => [course.id, course]));

export function getCourseById(courseId: CourseId) {
  return coursesById.get(courseId);
}

export function getAvailableCourses() {
  return courses.filter((course) => course.status === "available");
}
