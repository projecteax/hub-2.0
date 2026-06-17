"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/research/server";
import type { DbReportSection } from "@/lib/research/report-bundle";
import type { ReviewVerdict } from "@/lib/validation/types";

type SubmittedFlag = {
  section_key: string | null;
  flag_type: string;
  comment: string;
};

type ExpertVerificationSubmittedProps = {
  projectTitle: string;
  sections: DbReportSection[];
  verdict: ReviewVerdict;
  attestedName: string;
  attestedCredentials: string;
  generalComment: string | null;
  submittedAt: string;
  flags: SubmittedFlag[];
};

export function ExpertVerificationSubmitted({
  projectTitle,
  sections,
  verdict,
  attestedName,
  attestedCredentials,
  generalComment,
  submittedAt,
  flags
}: ExpertVerificationSubmittedProps) {
  const flagsBySection = new Map(flags.map((flag) => [flag.section_key ?? "", flag]));

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Button asChild size="sm" variant="ghost">
              <Link href="/expert/marketplace">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Marketplace
              </Link>
            </Button>
            <div className="border-l border-slate-200 pl-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Submitted</p>
              <h1 className="text-lg font-semibold text-slate-950">{projectTitle}</h1>
            </div>
          </div>
          <Badge tone="emerald">{verdict.replaceAll("_", " ")}</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-5 py-6 lg:px-8 lg:py-8">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
            <div className="text-sm text-emerald-950">
              <p className="font-semibold">
                {attestedName} · {attestedCredentials}
              </p>
              <p className="mt-1 text-emerald-800">Submitted {formatRelativeDate(submittedAt)}</p>
              {generalComment ? <p className="mt-3 leading-6 text-emerald-900">{generalComment}</p> : null}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {sections.map((section) => {
            const flag = flagsBySection.get(section.section_key);
            return (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={section.section_key}>
                <h2 className="font-semibold text-slate-950">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 line-clamp-4">{section.content}</p>
                {flag ? (
                  <div className="mt-4 flex gap-2 rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-sm text-amber-950">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{flag.comment}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
