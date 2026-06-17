import type { GenerateResearchInput } from "@/lib/ai/schemas";
import { buildDeterministicBrief } from "@/lib/ai/brief-fallback";

function coerceString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of ["question", "title", "label", "name", "text", "description", "item", "output"]) {
      if (typeof record[key] === "string") {
        return record[key].trim();
      }
    }
  }

  return "";
}

function coerceStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(coerceString).filter(Boolean);
}

function normalizeMethodology(raw: unknown, input: GenerateResearchInput) {
  const fallback = buildDeterministicBrief(input).methodology;
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const segments = coerceStringList(record.segments ?? record.target_segments ?? record.audience_segments);

  return {
    panelSize: typeof record.panelSize === "number" ? record.panelSize : undefined,
    panelType:
      coerceString(record.panelType ?? record.panel_type ?? record.approach ?? record.type) || fallback.panelType,
    segments: segments.length > 0 ? segments.slice(0, 6) : fallback.segments,
    confidencePolicy:
      coerceString(record.confidencePolicy ?? record.confidence_policy ?? record.policy ?? record.guardrails) ||
      fallback.confidencePolicy
  };
}

export function normalizeResearchBrief(raw: unknown, input: GenerateResearchInput) {
  const fallback = buildDeterministicBrief(input);
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const keyQuestions = coerceStringList(record.keyQuestions ?? record.key_questions);
  const outputPlan = coerceStringList(record.outputPlan ?? record.output_plan ?? record.deliverables);

  return {
    title: coerceString(record.title) || fallback.title,
    objective: coerceString(record.objective ?? record.goal) || fallback.objective,
    canonicalQuestion:
      coerceString(record.canonicalQuestion ?? record.canonical_question) || fallback.canonicalQuestion,
    questionFingerprint:
      coerceString(record.questionFingerprint ?? record.question_fingerprint) || fallback.questionFingerprint,
    scope: {
      ...input.scope,
      ...(record.scope && typeof record.scope === "object" ? (record.scope as Record<string, string>) : {})
    },
    keyQuestions: keyQuestions.length >= 3 ? keyQuestions.slice(0, 6) : fallback.keyQuestions,
    methodology: normalizeMethodology(record.methodology, input),
    outputPlan: outputPlan.length >= 3 ? outputPlan.slice(0, 8) : fallback.outputPlan
  };
}
