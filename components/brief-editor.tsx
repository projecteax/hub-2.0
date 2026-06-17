"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Loader2, Pencil, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/input";
import type { ResearchBrief } from "@/lib/types";

type BriefReviewProps = {
  projectId: string;
  initialBrief: ResearchBrief;
  source: "google_ai" | "deterministic_fallback";
  mode?: "accept" | "edit";
  onAccepted?: () => void;
  onSaved?: () => void;
};

export function BriefReview({
  projectId,
  initialBrief,
  source,
  mode = "accept",
  onAccepted,
  onSaved
}: BriefReviewProps) {
  const router = useRouter();
  const [brief, setBrief] = useState<ResearchBrief>(initialBrief);
  const [aiInstruction, setAiInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function cleanedBrief() {
    return {
      ...brief,
      keyQuestions: brief.keyQuestions.map((item) => item.trim()).filter(Boolean),
      outputPlan: brief.outputPlan.map((item) => item.trim()).filter(Boolean)
    };
  }

  function saveBriefOnly() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/research/projects/${projectId}/brief`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: cleanedBrief() })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not save brief.");
        return;
      }
      setBrief(cleanedBrief());
      onSaved?.();
    });
  }

  function acceptAndGenerate() {
    setError(null);
    const cleaned = cleanedBrief();
    if (cleaned.keyQuestions.length < 1) {
      setError("Add at least one key question before continuing.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/research/projects/${projectId}/brief`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: cleaned })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not save brief.");
        return;
      }
      setBrief(cleaned);
      onAccepted?.();
      router.push(`/research/${projectId}/generating`);
    });
  }

  function refineWithAi() {
    if (!aiInstruction.trim()) {
      setError("Describe what you want to change.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/research/projects/${projectId}/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refine", instruction: aiInstruction.trim(), brief })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Refinement failed.");
        return;
      }
      setBrief(payload.brief);
      setAiInstruction("");
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <Badge tone="sky" className="bg-white/10 text-sky-200">
              Brief · Ready
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance">{brief.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 line-clamp-4">{brief.objective}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Questions", value: brief.keyQuestions.length },
            { label: "Panel size", value: brief.methodology.panelSize ?? 5 },
            { label: "Deliverables", value: brief.outputPlan.length }
          ].map((item) => (
            <div className="rounded-2xl bg-white/10 p-4" key={item.label}>
              <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          <TabsTrigger value="refine">Refine</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Market", brief.scope.market],
              ["Geography", brief.scope.geography],
              ["Audience", brief.scope.audience],
              ["Research type", brief.scope.researchType]
            ].map(([label, value]) => (
              <div className="surface-muted p-4" key={label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 surface-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Canonical question</p>
            <p className="mt-2 text-sm text-slate-800">{brief.canonicalQuestion}</p>
          </div>
        </TabsContent>

        <TabsContent value="questions">
          <ol className="space-y-3">
            {brief.keyQuestions.map((question, index) => (
              <li className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={`kq-${index}`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-800">{question}</p>
              </li>
            ))}
          </ol>
        </TabsContent>

        <TabsContent value="deliverables">
          <ul className="space-y-2">
            {brief.outputPlan.map((item, index) => (
              <li className="surface-muted px-4 py-3 text-sm text-slate-800" key={`op-${index}`}>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Shield className="mt-0.5 h-4 w-4 shrink-0" />
            Expert organizations are labeled generically in reports (Org A, Org B) to avoid confusion with real companies.
          </div>
        </TabsContent>

        <TabsContent value="refine">
          <Textarea
            placeholder="e.g. Sharpen questions for enterprise buyers in North America"
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
          />
          <Button className="mt-3" variant="secondary" onClick={refineWithAi} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
            Refine brief
          </Button>
        </TabsContent>
      </Tabs>

      <div className="glass-card p-6">
        {mode === "accept" ? (
          <>
            <h3 className="text-lg font-semibold text-slate-950">Accept & run expert research</h3>
            <p className="mt-2 text-sm text-slate-600">
              Starts generation immediately with live progress, then opens your visual report.
            </p>
            <Button className="mt-4" size="lg" onClick={acceptAndGenerate} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Accept brief & generate report
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-slate-950">Save brief changes</h3>
            <Button className="mt-4" onClick={saveBriefOnly} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save brief
            </Button>
          </>
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export const BriefEditor = BriefReview;
