export type ApiErrorPayload = {
  detail?: string;
  error?: string;
  fields?: Record<string, string[]>;
  message?: string;
  retryAfter?: number;
  retry_after?: number;
  retryAfterSeconds?: number;
  usage?: AiUsage;
  [key: string]: unknown;
};

export type AiUsage = {
  limit: number;
  remaining: number;
  used?: number;
  resetAt?: string;
  retryAfterSeconds?: number;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
};

export type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  skipAuthRefresh?: boolean;
};

export type AiChatRole = "user" | "assistant";

export type AiChatMessage = {
  role: AiChatRole;
  content: string;
};

export type AiChatRequest = {
  question: string;
  selectedText?: string;
  history?: AiChatMessage[];
};

export type AiChatResponse = {
  answer: string;
  remainingRequests?: number;
  usage?: AiUsage;
};

export type AuthUser = {
  id: number;
  username: string;
  phone: string | null;
  is_phone_verified: boolean;
};

export type AuthTokens = {
  access: string;
};

export type AuthResponse = Partial<AuthTokens> & {
  access_token?: string;
  refresh_token?: string;
  tokens?: Partial<AuthTokens> & {
    refresh?: string;
  };
  user?: AuthUser;
};

export type RegisterRequest = {
  username: string;
  password: string;
  password2: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type PhoneSendCodeRequest = {
  phone: string;
};

export type PhoneVerifyRequest = {
  phone: string;
  code: string;
};

export type PhoneVerifyResponse = {
  message: string;
  user: AuthUser;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  newPassword2: string;
};

export type MessageResponse = {
  message: string;
};

export type LessonProgress = {
  course_slug: string;
  lesson_slug: string;
  is_completed: boolean;
  last_opened_at: string | null;
  updated_at: string;
};

export type TaskProgressStatus = "not_started" | "in_progress" | "solved";

export type TaskProgress = {
  task_id: string;
  status: TaskProgressStatus;
  updated_at: string;
};

export type UserStudyState = {
  last_course_slug: string;
  last_lesson_slug: string;
  updated_at: string;
};

export type ProgressOverview = {
  state: UserStudyState | null;
  lessons: LessonProgress[];
  tasks: TaskProgress[];
};

export type StudyStateUpdateRequest = {
  last_course_slug?: string;
  last_lesson_slug?: string;
};

export type LessonProgressUpdateRequest = {
  course_slug: string;
  lesson_slug: string;
  is_completed?: boolean;
  last_opened_at?: string | null;
};

export type TaskProgressUpdateRequest = {
  task_id: string;
  status?: TaskProgressStatus;
};

export type CheckerAvailabilityReason =
  | "not_supported"
  | "runner_unavailable"
  | "temporarily_disabled";

export type CheckerPublicTest = {
  input: string;
  expected_output: string;
  weight: number;
  explanation: string;
  position: number;
};

export type CheckerAvailability = {
  task_id: string;
  available: boolean;
  reason?: CheckerAvailabilityReason | null;
  task_version?: number;
  language?: "cpp17";
  limits?: {
    source_bytes: number;
    run_timeout_ms: number;
  };
  public_tests?: CheckerPublicTest[];
};

export type CheckerAttemptStatus = "draft" | "in_progress" | "passed" | "archived";

export type CheckerAttempt = {
  id: string;
  task_id: string;
  task_version: number;
  course_slug: string;
  lesson_slug: string;
  status: CheckerAttemptStatus;
  code_snapshot: string;
  note: string;
  result_summary: Record<string, unknown>;
  submission_ids: string[];
  created_at: string;
  updated_at: string;
};

export type CheckerAttemptPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CheckerAttempt[];
};

export type CheckerDraftRequest = {
  task_version: number;
  source_code: string;
  note?: string;
};

export type CheckerSubmissionRequest = {
  task_version: number;
  source_code: string;
};

export type CheckerSubmission = {
  id: string;
  task_id: string;
  task_version: number;
  language: "cpp17";
  status:
    | "queued"
    | "compiling"
    | "running"
    | "passed"
    | "failed"
    | "compiler_error"
    | "runtime_error"
    | "timeout"
    | "output_limit"
    | "system_error"
    | "cancelled";
  compiler_output: string;
  runtime_output: string;
  passed_tests: number;
  failed_tests: number;
  total_tests: number;
  execution_time_ms: number | null;
  memory_used_kb: number | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};
