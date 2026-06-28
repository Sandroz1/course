import type {
  CheckerAttempt,
  CheckerAttemptPage,
  CheckerAvailability,
  CheckerDraftRequest,
  CheckerSubmission,
  CheckerSubmissionRequest,
} from "../types/api";
import { ApiError, apiRequest } from "./api";

export type CheckerErrorKind =
  | "auth_required"
  | "stale_version"
  | "source_too_large"
  | "checker_unavailable"
  | "request_failed";

function checkerTaskPath(taskId: string) {
  return `/checker/tasks/${encodeURIComponent(taskId)}`;
}

export function getCheckerErrorKind(error: unknown): CheckerErrorKind {
  if (!(error instanceof ApiError)) return "request_failed";
  if (error.status === 401) return "auth_required";
  if (error.status === 409) return "stale_version";
  if (error.status === 413) return "source_too_large";
  if (error.status === 503) return "checker_unavailable";
  return "request_failed";
}

export function getCheckerAvailability(taskId: string, signal?: AbortSignal) {
  return apiRequest<CheckerAvailability>(`${checkerTaskPath(taskId)}/availability/`, {
    signal,
    skipAuthRefresh: true,
  });
}

export function getCheckerAttempts(taskId: string, signal?: AbortSignal) {
  return apiRequest<CheckerAttemptPage>(`${checkerTaskPath(taskId)}/attempts/`, { signal });
}

export function saveCheckerDraft(taskId: string, payload: CheckerDraftRequest) {
  return apiRequest<CheckerAttempt>(`${checkerTaskPath(taskId)}/attempt/`, {
    method: "PUT",
    body: payload,
  });
}

export function createCheckerSubmission(attemptId: string, payload: CheckerSubmissionRequest) {
  return apiRequest<CheckerSubmission>(
    `/checker/attempts/${encodeURIComponent(attemptId)}/submissions/`,
    {
      method: "POST",
      body: payload,
    },
  );
}
