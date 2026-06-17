import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildDeterministicBrief } from "@/lib/ai/brief-fallback";
import { GOOGLE_AI_MODEL } from "@/lib/ai/config";
import { normalizeResearchBrief } from "@/lib/ai/normalize";
import { researchBriefSchema, type GenerateResearchInput } from "@/lib/ai/schemas";

const PROMPT_VERSION = "brief-generator-v2";

export { buildDeterministicBrief };

export async function generateResearchBrief(input: GenerateResearchInput) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return {
      brief: buildDeterministicBrief(input),
      source: "deterministic_fallback" as const,
      promptVersion: PROMPT_VERSION
    };
  }

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: GOOGLE_AI_MODEL,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  });

  const prompt = [
    "You are designing a self-serve B2B research brief.",
    "Return only valid JSON with this exact shape:",
    JSON.stringify({
      title: "string",
      objective: "string",
      canonicalQuestion: "string",
      questionFingerprint: "string",
      scope: input.scope,
      keyQuestions: ["string", "string", "string"],
      methodology: {
        panelType: "string",
        segments: ["string", "string"],
        confidencePolicy: "string"
      },
      outputPlan: ["string", "string", "string"]
    }),
    "Rules:",
    "- keyQuestions and outputPlan MUST be arrays of plain strings, not objects.",
    "- methodology must include panelType, segments, and confidencePolicy as strings/arrays.",
    "- Never claim output is human verified.",
    `Prompt version: ${PROMPT_VERSION}`,
    "If multiple client questions are provided, synthesize one canonical question and keyQuestions that cover the full decision.",
    `Input: ${JSON.stringify(input)}`
  ].join("\n");

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const raw = JSON.parse(text) as unknown;
  const normalized = normalizeResearchBrief(raw, input);
  const parsed = researchBriefSchema.parse(normalized);

  return {
    brief: parsed,
    source: "google_ai" as const,
    promptVersion: PROMPT_VERSION
  };
}
