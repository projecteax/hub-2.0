import { generateStructuredJson } from "@/lib/ai/json";
import type { AdaptiveQuestion, ResearchScope } from "@/lib/types";

const PROMPT_VERSION = "adaptive-intake-v1";

const FALLBACK_SEQUENCE: Array<{
  fieldKey: AdaptiveQuestion["fieldKey"];
  question: string;
  helper: string;
  options?: string[];
}> = [
  {
    fieldKey: "businessContext",
    question: "What business decision will this research inform?",
    helper: "Describe the decision, stakeholders, and what changes if you get a clear answer."
  },
  {
    fieldKey: "successCriteria",
    question: "How will you measure whether this research succeeded?",
    helper: "Examples: board-ready recommendation, vendor shortlist, pricing guardrails, segment prioritization."
  },
  {
    fieldKey: "decisionStakes",
    question: "What is the highest-stakes use of the findings?",
    helper: "This helps calibrate depth, panel design, and validation requirements.",
    options: [
      "internal planning",
      "executive readout",
      "board-level decision",
      "client-facing consulting deliverable",
      "regulated or compliance-sensitive use"
    ]
  },
  {
    fieldKey: "audience",
    question: "Who is the primary buyer or user segment you need represented?",
    helper: "Be specific about role, seniority, and function."
  },
  {
    fieldKey: "timeline",
    question: "What decision timeline are you working against?",
    helper: "Examples: next quarter, next 12 months, multi-year transformation."
  }
];

export type AdaptiveAnswer = {
  fieldKey: string;
  questionText: string;
  answerText: string;
};

export type AdaptiveNextResult = {
  isComplete: boolean;
  completionScore: number;
  question: AdaptiveQuestion | null;
  promptVersion: string;
  source: "google_ai" | "deterministic_fallback";
};

function sanitizeOptions(options?: string[]): string[] | undefined {
  const cleaned = (options ?? []).map((option) => option.trim()).filter(Boolean);
  return cleaned.length >= 2 ? cleaned : undefined;
}

function answeredKeys(answers: AdaptiveAnswer[]) {
  return new Set(answers.map((item) => item.fieldKey));
}

function buildFallbackQuestion(answers: AdaptiveAnswer[], scope: ResearchScope): AdaptiveNextResult {
  const answered = answeredKeys(answers);
  const next = FALLBACK_SEQUENCE.find((item) => !answered.has(item.fieldKey));

  if (!next) {
    return {
      isComplete: true,
      completionScore: 100,
      question: null,
      promptVersion: PROMPT_VERSION,
      source: "deterministic_fallback"
    };
  }

  const completionScore = Math.round((answered.size / FALLBACK_SEQUENCE.length) * 100);

  return {
    isComplete: false,
    completionScore,
    question: {
      id: next.fieldKey,
      fieldKey: next.fieldKey,
      question: next.question,
        helper: next.helper,
        options: sanitizeOptions(next.options)
    },
    promptVersion: PROMPT_VERSION,
    source: "deterministic_fallback"
  };
}

export async function generateNextAdaptiveQuestion(input: {
  scope: ResearchScope;
  clientQuestions: string[];
  answers: AdaptiveAnswer[];
}): Promise<AdaptiveNextResult> {
  const answered = answeredKeys(input.answers);

  if (answered.size >= FALLBACK_SEQUENCE.length) {
    return {
      isComplete: true,
      completionScore: 100,
      question: null,
      promptVersion: PROMPT_VERSION,
      source: "deterministic_fallback"
    };
  }

  const fallback = buildFallbackQuestion(input.answers, input.scope);

  const prompt = [
    "You are an expert B2B research intake designer.",
    "Given scope, client questions, and answers so far, return the single best NEXT clarifying question.",
    "Prefer gaps that materially change methodology, panel design, or deliverable format.",
    "Only include options when there are 2 or more concrete multiple-choice answers. Otherwise omit options entirely.",
    `Prompt version: ${PROMPT_VERSION}`,
    "Return JSON only:",
    JSON.stringify({
      isComplete: false,
      completionScore: 75,
      question: {
        id: "string slug",
        fieldKey: "businessContext | successCriteria | competitiveSet | budgetRange | audience | timeline | decisionStakes",
        question: "string",
        helper: "string",
        options: ["optional", "multiple", "choice"]
      }
    }),
    `Scope: ${JSON.stringify(input.scope)}`,
    `Client questions: ${JSON.stringify(input.clientQuestions)}`,
    `Answers so far: ${JSON.stringify(input.answers)}`,
    `Already answered field keys: ${JSON.stringify([...answered])}`
  ].join("\n");

  try {
    const { data, source } = await generateStructuredJson(prompt, {
      fallback: {
        isComplete: fallback.isComplete,
        completionScore: fallback.completionScore,
        question: fallback.question
          ? {
              id: fallback.question.id,
              fieldKey: fallback.question.fieldKey,
              question: fallback.question.question,
              helper: fallback.question.helper,
              options: fallback.question.options
            }
          : null
      }
    });

    const record = data as {
      isComplete?: boolean;
      completionScore?: number;
      question?: {
        id?: string;
        fieldKey?: string;
        question?: string;
        helper?: string;
        options?: string[];
      } | null;
    };

    if (record.isComplete || !record.question?.question || !record.question.fieldKey) {
      return {
        isComplete: true,
        completionScore: 100,
        question: null,
        promptVersion: PROMPT_VERSION,
        source
      };
    }

    if (answered.has(record.question.fieldKey)) {
      return buildFallbackQuestion(input.answers, input.scope);
    }

    return {
      isComplete: false,
      completionScore: Math.min(100, Math.max(0, record.completionScore ?? fallback.completionScore)),
      question: {
        id: record.question.id ?? record.question.fieldKey,
        fieldKey: record.question.fieldKey as AdaptiveQuestion["fieldKey"],
        question: record.question.question,
        helper: record.question.helper ?? "",
        options: sanitizeOptions(record.question.options)
      },
      promptVersion: PROMPT_VERSION,
      source
    };
  } catch {
    return buildFallbackQuestion(input.answers, input.scope);
  }
}
