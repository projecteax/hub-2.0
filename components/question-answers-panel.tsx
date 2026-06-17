"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ResponseConfidenceLabel } from "@/components/confidence-label";
import { isDisplayableWebUrl, sanitizeCitations } from "@/lib/research/citations";
import type { QuestionInsight, VirtualExpertPersona, VirtualExpertResponse } from "@/lib/research/report-types";
import { ExternalLink } from "lucide-react";

type QuestionAnswersPanelProps = {
  questions: string[];
  questionInsights: QuestionInsight[];
  responses: VirtualExpertResponse[];
  experts: Array<VirtualExpertPersona & { dbId: string }>;
  verifiedUrls: Set<string>;
};

function expertById(experts: QuestionAnswersPanelProps["experts"], personaId: string) {
  return experts.find((expert) => expert.id === personaId);
}

function buildFallbackInsight(question: string, questionKey: string, responses: VirtualExpertResponse[]): QuestionInsight {
  const questionResponses = responses.filter((response) => response.questionKey === questionKey);
  const questionType = questionResponses[0]?.questionType ?? "quantitative";

  if (questionType === "quantitative") {
    const values = questionResponses
      .map((response) => response.numericValue)
      .filter((value): value is number => value != null);
    const average = values.length
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : null;
    const unit = questionResponses.find((response) => response.numericUnit)?.numericUnit ?? "";

    return {
      questionKey,
      questionText: question,
      questionType,
      headline: average != null ? `Panel average: ${average}${unit}` : "Quantitative panel synthesis",
      summary:
        values.length > 0
          ? `Across ${questionResponses.length} experts, responses range from ${Math.min(...values)}${unit} to ${Math.max(...values)}${unit} with a panel average of ${average}${unit}.`
          : `Synthesized quantitative signal from ${questionResponses.length} expert responses.`
    };
  }

  const themes = questionResponses
    .map((response) => response.openAnswer?.trim())
    .filter(Boolean)
    .slice(0, 3);

  return {
    questionKey,
    questionText: question,
    questionType,
    headline: "Qualitative themes from the panel",
    summary:
      themes.length > 0
        ? themes.join(" ")
        : `Qualitative synthesis drawn from ${questionResponses.length} expert perspectives.`
  };
}

export function QuestionAnswersPanel({
  questions,
  questionInsights,
  responses,
  experts,
  verifiedUrls
}: QuestionAnswersPanelProps) {
  const insightByKey = new Map(questionInsights.map((insight) => [insight.questionKey, insight]));

  return (
    <section className="mt-8">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-slate-950">Answers by research question</h2>
        <p className="mt-1 text-sm text-slate-500">
          Each brief question with individual expert responses and an overall panel synthesis.
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => {
          const questionKey = `q-${index}`;
          const questionResponses = responses.filter((response) => response.questionKey === questionKey);
          const insight = insightByKey.get(questionKey) ?? buildFallbackInsight(question, questionKey, questionResponses);

          return (
            <Card className="overflow-hidden p-0" key={questionKey}>
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Question {index + 1}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">{question}</h3>
                  </div>
                  <Badge tone={insight.questionType === "quantitative" ? "sky" : "emerald"}>
                    {insight.questionType}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-0 lg:grid-cols-[1fr_1.2fr]">
                <div className="border-b border-slate-100 px-6 py-5 lg:border-b-0 lg:border-r">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Panel synthesis</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{insight.headline}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{insight.summary}</p>
                </div>

                <div className="px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Expert responses ({questionResponses.length})
                  </p>
                  {questionResponses.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">No expert responses saved for this question.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {questionResponses.map((response) => {
                        const expert = expertById(experts, response.personaId);
                        const safeCitations = sanitizeCitations(response.citations, verifiedUrls);

                        return (
                          <div
                            className="rounded-2xl border border-slate-200 p-4"
                            key={`${response.personaId}-${response.questionKey}`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {expert?.title ?? expert?.segment ?? response.personaId}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {expert?.seniority ?? "Expert"} · {expert?.geography ?? "Global"}
                                </p>
                              </div>
                              <Badge tone="slate">{expert?.segment ?? "Panel"}</Badge>
                            </div>

                            {response.questionType === "quantitative" && response.numericValue != null ? (
                              <p className="mt-3 text-3xl font-semibold text-slate-950">
                                {response.numericValue}
                                {response.numericUnit ?? ""}
                              </p>
                            ) : null}

                            {response.openAnswer ? (
                              <p className="mt-3 text-sm leading-6 text-slate-700">{response.openAnswer}</p>
                            ) : null}

                            {response.reasoningSummary ? (
                              <p className="mt-3 text-xs leading-5 text-slate-500">{response.reasoningSummary}</p>
                            ) : null}

                            <div className="mt-3">
                              <ResponseConfidenceLabel response={response} allResponses={responses} />
                            </div>

                            {safeCitations.length > 0 ? (
                              <ul className="mt-3 space-y-1">
                                {safeCitations.map((citation) => (
                                  <li key={`${citation.label}-${citation.url ?? citation.sourceType}`}>
                                    {isDisplayableWebUrl(citation.url, verifiedUrls) ? (
                                      <a
                                        className="inline-flex items-center gap-1 text-xs text-sky-700 hover:underline"
                                        href={citation.url}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        {citation.label}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    ) : (
                                      <span className="text-xs text-slate-500">
                                        {citation.label} · {citation.sourceType.replaceAll("_", " ")}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
