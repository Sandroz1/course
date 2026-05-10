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

export function getProgress() {
  return apiRequest<ProgressOverview>("/api/progress/");
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
