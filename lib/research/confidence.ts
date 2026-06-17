import type { QuestionType, VirtualExpertResponse } from "@/lib/research/report-types";
import type { Citation } from "@/lib/research/report-types";

export type ConfidenceFactorId =
  | "panel_consensus"
  | "external_corroboration"
  | "question_fit"
  | "synthesis_clarity";

export type ConfidenceFactor = {
  id: ConfidenceFactorId;
  label: string;
  weight: number;
  score: number;
  description: string;
};

export type ConfidenceBreakdown = {
  score: number;
  band: "high" | "moderate" | "limited";
  factors: ConfidenceFactor[];
};

export const CONFIDENCE_METHODOLOGY = {
  title: "How confidence is measured",
  intro:
    "Confidence scores estimate how strongly the evidence supports each finding. They are not statistical margins of error from a human panel.",
  scale: [
    { range: "75–100%", band: "high", meaning: "Strong panel agreement with supporting desk research." },
    { range: "55–74%", band: "moderate", meaning: "Useful directional signal; validate before high-stakes decisions." },
    { range: "Below 55%", band: "limited", meaning: "Mixed signals or thin evidence; treat as exploratory." }
  ],
  factors: [
    {
      id: "panel_consensus" as const,
      label: "Panel consensus",
      weight: 40,
      description: "How closely experts align on the same question (tighter numeric spread = higher score)."
    },
    {
      id: "external_corroboration" as const,
      label: "Desk research corroboration",
      weight: 30,
      description: "Whether linked web sources support the answer or section narrative."
    },
    {
      id: "question_fit" as const,
      label: "Question fit",
      weight: 20,
      description: "Quantitative questions (%, counts, rates) score higher than open-ended qualitative prompts."
    },
    {
      id: "synthesis_clarity" as const,
      label: "Synthesis clarity",
      weight: 10,
      description: "How clearly the analysis explains its reasoning for the answer."
    }
  ],
  disclaimer:
    "Confidence reflects internal evidence strength. Request human verification for high-stakes decisions."
};

const FACTOR_WEIGHTS: Record<ConfidenceFactorId, number> = {
  panel_consensus: 0.4,
  external_corroboration: 0.3,
  question_fit: 0.2,
  synthesis_clarity: 0.1
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundScore(value: number) {
  return Math.round(value * 1000) / 1000;
}

function bandForScore(score: number): ConfidenceBreakdown["band"] {
  if (score >= 0.75) return "high";
  if (score >= 0.55) return "moderate";
  return "limited";
}

function panelConsensusScore(responses: VirtualExpertResponse[], questionKey: string): number {
  const questionResponses = responses.filter((response) => response.questionKey === questionKey);
  const numericValues = questionResponses
    .map((response) => response.numericValue)
    .filter((value): value is number => value != null);

  if (numericValues.length >= 2) {
    const mean = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
    const variance =
      numericValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / numericValues.length;
    const spread = mean !== 0 ? Math.sqrt(variance) / Math.abs(mean) : 1;
    return clamp(1 - spread * 0.85, 0.25, 1);
  }

  const openAnswers = questionResponses.map((response) => response.openAnswer?.trim() ?? "").filter(Boolean);
  if (openAnswers.length >= 2) {
    const averageLength = openAnswers.reduce((sum, answer) => sum + answer.length, 0) / openAnswers.length;
    return clamp(0.45 + Math.min(averageLength / 400, 0.35), 0.35, 0.75);
  }

  return 0.5;
}

function corroborationScore(citations?: Citation[]): number {
  if (!citations?.length) return 0.35;
  const linked = citations.filter((citation) => Boolean(citation.url)).length;
  return clamp(0.4 + linked * 0.18, 0.35, 1);
}

function questionFitScore(questionType: QuestionType): number {
  return questionType === "quantitative" ? 0.85 : 0.55;
}

function synthesisClarityScore(reasoningSummary: string): number {
  const length = reasoningSummary.trim().length;
  if (length < 24) return 0.4;
  if (length < 90) return 0.65;
  return 0.85;
}

function buildBreakdown(factorScores: Record<ConfidenceFactorId, number>): ConfidenceBreakdown {
  const factors: ConfidenceFactor[] = CONFIDENCE_METHODOLOGY.factors.map((factor) => ({
    id: factor.id,
    label: factor.label,
    weight: factor.weight,
    score: roundScore(factorScores[factor.id]),
    description: factor.description
  }));

  const score = roundScore(
    factors.reduce((sum, factor) => sum + factor.score * FACTOR_WEIGHTS[factor.id], 0)
  );

  return {
    score,
    band: bandForScore(score),
    factors
  };
}

export function computeResponseConfidenceBreakdown(
  response: Pick<
    VirtualExpertResponse,
    "questionKey" | "questionType" | "reasoningSummary" | "citations"
  >,
  allResponses: VirtualExpertResponse[]
): ConfidenceBreakdown {
  return buildBreakdown({
    panel_consensus: panelConsensusScore(allResponses, response.questionKey),
    external_corroboration: corroborationScore(response.citations),
    question_fit: questionFitScore(response.questionType),
    synthesis_clarity: synthesisClarityScore(response.reasoningSummary)
  });
}

export function computeSectionConfidenceBreakdown(
  sectionKey: string,
  responses: VirtualExpertResponse[],
  citationCount: number
): ConfidenceBreakdown {
  const scopedResponses =
    sectionKey === "quantitative_findings"
      ? responses.filter((response) => response.questionType === "quantitative")
      : sectionKey === "qualitative_themes"
        ? responses.filter((response) => response.questionType === "qualitative")
        : sectionKey === "validation_gaps"
          ? []
          : responses;

  const responseBreakdowns = scopedResponses.map((response) =>
    computeResponseConfidenceBreakdown(response, responses)
  );

  const averageFactorScore = (factorId: ConfidenceFactorId) => {
    if (responseBreakdowns.length === 0) {
      if (sectionKey === "validation_gaps") {
        return factorId === "panel_consensus" ? 0.35 : factorId === "external_corroboration" ? 0.4 : 0.5;
      }
      return 0.5;
    }

    return (
      responseBreakdowns.reduce(
        (sum, breakdown) => sum + (breakdown.factors.find((factor) => factor.id === factorId)?.score ?? 0),
        0
      ) / responseBreakdowns.length
    );
  };

  const corroboration =
    sectionKey === "validation_gaps"
      ? 0.4
      : clamp(0.35 + citationCount * 0.12, 0.35, 1);

  return buildBreakdown({
    panel_consensus: averageFactorScore("panel_consensus"),
    external_corroboration: corroboration,
    question_fit: averageFactorScore("question_fit"),
    synthesis_clarity: averageFactorScore("synthesis_clarity")
  });
}

export function applyConfidenceScoring<
  T extends {
    responses: VirtualExpertResponse[];
    sections: Array<{ key: string; confidenceLevel: number; citations?: Citation[] }>;
  }
>(report: T): T {
  const responses = report.responses.map((response) => {
    const breakdown = computeResponseConfidenceBreakdown(response, report.responses);
    return { ...response, confidence: breakdown.score };
  });

  const sections = report.sections.map((section) => {
    const breakdown = computeSectionConfidenceBreakdown(
      section.key,
      responses,
      section.citations?.length ?? 0
    );
    return { ...section, confidenceLevel: breakdown.score };
  });

  return { ...report, responses, sections };
}
