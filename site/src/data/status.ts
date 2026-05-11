export type ContentStatus = "available" | "soon" | "draft" | "needs-theory" | "ready";

export type StatusTone = "success" | "warning" | "muted" | "info";

export type StatusMeta = {
  label: string;
  description: string;
  tone: StatusTone;
};

export const statusMeta: Record<ContentStatus, StatusMeta> = {
  available: {
    label: "Доступно",
    description: "Материал открыт для прохождения.",
    tone: "success",
  },
  ready: {
    label: "Готово",
    description: "Материал доведён до рабочего качества.",
    tone: "success",
  },
  soon: {
    label: "Скоро",
    description: "Материал появится позже.",
    tone: "info",
  },
  draft: {
    label: "Черновик",
    description: "Материал пока не готов для прохождения.",
    tone: "muted",
  },
  "needs-theory": {
    label: "Теория на доработке",
    description: "Практика есть, но объяснение темы пока закрыто.",
    tone: "warning",
  },
};

export function getStatusLabel(status: ContentStatus) {
  return statusMeta[status].label;
}

export function getStatusTone(status: ContentStatus) {
  return statusMeta[status].tone;
}
