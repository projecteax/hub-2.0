import { generateStructuredJson } from "@/lib/ai/json";
import { normalizeResearchBrief } from "@/lib/ai/normalize";
import { researchBriefSchema } from "@/lib/ai/schemas";
import type { ResearchBrief } from "@/lib/types";

const PROMPT_VERSION = "brief-editor-v1";

export async function refineResearchBriefWithAi(input: {
  brief: ResearchBrief;
  instruction: string;
  questions: string[];
}) {
  const prompt = [
    "You are editing a B2B research brief for a self-serve research platform.",
    "Apply the user's instruction while preserving valid structure.",
    "Return only valid JSON matching the ResearchBrief shape.",
    "keyQuestions and outputPlan MUST be arrays of plain strings.",
    `Prompt version: ${PROMPT_VERSION}`,
    `Instruction: ${input.instruction}`,
    `Current brief: ${JSON.stringify(input.brief)}`,
    `Project questions: ${JSON.stringify(input.questions)}`
  ].join("\n");

  const { data, source } = await generateStructuredJson(prompt, { fallback: input.brief });

  const normalized = normalizeResearchBrief(data, {
    question: input.questions[0] ?? input.brief.canonicalQuestion,
    questions: input.questions,
    scope: input.brief.scope
  });

  const parsed = researchBriefSchema.parse({
    ...normalized,
    questionFingerprint: input.brief.questionFingerprint
  });

  return { brief: parsed, source, promptVersion: PROMPT_VERSION };
}
