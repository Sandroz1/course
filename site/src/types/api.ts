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
  refresh: string;
};

export type AuthResponse = Partial<AuthTokens> & {
  access_token?: string;
  refresh_token?: string;
  tokens?: Partial<AuthTokens>;
  user?: AuthUser;
};

export type RegisterRequest = {
  username: string;
  phone: string;
  password: string;
  password2: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type ProfileUpdateRequest = {
  phone: string;
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
