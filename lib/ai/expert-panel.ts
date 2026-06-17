import { generateStructuredJson } from "@/lib/ai/json";
import type { ResearchBrief } from "@/lib/types";
import type {
  QuestionInsight,
  QuestionType,
  ReportMetric,
  ReportSection,
  VirtualExpertPersona,
  VirtualExpertResponse
} from "@/lib/research/report-types";

const PERSONA_PROMPT_VERSION = "expert-personas-v1";
const RESPONSE_PROMPT_VERSION = "expert-responses-v1";
const SYNTHESIS_PROMPT_VERSION = "expert-synthesis-v1";

export function classifyQuestion(text: string): QuestionType {
  const lower = text.toLowerCase();
  if (
    /\b(how many|how much|how often|what percent|what percentage|avg\.?|average|per employee|per user|cost per|number of|count of|rate|ratio|share of|proportion)\b/.test(
      lower
    )
  ) {
    return "quantitative";
  }
  return "qualitative";
}

const GENERIC_ANSWER_PATTERNS = [
  /simulated (quantitative|qualitative) response/i,
  /cautious optimism with integration risk/i,
  /main signal is cautious optimism/i
];

export function isGenericAnswer(response: Pick<VirtualExpertResponse, "openAnswer" | "reasoningSummary">) {
  const text = `${response.openAnswer ?? ""} ${response.reasoningSummary ?? ""}`;
  return GENERIC_ANSWER_PATTERNS.some((pattern) => pattern.test(text));
}

export async function generateExpertPersonas(input: {
  brief: ResearchBrief;
  questions: string[];
  panelSize?: number;
}): Promise<VirtualExpertPersona[]> {
  const panelSize = Math.min(input.panelSize ?? 5, 6);

  const { data } = await generateStructuredJson<{ personas: VirtualExpertPersona[] }>(
    [
      "Create a virtual B2B expert panel for market research.",
      "Each persona is an AI-simulated executive with a distinct role, segment, and point of view.",
      "Rules:",
      `- Return exactly ${panelSize} personas.`,
      "- NEVER use real company names (no Google, Microsoft, Salesforce, etc.) and no realistic-sounding fake brands.",
      '- organization MUST use only anonymized labels like "Anonymized Org A", "Anonymized Org B" matched to segment and company size.',
      "- In bios and later answers, refer to 'my organization' — never invent a brand name.",
      "- bios: 2-3 sentences on experience relevant to the research topic.",
      "- expertiseAreas: 3-5 concrete domains.",
      "- segments should map to brief methodology segments when possible.",
      "Return JSON:",
      JSON.stringify({
        personas: [
          {
            id: "persona-1",
            segment: "string",
            seniority: "string",
            geography: "string",
            industryExperience: "string",
            companySizeBand: "string",
            title: "string",
            organization: "string",
            bio: "string",
            expertiseAreas: ["string"],
            yearsExperience: 12
          }
        ]
      }),
      `Brief: ${JSON.stringify(input.brief)}`,
      `Research questions: ${JSON.stringify(input.questions)}`
    ].join("\n"),
    { retries: 2 }
  );

  return (data.personas ?? []).slice(0, panelSize).map((persona, index) => ({
    ...persona,
    id: persona.id || `persona-${index + 1}`
  }));
}

export async function generateResponsesForQuestion(input: {
  brief: ResearchBrief;
  question: string;
  questionKey: string;
  questionType: QuestionType;
  personas: VirtualExpertPersona[];
}): Promise<VirtualExpertResponse[]> {
  const { data } = await generateStructuredJson<{ responses: VirtualExpertResponse[] }>(
    [
      "You are conducting a simulated expert interview. Each persona must answer the SAME research question differently based on their role and organization.",
      "CRITICAL RULES:",
      "- Every answer must directly address the exact question text.",
      "- quantitative: numericValue must answer the question; numericUnit must fit ($, %, employees, USD/month, hours/week, etc.).",
      "- qualitative: openAnswer must be 3-5 sentences with concrete examples, tools, processes, or metrics — not generic platitudes.",
      "- reasoningSummary: 1-2 sentences explaining why this expert gave this answer.",
      "- NEVER use placeholder phrases like 'Simulated response', 'cautious optimism', or 'integration risk as the gating factor'.",
      "- Each persona answer must be meaningfully different.",
      "- NEVER mention specific company or vendor names in answers; say 'my organization', 'our team', or 'peers in the segment'.",
      "- organization labels in persona data are anonymized — do not invent new company names in responses.",
      `Question type for this item: ${input.questionType}`,
      "Return JSON:",
      JSON.stringify({
        responses: [
          {
            personaId: "persona-1",
            questionKey: input.questionKey,
            questionText: input.question,
            questionType: input.questionType,
            numericValue: 42,
            numericUnit: "%",
            openAnswer: "string for qualitative only",
            confidence: 0.7,
            reasoningSummary: "string"
          }
        ]
      }),
      `Brief: ${JSON.stringify(input.brief)}`,
      `Question (${input.questionKey}): ${input.question}`,
      `Personas: ${JSON.stringify(input.personas)}`,
      `Return exactly ${input.personas.length} responses, one per personaId.`
    ].join("\n"),
    { retries: 2 }
  );

  const byPersona = new Map(
    (data.responses ?? []).map((response) => [response.personaId, response])
  );

  return input.personas.map((persona) => {
    const response = byPersona.get(persona.id);
    return {
      personaId: persona.id,
      questionKey: input.questionKey,
      questionText: input.question,
      questionType: input.questionType,
      numericValue: input.questionType === "quantitative" ? response?.numericValue : undefined,
      numericUnit: input.questionType === "quantitative" ? response?.numericUnit : undefined,
      openAnswer: input.questionType === "qualitative" ? response?.openAnswer : undefined,
      confidence: response?.confidence ?? 0.65,
      reasoningSummary: response?.reasoningSummary ?? "",
      citations: response?.citations
    };
  });
}

export async function generateReportSynthesis(input: {
  brief: ResearchBrief;
  questions: string[];
  personas: VirtualExpertPersona[];
  responses: VirtualExpertResponse[];
}): Promise<{
  sections: ReportSection[];
  questionInsights: QuestionInsight[];
  metrics: ReportMetric[];
  validationGaps: string[];
}> {
  const questionTypes = input.questions.map((question, index) => ({
    key: `q-${index}`,
    text: question,
    type: classifyQuestion(question)
  }));

  const { data } = await generateStructuredJson<{
    sections: ReportSection[];
    questionInsights: QuestionInsight[];
    metrics: ReportMetric[];
    validationGaps: string[];
  }>(
    [
      "Synthesize a B2B research report from expert panel responses.",
      "Rules:",
      "- questionInsights: one per question with headline and summary grounded in the actual response data.",
      "- sections: executive_summary, quantitative_findings, qualitative_themes, validation_gaps.",
      "- metrics: one chart per quantitative question using aggregated response data; choose chart types adaptively.",
      "- Do not invent URLs.",
      "- All outputs are AI-simulated.",
      "Return JSON:",
      JSON.stringify({
        sections: [
          {
            key: "executive_summary",
            title: "string",
            content: "string",
            confidenceLevel: 0.7,
            evidenceState: "ai_simulated"
          }
        ],
        questionInsights: [
          {
            questionKey: "q-0",
            questionText: "string",
            questionType: "quantitative",
            headline: "string",
            summary: "string"
          }
        ],
        metrics: [
          {
            key: "string",
            title: "string",
            chartType: "bar",
            data: [{ name: "string", value: 50 }],
            questionKey: "q-0",
            questionType: "quantitative",
            unit: "%",
            description: "string",
            evidenceState: "ai_simulated"
          }
        ],
        validationGaps: ["string"]
      }),
      `Prompt version: ${SYNTHESIS_PROMPT_VERSION}`,
      `Brief: ${JSON.stringify(input.brief)}`,
      `Questions: ${JSON.stringify(questionTypes)}`,
      `Personas: ${JSON.stringify(input.personas)}`,
      `Responses: ${JSON.stringify(input.responses)}`
    ].join("\n"),
    { retries: 2 }
  );

  return {
    sections: (data.sections ?? []).map((section) => ({
      ...section,
      evidenceState: "ai_simulated" as const
    })),
    questionInsights: data.questionInsights ?? [],
    metrics: (data.metrics ?? []).map((metric) => ({
      ...metric,
      evidenceState: "ai_simulated" as const
    })),
    validationGaps: data.validationGaps ?? []
  };
}

export const EXPERT_PROMPT_VERSIONS = {
  personas: PERSONA_PROMPT_VERSION,
  responses: RESPONSE_PROMPT_VERSION,
  synthesis: SYNTHESIS_PROMPT_VERSION
};
