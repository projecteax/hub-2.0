import { GoogleGenerativeAI } from "@google/generative-ai";
import { GOOGLE_AI_MODEL } from "@/lib/ai/config";
import type { ResearchBrief } from "@/lib/types";
import type { WebResearchSource } from "@/lib/research/report-types";

const PROMPT_VERSION = "web-research-v2";

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function extractGroundedSources(response: {
  groundingMetadata?: {
    groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
  };
  candidates?: Array<{
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
    };
  }>;
}): WebResearchSource[] {
  const metadata = response.groundingMetadata ?? response.candidates?.[0]?.groundingMetadata;
  const chunks = metadata?.groundingChunks ?? [];
  const seen = new Set<string>();

  const sources: WebResearchSource[] = [];

  for (const chunk of chunks) {
    const uri = chunk.web?.uri?.trim();
    if (!uri || !isValidHttpUrl(uri) || seen.has(uri)) {
      continue;
    }

    seen.add(uri);
    sources.push({
      title: chunk.web?.title?.trim() || new URL(uri).hostname,
      url: uri,
      snippet: "Retrieved via web research during report generation.",
      relevance: "Search-grounded public reference",
      verified: true
    });
  }

  return sources;
}

export async function conductWebResearch(input: {
  brief: ResearchBrief;
  questions: string[];
}): Promise<{ sources: WebResearchSource[]; source: "google_ai" | "none"; promptVersion: string }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return { sources: [], source: "none", promptVersion: PROMPT_VERSION };
  }

  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: GOOGLE_AI_MODEL,
      tools: [{ googleSearch: {} } as never]
    });

    const query = [
      input.brief.scope.market,
      input.brief.scope.industry,
      input.brief.scope.geography,
      ...input.questions.slice(0, 2)
    ]
      .filter(Boolean)
      .join(" ");

    const prompt = [
      "Find credible public sources relevant to this B2B research program.",
      "Use Google Search grounding only. Do not invent URLs.",
      `Research focus: ${query}`,
      `Brief: ${JSON.stringify(input.brief)}`,
      `Questions: ${JSON.stringify(input.questions)}`,
      "Summarize what credible public sources say. Do not fabricate publisher links."
    ].join("\n");

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 }
    });

    const sources = extractGroundedSources(result.response);

    return {
      sources: sources.slice(0, 8),
      source: sources.length > 0 ? "google_ai" : "none",
      promptVersion: PROMPT_VERSION
    };
  } catch {
    return { sources: [], source: "none", promptVersion: PROMPT_VERSION };
  }
}
