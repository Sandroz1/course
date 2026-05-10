export type ApiErrorPayload = {
  detail?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
};

export type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
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
