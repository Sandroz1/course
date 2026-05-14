import type { ProgressOverview, TaskProgressStatus } from "../../types/api";

export function getLessonProgressKey(courseSlug: string, lessonSlug: string) {
  return `${courseSlug}:${lessonSlug}`;
}

export function getCompletedLessonKeys(progress: ProgressOverview) {
  return new Set(
    progress.lessons
      .filter((lesson) => lesson.is_completed)
      .map((lesson) => getLessonProgressKey(lesson.course_slug, lesson.lesson_slug)),
  );
}

export function getTaskProgressById(progress: ProgressOverview | null) {
  const taskProgressById = new Map<string, TaskProgressStatus>();

  progress?.tasks.forEach((taskProgress) => {
    taskProgressById.set(taskProgress.task_id, taskProgress.status);
  });

  return taskProgressById;
}
