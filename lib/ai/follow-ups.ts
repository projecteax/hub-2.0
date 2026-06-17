import { generateStructuredJson } from "@/lib/ai/json";
import type { AdaptiveAnswer } from "@/lib/ai/adaptive";
import type { ResearchScope } from "@/lib/types";
import { stableHash } from "@/lib/utils";

const PROMPT_VERSION = "follow-up-suggestions-v1";

export type FollowUpSuggestion = {
  id: string;
  question: string;
  rationale: string;
  status: "pending" | "accepted" | "edited" | "dismissed";
  editedQuestion?: string;
};

function buildFallbackSuggestions(clientQuestions: string[], scope: ResearchScope): FollowUpSuggestion[] {
  const base = clientQuestions[0] ?? scope.market;

  return [
    {
      id: stableHash(`${base}-segment`),
      question: `How do findings for ${base} differ by ${scope.companySize} organizations in ${scope.geography}?`,
      rationale: "Segment cuts are standard in executive research readouts.",
      status: "pending"
    },
    {
      id: stableHash(`${base}-drivers`),
      question: `Which adoption drivers and blockers matter most for ${scope.audience}?`,
      rationale: "Driver analysis clarifies where to invest next.",
      status: "pending"
    },
    {
      id: stableHash(`${base}-validation`),
      question: "Which claims should be validated with human experts before external use?",
      rationale: "Validation scoping reduces reputational risk on high-stakes decisions.",
      status: "pending"
    }
  ];
}

export async function generateFollowUpSuggestions(input: {
  scope: ResearchScope;
  clientQuestions: string[];
  adaptiveAnswers: AdaptiveAnswer[];
}): Promise<{ suggestions: FollowUpSuggestion[]; promptVersion: string; source: "google_ai" | "deterministic_fallback" }> {
  const fallback = buildFallbackSuggestions(input.clientQuestions, input.scope);

  const prompt = [
    "You are a B2B research strategist.",
    "Propose 3-5 high-value follow-up research questions the client may want to add.",
    "Each must be distinct from existing client questions and grounded in the scope.",
    "Return JSON only:",
    JSON.stringify({
      suggestions: [{ question: "string", rationale: "string" }]
    }),
    `Prompt version: ${PROMPT_VERSION}`,
    `Scope: ${JSON.stringify(input.scope)}`,
    `Client questions: ${JSON.stringify(input.clientQuestions)}`,
    `Adaptive answers: ${JSON.stringify(input.adaptiveAnswers)}`
  ].join("\n");

  try {
    const { data, source } = await generateStructuredJson(prompt, {
      fallback: { suggestions: fallback.map(({ question, rationale }) => ({ question, rationale })) }
    });
    const record = data as { suggestions?: Array<{ question?: string; rationale?: string }> };

    const suggestions: FollowUpSuggestion[] = (record.suggestions ?? [])
      .map((item) => ({
        id: stableHash(item.question ?? ""),
        question: (item.question ?? "").trim(),
        rationale: (item.rationale ?? "").trim(),
        status: "pending" as const
      }))
      .filter((item) => item.question.length > 10)
      .slice(0, 5);

    return {
      suggestions: suggestions.length > 0 ? suggestions : fallback,
      promptVersion: PROMPT_VERSION,
      source
    };
  } catch {
    return { suggestions: fallback, promptVersion: PROMPT_VERSION, source: "deterministic_fallback" };
  }
}
