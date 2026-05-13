import { apiRequest } from "./api";
import type {
  LessonProgress,
  LessonProgressUpdateRequest,
  ProgressOverview,
  StudyStateUpdateRequest,
  TaskProgress,
  TaskProgressUpdateRequest,
  UserStudyState,
} from "../types/api";

type CourseProgressCache = {
  authKey: string | null;
  progress: ProgressOverview | null;
  request: Promise<ProgressOverview> | null;
};

const courseProgressCache: CourseProgressCache = {
  authKey: null,
  progress: null,
  request: null,
};

function ensureCourseProgressCache(authKey: string) {
  if (courseProgressCache.authKey === authKey) return;

  courseProgressCache.authKey = authKey;
  courseProgressCache.progress = null;
  courseProgressCache.request = null;
}

function updateCachedCourseProgress(
  authKey: string,
  updater: (progress: ProgressOverview) => ProgressOverview,
) {
  if (courseProgressCache.authKey !== authKey || !courseProgressCache.progress) return;

  courseProgressCache.progress = updater(courseProgressCache.progress);
}

function mergeLessonProgress(
  lessons: LessonProgress[],
  nextLesson: LessonProgress,
  keepCompletedState: boolean,
) {
  const lessonIndex = lessons.findIndex(
    (lesson) =>
      lesson.course_slug === nextLesson.course_slug &&
      lesson.lesson_slug === nextLesson.lesson_slug,
  );

  if (lessonIndex === -1) {
    return [...lessons, nextLesson];
  }

  const currentLesson = lessons[lessonIndex];
  const updatedLesson = keepCompletedState
    ? { ...nextLesson, is_completed: currentLesson.is_completed }
    : nextLesson;
  const nextLessons = [...lessons];
  nextLessons[lessonIndex] = updatedLesson;

  return nextLessons;
}

function mergeTaskProgress(tasks: TaskProgress[], nextTask: TaskProgress) {
  const taskIndex = tasks.findIndex((task) => task.task_id === nextTask.task_id);

  if (taskIndex === -1) {
    return [...tasks, nextTask];
  }

  const nextTasks = [...tasks];
  nextTasks[taskIndex] = nextTask;

  return nextTasks;
}

export function getProgress() {
  return apiRequest<ProgressOverview>("/api/progress/");
}

export function readCachedCourseProgress(authKey: string) {
  if (!authKey || courseProgressCache.authKey !== authKey) return null;

  return courseProgressCache.progress;
}

export function clearCachedCourseProgress() {
  courseProgressCache.authKey = null;
  courseProgressCache.progress = null;
  courseProgressCache.request = null;
}

export function getCachedCourseProgress(authKey: string) {
  ensureCourseProgressCache(authKey);

  if (courseProgressCache.progress) {
    return Promise.resolve(courseProgressCache.progress);
  }

  if (courseProgressCache.request) {
    return courseProgressCache.request;
  }

  const request = getProgress()
    .then((progress) => {
      if (courseProgressCache.authKey === authKey) {
        courseProgressCache.progress = progress;
      }

      return progress;
    })
    .finally(() => {
      if (courseProgressCache.authKey === authKey && courseProgressCache.request === request) {
        courseProgressCache.request = null;
      }
    });

  courseProgressCache.request = request;

  return request;
}

export function setCachedCourseStudyState(authKey: string, state: UserStudyState) {
  updateCachedCourseProgress(authKey, (progress) => ({
    ...progress,
    state,
  }));
}

export function setCachedLessonProgress(authKey: string, lessonProgress: LessonProgress) {
  updateCachedCourseProgress(authKey, (progress) => ({
    ...progress,
    lessons: mergeLessonProgress(progress.lessons, lessonProgress, false),
  }));
}

export function setCachedTaskProgress(authKey: string, taskProgress: TaskProgress) {
  updateCachedCourseProgress(authKey, (progress) => ({
    ...progress,
    tasks: mergeTaskProgress(progress.tasks, taskProgress),
  }));
}

export function updateStudyState(payload: StudyStateUpdateRequest) {
  return apiRequest<UserStudyState>("/api/progress/state/", {
    method: "PATCH",
    body: payload,
  });
}

export function upsertLessonProgress(payload: LessonProgressUpdateRequest) {
  return apiRequest<LessonProgress>("/api/progress/lessons/", {
    method: "POST",
    body: payload,
  });
}

export function upsertTaskProgress(payload: TaskProgressUpdateRequest) {
  return apiRequest<TaskProgress>("/api/progress/tasks/", {
    method: "POST",
    body: payload,
  });
}
