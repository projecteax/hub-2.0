"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { ChartMetric, MiniExpertBarChart } from "@/components/chart-metric";
import { RequestVerification } from "@/components/request-verification";
import { SectionConfidenceLabel } from "@/components/confidence-label";
import { ExpertDetailDrawer } from "@/components/expert-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  mapDbPersonaToView,
  mapDbResponseToView,
  type DbExpertPersona,
  type DbExpertResponse,
  type DbReportMetric,
  type DbReportSection,
  type DbWebSource
} from "@/lib/research/report-bundle";
import { isQuestionInsightSection, parseQuestionInsightSection } from "@/lib/research/question-insights";
import type { QuestionInsight, ReportMetric, VirtualExpertPersona, VirtualExpertResponse } from "@/lib/research/report-types";
import type { ProjectValidationSummary } from "@/lib/validation/types";
import type { ResearchBrief } from "@/lib/types";

type ReportDashboardProps = {
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  validation: ProjectValidationSummary | null;
  brief: ResearchBrief | null;
  questions: string[];
  personas: DbExpertPersona[];
  responses: DbExpertResponse[];
  sections: DbReportSection[];
  metrics: DbReportMetric[];
  webSources: DbWebSource[];
};

function buildQuestionInsight(
  question: string,
  questionKey: string,
  responses: VirtualExpertResponse[],
  stored?: QuestionInsight
): QuestionInsight {
  if (stored) return stored;
  const questionResponses = responses.filter((response) => response.questionKey === questionKey);
  const questionType = questionResponses[0]?.questionType ?? "quantitative";
  if (questionType === "quantitative") {
    const values = questionResponses.map((r) => r.numericValue).filter((v): v is number => v != null);
    const unit = questionResponses.find((r) => r.numericUnit)?.numericUnit ?? "";
    const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    return {
      questionKey,
      questionText: question,
      questionType,
      headline: `Panel average ${avg}${unit}`,
      summary: values.length
        ? `Range ${Math.min(...values)}–${Math.max(...values)}${unit} across ${values.length} experts.`
        : "Quantitative panel data."
    };
  }
  return {
    questionKey,
    questionText: question,
    questionType,
    headline: "Expert themes",
    summary: questionResponses
      .map((r) => r.openAnswer)
      .filter(Boolean)
      .slice(0, 2)
      .join(" ")
  };
}

export function ReportDashboard({
  projectId,
  projectTitle,
  projectStatus,
  validation,
  brief,
  questions,
  personas,
  responses,
  sections,
  metrics,
  webSources
}: ReportDashboardProps) {
  const [selectedExpert, setSelectedExpert] = useState<(VirtualExpertPersona & { dbId: string }) | null>(null);
  const [openQuestion, setOpenQuestion] = useState(0);

  const personaKeyById = useMemo(() => new Map(personas.map((p) => [p.id, p.persona_key])), [personas]);
  const expertViews = useMemo(
    () => personas.map((p) => mapDbPersonaToView(p) as VirtualExpertPersona & { dbId: string }),
    [personas]
  );
  const responseViews = useMemo(
    () => responses.map((r) => mapDbResponseToView(r, personaKeyById, questions)),
    [responses, personaKeyById, questions]
  );
  const narrativeSections = useMemo(
    () => sections.filter((section) => !isQuestionInsightSection(section.section_key)),
    [sections]
  );
  const storedInsights = useMemo(
    () =>
      sections
        .map((s) => parseQuestionInsightSection(s))
        .filter((i): i is QuestionInsight => i != null),
    [sections]
  );
  const verifiedUrls = useMemo(
    () => new Set(webSources.map((s) => String(s.metadata?.url ?? "")).filter(Boolean)),
    [webSources]
  );

  const chartMetrics: ReportMetric[] = metrics.map((metric) => {
    const cuts = metric.segment_cuts ?? {};
    return {
      key: metric.metric_key,
      title: metric.title,
      chartType: metric.chart_type as ReportMetric["chartType"],
      data: metric.data as ReportMetric["data"],
      evidenceState: metric.evidence_state as ReportMetric["evidenceState"],
      questionKey: cuts.questionKey as string | undefined,
      questionType: cuts.questionType as ReportMetric["questionType"],
      unit: cuts.unit as string | undefined,
      description: cuts.description as string | undefined
    };
  });

  const statMetrics = chartMetrics.filter((m) => m.chartType === "stat" || m.data.length === 1).slice(0, 4);
  const visualMetrics = chartMetrics.filter((m) => !statMetrics.includes(m));

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Research report</p>
            <h1 className="text-2xl font-semibold text-slate-950">{projectTitle}</h1>
          </div>
          <div className="flex gap-2">
            <Badge tone="sky">Expert panel report</Badge>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/research/${projectId}`}>Project</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {validation ? (
          <RequestVerification projectId={projectId} projectStatus={projectStatus} validation={validation} />
        ) : null}

        {statMetrics.length > 0 ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statMetrics.map((metric) => (
              <div key={metric.key}>
                <ChartMetric metric={metric} compact />
              </div>
            ))}
          </section>
        ) : null}

        {visualMetrics.length > 0 ? (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Visual insights</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visualMetrics.map((metric) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={metric.key}>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2">{metric.title}</p>
                    {metric.questionType ? <Badge tone="sky">{metric.questionType}</Badge> : null}
                  </div>
                  <ChartMetric metric={metric} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Question explorer</h2>
            <p className="text-sm text-slate-500">Charts and expert answers for each research question</p>
          </div>

          <div className="flex flex-col lg:flex-row">
            <div className="border-b border-slate-100 lg:w-80 lg:border-b-0 lg:border-r">
              {questions.map((question, index) => {
                const questionKey = `q-${index}`;
                const active = openQuestion === index;
                return (
                  <button
                    type="button"
                    key={questionKey}
                    className={`flex w-full items-start gap-2 border-l-2 px-4 py-4 text-left text-sm transition ${
                      active ? "border-indigo-600 bg-indigo-50/80 text-indigo-950" : "border-transparent text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setOpenQuestion(index)}
                  >
                    <span className="font-semibold">{index + 1}.</span>
                    <span className="line-clamp-3">{question}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 p-6">
              {questions.map((question, index) => {
                if (openQuestion !== index) return null;
                const questionKey = `q-${index}`;
                const qResponses = responseViews.filter((r) => r.questionKey === questionKey);
                const insight = buildQuestionInsight(
                  question,
                  questionKey,
                  responseViews,
                  storedInsights.find((i) => i.questionKey === questionKey)
                );
                const isQuant = insight.questionType === "quantitative";
                const expertLabels = qResponses.map((r) => {
                  const ex = expertViews.find((e) => e.id === r.personaId);
                  return ex?.title?.split(" ")[0] ?? ex?.segment?.slice(0, 12) ?? r.personaId;
                });
                const expertValues = qResponses.map((r) => r.numericValue ?? 0);
                const unit = qResponses.find((r) => r.numericUnit)?.numericUnit;

                return (
                  <div key={questionKey}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-xl font-semibold text-slate-950">{question}</h3>
                      <Badge tone={isQuant ? "sky" : "emerald"}>{insight.questionType}</Badge>
                    </div>
                    <p className="mt-2 text-lg font-medium text-indigo-700">{insight.headline}</p>
                    <p className="mt-1 text-sm text-slate-600">{insight.summary}</p>

                    {isQuant && expertValues.some((v) => v > 0) ? (
                      <div className="mt-6 rounded-xl bg-slate-50 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Expert comparison
                        </p>
                        <MiniExpertBarChart labels={expertLabels} values={expertValues} unit={unit} />
                      </div>
                    ) : null}

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {qResponses.map((response) => {
                        const expert = expertViews.find((e) => e.id === response.personaId);
                        return (
                          <div className="rounded-xl border border-slate-200 p-4" key={`${response.personaId}-${questionKey}`}>
                            <p className="font-semibold text-slate-900">{expert?.title ?? expert?.segment}</p>
                            <p className="text-xs text-slate-500">{expert?.organization}</p>
                            {isQuant && response.numericValue != null ? (
                              <p className="mt-2 text-2xl font-semibold text-slate-950">
                                {response.numericValue}
                                {response.numericUnit ?? ""}
                              </p>
                            ) : (
                              <p className="mt-2 text-sm leading-6 text-slate-700 line-clamp-4">{response.openAnswer}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {narrativeSections
            .filter((s) => s.section_key !== "executive_summary")
            .slice(0, 3)
            .map((section) => (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={section.section_key}>
                <h3 className="font-semibold text-slate-900">{section.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-5">{section.content}</p>
                <div className="mt-3">
                  <SectionConfidenceLabel sectionKey={section.section_key} responses={responseViews} citationCount={0} />
                </div>
              </div>
            ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Expert panel</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {expertViews.map((expert) => (
              <button
                type="button"
                key={expert.dbId}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:border-indigo-300 hover:bg-indigo-50/50"
                onClick={() => setSelectedExpert(expert)}
              >
                <div>
                  <p className="font-semibold text-slate-900">{expert.title ?? expert.segment}</p>
                  <p className="text-xs text-slate-500">{expert.seniority} · {expert.geography}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        </section>

        {webSources.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Verified sources</h2>
            <ul className="mt-3 space-y-2">
              {webSources.map((source) => (
                <li key={source.id}>
                  <a
                    className="text-sm text-indigo-700 hover:underline"
                    href={String(source.metadata?.url)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      <ExpertDetailDrawer expert={selectedExpert} responses={responseViews} verifiedUrls={verifiedUrls} onClose={() => setSelectedExpert(null)} />
    </div>
  );
}
