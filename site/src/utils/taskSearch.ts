import type { Task } from "../data/tasks";

export function getTaskSearchText(task: Task, courseTitle = "") {
  return [
    task.title,
    task.section,
    courseTitle,
    task.topics.join(" "),
    task.files.map((file) => file.fileName).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}
