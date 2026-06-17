import type { ResearchScope } from "@/lib/types";

export const QUESTION_META_KEY = "_questionMeta";

export type QuestionSource = "client" | "ai_follow_up";

export type QuestionMeta = {
  sortOrder: number;
  source: QuestionSource;
  status: "active" | "archived";
};

export function scopeWithQuestionMeta(scope: ResearchScope, meta: QuestionMeta): Record<string, unknown> {
  return { ...scope, [QUESTION_META_KEY]: meta };
}

export function parseResearchScope(value: unknown): ResearchScope | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = { ...(value as Record<string, unknown>) };
  delete record[QUESTION_META_KEY];
  return record as ResearchScope;
}

export function parseQuestionMeta(value: unknown, fallbackIndex = 0): QuestionMeta {
  if (!value || typeof value !== "object") {
    return { sortOrder: fallbackIndex, source: "client", status: "active" };
  }

  const record = value as Record<string, unknown>;
  const meta = record[QUESTION_META_KEY];

  if (!meta || typeof meta !== "object") {
    return { sortOrder: fallbackIndex, source: "client", status: "active" };
  }

  const parsed = meta as Record<string, unknown>;

  return {
    sortOrder: typeof parsed.sortOrder === "number" ? parsed.sortOrder : fallbackIndex,
    source: parsed.source === "ai_follow_up" ? "ai_follow_up" : "client",
    status: parsed.status === "archived" ? "archived" : "active"
  };
}
