import { GoogleGenerativeAI } from "@google/generative-ai";
import { GOOGLE_AI_MODEL } from "@/lib/ai/config";

export class AiGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiGenerationError";
  }
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return trimmed;
}

export async function generateStructuredJson<T>(
  prompt: string,
  options?: {
    fallback?: T;
    retries?: number;
  }
): Promise<{ data: T; source: "google_ai" | "deterministic_fallback" }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const retries = options?.retries ?? 1;

  if (!apiKey) {
    if (options?.fallback === undefined) {
      throw new AiGenerationError("GOOGLE_AI_API_KEY is not configured.");
    }
    return { data: options.fallback, source: "deterministic_fallback" };
  }

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: GOOGLE_AI_MODEL,
    generationConfig: {
      temperature: 0.25,
      responseMimeType: "application/json"
    }
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const result = await model.generateContent(
        attempt === 0 ? prompt : `${prompt}\n\nYour previous response was invalid JSON. Return ONLY valid JSON.`
      );
      const text = result.response.text();
      const data = JSON.parse(extractJson(text)) as T;
      return { data, source: "google_ai" };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("AI generation failed.");
    }
  }

  if (options?.fallback !== undefined) {
    return { data: options.fallback, source: "deterministic_fallback" };
  }

  throw new AiGenerationError(lastError?.message ?? "AI returned invalid JSON.");
}
