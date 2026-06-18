"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  MessageSquare,
  ShieldCheck,
  XCircle
} from "lucide-react";
import { ChartMetric } from "@/components/chart-metric";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  isQuestionInsightSection,
  parseQuestionInsightSection,
  questionInsightSectionKey
} from "@/lib/research/question-insights";
import {
  mapDbPersonaToView,
  mapDbResponseToView,
  type DbExpertPersona,
  type DbExpertResponse,
  type DbReportMetric,
  type DbReportSection
} from "@/lib/research/report-bundle";
import type { DbFormAnswer } from "@/lib/research/server";
import type { QuestionInsight, ReportMetric, VirtualExpertPersona, VirtualExpertResponse } from "@/lib/research/report-types";
import type { ResearchBrief, ResearchScope } from "@/lib/types";
import type { ReviewVerdict } from "@/lib/validation/types";

type VerificationSection = {
  key: string;
  title: string;
  content: string;
  kind: "narrative" | "insight";
};

type ReviewQuestion = {
  key: string;
  text: string;
  insight?: QuestionInsight;
  responses: VirtualExpertResponse[];
};

const scopeLabels: Array<{ key: keyof ResearchScope; label: string }> = [
  { key: "industry", label: "Industry" },
  { key: "market", label: "Market / topic" },
  { key: "geography", label: "Geography" },
  { key: "companySize", label: "Company size" },
  { key: "audience", label: "Audience" },
  { key: "decisionStakes", label: "Decision stakes" },
  { key: "timeline", label: "Timeline" },
  { key: "researchType", label: "Research type" }
];

function fieldLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function sectionLabel(key: string, title: string) {
  const labels: Record<string, string> = {
    executive_summary: "Summary",
    quantitative_findings: "Quantitative",
    qualitative_themes: "Qualitative",
    validation_gaps: "Gaps"
  };
  return labels[key] ?? title;
}

function formatContentBlocks(content: string) {
  return content
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function FormattedContent({ content }: { content: string }) {
  const blocks = formatContentBlocks(content);

  if (blocks.length === 0) {
    return <p className="text-sm text-slate-500">No content for this section.</p>;
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const isBulletList = lines.length > 1 && lines.every((line) => /^[-•*]\s/.test(line));

        if (isBulletList) {
          return (
            <ul className="space-y-2.5" key={index}>
              {lines.map((line) => (
                <li className="flex gap-3 text-sm leading-6 text-slate-700" key={line}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  <span>{line.replace(/^[-•*]\s*/, "")}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p className="text-sm leading-7 text-slate-700" key={index}>
            {block}
          </p>
        );
      })}
    </div>
  );
}

function mapMetrics(metrics: DbReportMetric[]): ReportMetric[] {
  return metrics.map((metric) => {
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
}

function answerSummary(response: VirtualExpertResponse) {
  if (response.questionType === "quantitative" && response.numericValue != null) {
    return `${response.numericValue}${response.numericUnit ?? ""}`;
  }

  return response.openAnswer || response.purchaseDriver || response.keyConcern || "No answer captured.";
}

function expertLabel(experts: Array<VirtualExpertPersona & { dbId: string }>, personaId: string) {
  const expert = experts.find((item) => item.id === personaId);
  if (!expert) return personaId;
  return expert.title ?? `${expert.seniority} · ${expert.segment}`;
}

const VERDICT_OPTIONS: Array<{
  value: ReviewVerdict;
  label: string;
  hint: string;
  icon: typeof CheckCircle2;
  tone: string;
}> = [
  {
    value: "verified",
    label: "Verified",
    hint: "Accurate overall",
    icon: CheckCircle2,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-900"
  },
  {
    value: "verified_with_flags",
    label: "With notes",
    hint: "Mostly accurate",
    icon: AlertCircle,
    tone: "border-amber-200 bg-amber-50 text-amber-900"
  },
  {
    value: "unable_to_verify",
    label: "Can't verify",
    hint: "Insufficient basis",
    icon: XCircle,
    tone: "border-slate-200 bg-slate-50 text-slate-700"
  }
];

export type ExpertVerificationWorkspaceProps = {
  assignmentId: string;
  projectTitle: string;
  clientCompanyName: string | null;
  brief: ResearchBrief | null;
  clientFields: DbFormAnswer[];
  sections: DbReportSection[];
  metrics: DbReportMetric[];
  questions: string[];
  personas: DbExpertPersona[];
  responses: DbExpertResponse[];
  defaultName: string;
  defaultCredentials: string;
};

export function ExpertVerificationWorkspace({
  assignmentId,
  projectTitle,
  clientCompanyName,
  brief,
  clientFields,
  sections,
  metrics,
  questions,
  personas,
  responses,
  defaultName,
  defaultCredentials
}: ExpertVerificationWorkspaceProps) {
  const personaKeyById = useMemo(() => new Map(personas.map((persona) => [persona.id, persona.persona_key])), [personas]);
  const expertViews = useMemo(
    () => personas.map((persona) => mapDbPersonaToView(persona) as VirtualExpertPersona & { dbId: string }),
    [personas]
  );
  const responseViews = useMemo(
    () => responses.map((response) => mapDbResponseToView(response, personaKeyById, questions)),
    [responses, personaKeyById, questions]
  );
  const questionInsights = useMemo(
    () =>
      sections
        .map((section) => parseQuestionInsightSection(section))
        .filter((insight): insight is QuestionInsight => insight != null),
    [sections]
  );
  const reviewQuestions = useMemo<ReviewQuestion[]>(
    () =>
      questions.map((question, index) => {
        const key = `q-${index}`;
        return {
          key,
          text: question,
          insight: questionInsights.find((insight) => insight.questionKey === key),
          responses: responseViews.filter((response) => response.questionKey === key)
        };
      }),
    [questions, questionInsights, responseViews]
  );

  const verificationSections = useMemo<VerificationSection[]>(() => {
    return sections
      .filter((section) => !isQuestionInsightSection(section.section_key))
      .map((section) => ({
        key: section.section_key,
        title: sectionLabel(section.section_key, section.title),
        content: section.content,
        kind: "narrative" as const
      }));
  }, [sections]);

  const chartMetrics = useMemo(() => mapMetrics(metrics), [metrics]);
  const statMetrics = chartMetrics.filter((m) => m.chartType === "stat" || m.data.length === 1).slice(0, 3);
  const scopeValues = useMemo(
    () =>
      brief
        ? scopeLabels
            .map((item) => ({ label: item.label, value: brief.scope[item.key] }))
            .filter((item) => item.value?.trim())
        : [],
    [brief]
  );

  const [activeKey, setActiveKey] = useState(verificationSections[0]?.key ?? "");
  const [verdict, setVerdict] = useState<ReviewVerdict>("verified");
  const [attestedName, setAttestedName] = useState(defaultName);
  const [attestedCredentials, setAttestedCredentials] = useState(defaultCredentials);
  const [generalComment, setGeneralComment] = useState("");
  const [sectionComments, setSectionComments] = useState<Record<string, string>>({});
  const [questionComments, setQuestionComments] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeSection = verificationSections.find((section) => section.key === activeKey) ?? verificationSections[0];

  function buildFlags() {
    const sectionFlags = verificationSections
      .map((section) => ({
        sectionKey: section.key,
        flagType: "section_comment",
        comment: (sectionComments[section.key] ?? "").trim()
      }))
      .filter((flag) => flag.comment.length > 0);

    const questionFlags = reviewQuestions
      .map((question) => ({
        sectionKey: questionInsightSectionKey(question.key),
        flagType: "question_evidence_comment",
        comment: (questionComments[question.key] ?? "").trim()
      }))
      .filter((flag) => flag.comment.length > 0);

    return [...questionFlags, ...sectionFlags];
  }

  function submit() {
    setError(null);
    if (!attestedName.trim() || !attestedCredentials.trim()) {
      setError("Name and credentials are required.");
      return;
    }

    const flags = buildFlags();
    if (verdict === "verified_with_flags" && flags.length === 0 && !generalComment.trim()) {
      setError("Add a question note, section note, or general comment when verifying with concerns.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/expert/reviews/${assignmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict,
          attestedName: attestedName.trim(),
          attestedCredentials: attestedCredentials.trim(),
          generalComment: generalComment.trim() || undefined,
          flags
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not submit review.");
        return;
      }
      window.location.href = "/expert/marketplace?submitted=1";
    });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button asChild size="sm" variant="ghost">
              <Link href="/expert/marketplace">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Marketplace
              </Link>
            </Button>
            <div className="min-w-0 border-l border-slate-200 pl-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Human verification</p>
              <h1 className="truncate text-lg font-semibold text-slate-950 sm:text-xl">{projectTitle}</h1>
            </div>
          </div>
          <Badge tone="sky">Review &amp; attest</Badge>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[300px_1fr] lg:px-8 lg:py-8">
        {/* Attestation — sticky sidebar */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              Your attestation
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Sign with your real identity. The client sees your name and credentials on the verified report.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-slate-600">Full name</span>
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-indigo-500 focus:ring-2"
                  value={attestedName}
                  onChange={(e) => setAttestedName(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-600">Credentials</span>
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-indigo-500 focus:ring-2"
                  value={attestedCredentials}
                  onChange={(e) => setAttestedCredentials(e.target.value)}
                  placeholder="MBA, 15 yrs enterprise SaaS"
                />
              </label>
            </div>

            <div className="mt-5">
              <p className="text-xs font-medium text-slate-600">Verdict</p>
              <div className="mt-2 grid gap-2">
                {VERDICT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = verdict === option.value;
                  return (
                    <button
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                        selected ? option.tone : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                      key={option.value}
                      type="button"
                      onClick={() => setVerdict(option.value)}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>
                        <span className="block text-sm font-medium">{option.label}</span>
                        <span className="block text-xs opacity-70">{option.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-medium text-slate-600">Overall note (optional)</span>
              <Textarea
                className="mt-1 min-h-[72px] text-sm"
                placeholder="Summary for the client…"
                value={generalComment}
                onChange={(e) => setGeneralComment(e.target.value)}
              />
            </label>

            <Button className="mt-5 w-full" disabled={isPending} onClick={submit}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Submit verification
            </Button>
            {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          </div>
        </aside>

        {/* Report + section notes */}
        <main className="min-w-0 space-y-4">
          {statMetrics.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {statMetrics.map((metric) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={metric.key}>
                  <ChartMetric compact metric={metric} />
                </div>
              ))}
            </div>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white px-5 py-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-950">Client brief</p>
                  <p className="text-xs text-slate-500">Context used to generate the report you are validating.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Project</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{projectTitle}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Client company</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{clientCompanyName ?? "Client organization"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Review task</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">Validate evidence and attest sections</p>
                </div>
              </div>

              {brief ? (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Research objective</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{brief.objective}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{brief.canonicalQuestion}</p>
                </div>
              ) : null}

              {scopeValues.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {scopeValues.map((field) => (
                    <div className="rounded-lg border border-slate-200 px-3 py-2" key={field.label}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{field.label}</p>
                      <p className="mt-1 text-xs font-medium leading-5 text-slate-800">{field.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {clientFields.length > 0 ? (
                <details className="rounded-xl border border-slate-200 bg-white">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-900">
                    Client form answers ({clientFields.length})
                  </summary>
                  <div className="grid gap-3 border-t border-slate-100 p-4 md:grid-cols-2">
                    {clientFields.map((field) => (
                      <div className="rounded-lg bg-slate-50 p-3" key={field.id}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {fieldLabel(field.field_key)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-700">{field.question_text}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-900">{field.answer_text}</p>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">Questions to validate</p>
              <p className="text-xs text-slate-500">Check the question, synthesis, and underlying answers before attesting the report.</p>
            </div>

            {reviewQuestions.length > 0 ? (
              <div className="grid gap-3 p-5">
                {reviewQuestions.map((question, index) => (
                  <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4" key={question.key}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Question {index + 1}</p>
                        <h2 className="mt-1 text-base font-semibold leading-6 text-slate-950">{question.text}</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="slate">{question.responses.length} answers</Badge>
                        {question.insight ? (
                          <Badge tone={question.insight.questionType === "quantitative" ? "sky" : "emerald"}>
                            {question.insight.questionType}
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    {question.insight ? (
                      <div className="mt-3 rounded-xl border border-indigo-100 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Synthesis</p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">{question.insight.headline}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{question.insight.summary}</p>
                      </div>
                    ) : null}

                    <details className="mt-3 rounded-xl border border-slate-200 bg-white">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-900">
                        View panel answers
                      </summary>
                      <div className="grid gap-3 border-t border-slate-100 p-3 md:grid-cols-2">
                        {question.responses.length > 0 ? (
                          question.responses.map((response) => (
                            <div
                              className="rounded-lg border border-slate-200 bg-white p-3"
                              key={`${response.personaId}-${response.questionKey}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900">
                                  {expertLabel(expertViews, response.personaId)}
                                </p>
                                <Badge tone="slate">{Math.round(response.confidence * 100)}%</Badge>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-700">{answerSummary(response)}</p>
                              {response.reasoningSummary ? (
                                <p className="mt-2 text-xs leading-5 text-slate-500">{response.reasoningSummary}</p>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No panel answers were saved for this question.</p>
                        )}
                      </div>
                    </details>

                    <Textarea
                      className="mt-3 min-h-[64px] resize-y border-slate-200 bg-white text-sm"
                      placeholder="Optional note: wrong framing, unsupported synthesis, missing context…"
                      value={questionComments[question.key] ?? ""}
                      onChange={(e) => setQuestionComments((current) => ({ ...current, [question.key]: e.target.value }))}
                    />
                  </article>
                ))}
              </div>
            ) : (
              <p className="p-5 text-sm text-slate-500">No research questions are available for this review.</p>
            )}
          </section>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Report sections to attest</p>
              <p className="text-xs text-slate-500">
                After reviewing the questions and answers, attest the report narrative section by section.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row">
              <nav className="flex gap-1 overflow-x-auto border-b border-slate-100 p-2 lg:w-52 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r lg:p-3">
                {verificationSections.map((section) => {
                  const active = section.key === activeSection?.key;
                  const hasNote = Boolean(sectionComments[section.key]?.trim());
                  return (
                    <button
                      className={cn(
                        "flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition lg:w-full",
                        active
                          ? "bg-indigo-50 font-medium text-indigo-900"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                      key={section.key}
                      type="button"
                      onClick={() => setActiveKey(section.key)}
                    >
                      <span className="line-clamp-2">{section.title}</span>
                      {hasNote ? <MessageSquare className="h-3.5 w-3.5 shrink-0 text-amber-600" /> : null}
                    </button>
                  );
                })}
              </nav>

              {activeSection ? (
                <div className="min-w-0 flex-1 p-5 lg:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-950">{activeSection.title}</h2>
                    {activeSection.kind === "insight" ? <Badge tone="sky">Question insight</Badge> : null}
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50/80 p-5">
                    <FormattedContent content={activeSection.content} />
                  </div>

                  <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-white p-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <MessageSquare className="h-4 w-4 text-indigo-600" />
                      Your note on this section
                      <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <Textarea
                      className="mt-2 min-h-[88px] resize-y border-slate-200 text-sm"
                      placeholder="Flag inaccuracies, missing context, or add expert commentary…"
                      value={sectionComments[activeSection.key] ?? ""}
                      onChange={(e) =>
                        setSectionComments((current) => ({ ...current, [activeSection.key]: e.target.value }))
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center p-12 text-sm text-slate-500">
                  No report sections available.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
