"use client";

import { useId, useState } from "react";
import { Info } from "lucide-react";
import {
  CONFIDENCE_METHODOLOGY,
  computeResponseConfidenceBreakdown,
  computeSectionConfidenceBreakdown,
  type ConfidenceBreakdown
} from "@/lib/research/confidence";
import type { VirtualExpertResponse } from "@/lib/research/report-types";
import { formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ConfidenceLabelProps = {
  score: number;
  breakdown?: ConfidenceBreakdown;
  className?: string;
  size?: "sm" | "md";
};

function FactorRows({ breakdown }: { breakdown: ConfidenceBreakdown }) {
  return (
    <ul className="mt-3 space-y-2">
      {breakdown.factors.map((factor) => (
        <li className="rounded-xl bg-slate-50 px-3 py-2" key={factor.id}>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-slate-800">
              {factor.label} ({factor.weight}%)
            </span>
            <span className="text-slate-600">{formatPercent(factor.score * 100)}</span>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">{factor.description}</p>
        </li>
      ))}
    </ul>
  );
}

export function ConfidenceLabel({ score, breakdown, className, size = "md" }: ConfidenceLabelProps) {
  const [open, setOpen] = useState(false);
  const popoverId = useId();

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("font-medium text-slate-800", size === "sm" ? "text-xs" : "text-sm")}>
        Confidence {formatPercent(score * 100)}
      </span>
      <span className="relative">
        <button
          type="button"
          className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="How confidence is measured"
          aria-expanded={open}
          aria-controls={popoverId}
          onClick={() => setOpen((value) => !value)}
          onBlur={(event) => {
            if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
              setOpen(false);
            }
          }}
        >
          <Info className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>

        {open ? (
          <div
            id={popoverId}
            role="tooltip"
            className="absolute bottom-full right-0 z-50 mb-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xl"
          >
            <p className="text-sm font-semibold text-slate-950">{CONFIDENCE_METHODOLOGY.title}</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">{CONFIDENCE_METHODOLOGY.intro}</p>

            {breakdown ? (
              <>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  This score ({breakdown.band})
                </p>
                <FactorRows breakdown={breakdown} />
              </>
            ) : (
              <ul className="mt-3 space-y-2">
                {CONFIDENCE_METHODOLOGY.factors.map((factor) => (
                  <li className="text-xs text-slate-600" key={factor.id}>
                    <span className="font-medium text-slate-800">
                      {factor.label} ({factor.weight}%):
                    </span>{" "}
                    {factor.description}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Scale</p>
              <ul className="mt-2 space-y-1">
                {CONFIDENCE_METHODOLOGY.scale.map((item) => (
                  <li className="text-[11px] text-slate-600" key={item.band}>
                    <span className="font-medium text-slate-800">{item.range}</span> — {item.meaning}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-3 text-[11px] leading-5 text-slate-500">{CONFIDENCE_METHODOLOGY.disclaimer}</p>
          </div>
        ) : null}
      </span>
    </span>
  );
}

export function ResponseConfidenceLabel({
  response,
  allResponses,
  className
}: {
  response: VirtualExpertResponse;
  allResponses: VirtualExpertResponse[];
  className?: string;
}) {
  const breakdown = computeResponseConfidenceBreakdown(response, allResponses);
  return <ConfidenceLabel score={breakdown.score} breakdown={breakdown} className={className} size="sm" />;
}

export function SectionConfidenceLabel({
  sectionKey,
  responses,
  citationCount,
  className
}: {
  sectionKey: string;
  responses: VirtualExpertResponse[];
  citationCount: number;
  className?: string;
}) {
  const breakdown = computeSectionConfidenceBreakdown(sectionKey, responses, citationCount);
  return <ConfidenceLabel score={breakdown.score} breakdown={breakdown} className={className} />;
}
