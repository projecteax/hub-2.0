"use client";

import { ExternalLink, X } from "lucide-react";
import { ResponseConfidenceLabel } from "@/components/confidence-label";
import { Badge } from "@/components/ui/badge";
import { isDisplayableWebUrl, sanitizeCitations } from "@/lib/research/citations";
import type { VirtualExpertPersona, VirtualExpertResponse } from "@/lib/research/report-types";

type ExpertDetailDrawerProps = {
  expert: (VirtualExpertPersona & { dbId: string }) | null;
  responses: VirtualExpertResponse[];
  verifiedUrls: Set<string>;
  onClose: () => void;
};

export function ExpertDetailDrawer({ expert, responses, verifiedUrls, onClose }: ExpertDetailDrawerProps) {
  if (!expert) return null;

  const expertResponses = responses.filter((r) => r.personaId === expert.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <Badge tone="sky">Expert</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">{expert.title ?? expert.segment}</h2>
            <p className="mt-1 text-sm text-slate-500">{expert.seniority} · {expert.geography}</p>
            {expert.organization ? (
              <p className="mt-1 text-xs text-indigo-600">{expert.organization}</p>
            ) : null}
          </div>
          <button type="button" className="rounded-full p-2 text-slate-400 hover:bg-slate-100" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {expert.organization ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Organization</p>
              <p className="mt-1 text-sm text-slate-800">{expert.organization}</p>
            </div>
          ) : null}

          {expert.bio ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Profile</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{expert.bio}</p>
            </div>
          ) : null}

          {expert.expertiseAreas?.length ? (
            <div className="flex flex-wrap gap-2">
              {expert.expertiseAreas.map((area) => (
                <Badge key={area} tone="slate">
                  {area}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-900">Responses by question</p>
            {expertResponses.map((response) => (
              <div className="rounded-2xl border border-slate-200 p-4" key={`${response.questionKey}-${response.personaId}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{response.questionText}</p>
                  <Badge tone={response.questionType === "quantitative" ? "sky" : "emerald"}>
                    {response.questionType}
                  </Badge>
                </div>

                {response.questionType === "quantitative" && response.numericValue != null ? (
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {response.numericValue}
                    {response.numericUnit ?? ""}
                  </p>
                ) : null}

                {response.openAnswer ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">{response.openAnswer}</p>
                ) : null}

                <p className="mt-3 text-xs text-slate-500">{response.reasoningSummary}</p>
                <div className="mt-2">
                  <ResponseConfidenceLabel response={response} allResponses={responses} />
                </div>

                {response.citations?.length ? (
                  <ul className="mt-3 space-y-2">
                    {sanitizeCitations(response.citations, verifiedUrls).map((citation) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
