import {
  getCourseSectionBySlug,
  isCourseSectionReady,
} from "../data/courseSections";
import { getStatusLabel } from "../data/status";
import type { Task, TaskLevel } from "../data/tasks";
import type { TaskProgressStatus } from "../types/api";

export type TaskDisplayStatus = "available" | "needs-theory" | "in_progress" | "solved";

export const visibleTaskTopicLimit = 3;

const genericSingleFilePlan = [
  "Откройте заготовку в блоке рабочего файла на странице задачи.",
  "Найдите TODO и прочитайте условие рядом с задачей.",
  "Напишите минимальный рабочий вариант, не пытаясь сразу сделать красиво.",
  "Скомпилируйте файл отдельно как C++17 программу.",
  "Если есть ошибка компилятора, исправляйте первую ошибку сверху, затем запускайте снова.",
];

const genericMultiFilePlan = [
  "Откройте все файлы задачи.",
  "В .hpp оставьте объявление класса: поля и заголовки методов.",
  "В .cpp подключите .hpp и реализуйте методы через ClassName::methodName.",
  "В main.cpp создайте объект и вызовите методы для проверки.",
  "При сборке компилируйте main.cpp вместе с файлом реализации .cpp.",
];

export const taskLevelLabels: Record<TaskLevel, string> = {
  easy: "базовая",
  medium: "средняя",
  hard: "сложная",
};

export function fileCountLabel(count: number) {
  if (count === 1) return "1 файл";
  if (count >= 2 && count <= 4) return `${count} файла`;
  return `${count} файлов`;
}

export function taskCountLabel(count: number) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${count} задач`;
  if (lastDigit === 1) return `${count} задача`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} задачи`;

  return `${count} задач`;
}

export function isTaskTheoryClosed(task: Task) {
  const theory = getCourseSectionBySlug(task.courseId, task.theorySlug);

  return task.status === "needs-theory" || (theory ? !isCourseSectionReady(theory) : false);
}

export function getTaskDisplayStatus(
  task: Task,
  taskProgressById?: Map<string, TaskProgressStatus>,
): TaskDisplayStatus {
  const progressStatus = taskProgressById?.get(task.id);

  if (progressStatus === "solved") return "solved";
  if (progressStatus === "in_progress") return "in_progress";
  if (isTaskTheoryClosed(task)) return "needs-theory";

  return "available";
}

export function getTaskDisplayLabel(status: TaskDisplayStatus) {
  if (status === "solved") return "Пройдено";
  if (status === "in_progress") return "В работе";
  if (status === "needs-theory") return getStatusLabel("needs-theory");

  return getStatusLabel("available");
}

export function getTaskDisplayTone(status: TaskDisplayStatus): "success" | "info" | "warning" {
  if (status === "solved") return "success";
  if (status === "in_progress") return "info";
  if (status === "needs-theory") return "warning";

  return "success";
}

function samePlan(first: string[], second: string[]) {
  return first.length === second.length && first.every((item, index) => item === second[index]);
}

export function isGenericTaskPlan(steps: string[]) {
  return samePlan(steps, genericSingleFilePlan) || samePlan(steps, genericMultiFilePlan);
}
