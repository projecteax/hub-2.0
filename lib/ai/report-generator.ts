import { conductWebResearch } from "@/lib/ai/web-research";
import {
  classifyQuestion,
  generateExpertPersonas,
  generateReportSynthesis,
  generateResponsesForQuestion,
  isGenericAnswer,
  EXPERT_PROMPT_VERSIONS
} from "@/lib/ai/expert-panel";
import { AiGenerationError } from "@/lib/ai/json";
import { applyConfidenceScoring } from "@/lib/research/confidence";
import { sanitizeResearchReport } from "@/lib/research/citations";
import type { ReportGenerationProgress } from "@/lib/research/generation-progress";
import type { ResearchBrief } from "@/lib/types";
import type { ResearchReport, VirtualExpertResponse } from "@/lib/research/report-types";
import { stableHash } from "@/lib/utils";
import { anonymizeExpertPanel } from "@/lib/research/expert-anonymization";

const PROMPT_VERSION = "expert-report-v3-staged";

export type ReportGenerationCallback = (progress: ReportGenerationProgress) => void | Promise<void>;

function emit(onProgress: ReportGenerationCallback | undefined, progress: ReportGenerationProgress) {
  return onProgress?.(progress);
}

async function generateQuestionResponsesWithQualityCheck(input: {
  brief: ResearchBrief;
  question: string;
  questionKey: string;
  questionType: ReturnType<typeof classifyQuestion>;
  personas: ResearchReport["personas"];
}): Promise<VirtualExpertResponse[]> {
  let responses = await generateResponsesForQuestion(input);
  const genericCount = responses.filter(isGenericAnswer).length;

  if (genericCount > 0) {
    responses = await generateResponsesForQuestion({
      ...input,
      question: `${input.question}\n\nIMPORTANT: Prior answers were too generic. Each expert must give a specific, differentiated answer with concrete details.`
    });
  }

  const stillGeneric = responses.filter(isGenericAnswer).length;
  if (stillGeneric === responses.length) {
    throw new AiGenerationError(`AI returned generic placeholder answers for ${input.questionKey}.`);
  }

  return responses;
}

export async function generateExpertResearchReport(
  input: {
    brief: ResearchBrief;
    questions: string[];
  },
  onProgress?: ReportGenerationCallback
): Promise<{ report: ResearchReport; promptVersion: string; source: "google_ai" | "deterministic_fallback" }> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new AiGenerationError(
      "Research service is not configured. Set GOOGLE_AI_API_KEY in .env.local to generate expert research."
    );
  }

  await emit(onProgress, {
    stage: "web_research",
    message: "Checking for verified public sources…",
    progress: 5
  });

  const { sources: webSources } = await conductWebResearch(input);

  await emit(onProgress, {
    stage: "personas",
    message: "Building expert panel…",
    progress: 12
  });

  const personas = await generateExpertPersonas({
    brief: input.brief,
    questions: input.questions,
    panelSize: input.brief.methodology.panelSize ?? 5
  });

  if (personas.length === 0) {
    throw new AiGenerationError("Could not generate expert personas.");
  }

  const allResponses: VirtualExpertResponse[] = [];
  const questionCount = input.questions.length;

  for (let index = 0; index < questionCount; index += 1) {
    const question = input.questions[index];
    const questionKey = `q-${index}`;
    const questionType = classifyQuestion(question);
    const responseProgress = 15 + Math.round((65 * (index + 1)) / Math.max(questionCount, 1));

    await emit(onProgress, {
      stage: "responses",
      message: `Collecting expert answers (${index + 1}/${questionCount})…`,
      progress: responseProgress
    });

    const responses = await generateQuestionResponsesWithQualityCheck({
      brief: input.brief,
      question,
      questionKey,
      questionType,
      personas
    });

    allResponses.push(...responses);
  }

  await emit(onProgress, {
    stage: "synthesis",
    message: "Synthesizing findings, charts, and executive summary…",
    progress: 88
  });

  const synthesis = await generateReportSynthesis({
    brief: input.brief,
    questions: input.questions,
    personas,
    responses: allResponses
  });

  const { personas: anonymizedPersonas, responses: anonymizedResponses } = anonymizeExpertPanel(
    personas,
    allResponses
  );

  const report: ResearchReport = sanitizeResearchReport(
    applyConfidenceScoring({
      brief: input.brief,
      personas: anonymizedPersonas,
      responses: anonymizedResponses,
      sections: synthesis.sections,
      metrics: synthesis.metrics.map((metric) => ({
        ...metric,
        key: metric.key || stableHash(metric.title)
      })),
      questionInsights: synthesis.questionInsights,
      webSources,
      validationGaps: synthesis.validationGaps
    })
  );

  await emit(onProgress, {
    stage: "finalizing",
    message: "Finalizing report…",
    progress: 96
  });

  return {
    report,
    promptVersion: `${PROMPT_VERSION}:${EXPERT_PROMPT_VERSIONS.personas}`,
    source: "google_ai"
  };
}
