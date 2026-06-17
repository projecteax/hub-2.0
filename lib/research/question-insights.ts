import type { QuestionInsight } from "@/lib/research/report-types";
import type { DbReportSection } from "@/lib/research/report-bundle";

export function questionInsightSectionKey(questionKey: string) {
  return `question_insight_${questionKey}`;
}

export function isQuestionInsightSection(sectionKey: string) {
  return sectionKey.startsWith("question_insight_");
}

export function questionInsightToSectionRow(
  projectId: string,
  insight: QuestionInsight,
  sortOrder: number
) {
  return {
    project_id: projectId,
    section_key: questionInsightSectionKey(insight.questionKey),
    title: insight.headline,
    content: insight.summary,
    confidence_level: 0.65,
    evidence_state: "ai_simulated" as const,
    citations: [
      {
        questionKey: insight.questionKey,
        questionText: insight.questionText,
        questionType: insight.questionType
      }
    ],
    sort_order: sortOrder
  };
}

export function parseQuestionInsightSection(section: DbReportSection): QuestionInsight | null {
  if (!isQuestionInsightSection(section.section_key)) {
    return null;
  }

  const meta = Array.isArray(section.citations)
    ? (section.citations as Array<Record<string, unknown>>)[0]
    : null;

  const questionKey =
    (typeof meta?.questionKey === "string" ? meta.questionKey : null) ??
    section.section_key.replace("question_insight_", "");

  return {
    questionKey,
    questionText: typeof meta?.questionText === "string" ? meta.questionText : section.title,
    questionType: meta?.questionType === "qualitative" ? "qualitative" : "quantitative",
    headline: section.title,
    summary: section.content
  };
}
