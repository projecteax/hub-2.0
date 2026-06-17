"use client";

import Link from "next/link";
import { useState } from "react";
import { BarChart3, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatTile } from "@/components/ui/page-shell";
import { useReportGeneration } from "@/components/report-generation-runner";

type ProjectActionsProps = {
  projectId: string;
  status: string;
  hasBrief: boolean;
  hasReport: boolean;
  personaCount: number;
  questionCount: number;
};

export function ProjectActions({
  projectId,
  hasBrief,
  hasReport,
  personaCount,
  questionCount
}: ProjectActionsProps) {
  const [showProgress, setShowProgress] = useState(false);
  const { startGeneration, isGenerating, progress, message, error } = useReportGeneration({
    projectId,
    redirectTo: `/research/${projectId}/report`,
    autostart: false
  });

  async function regenerate() {
    setShowProgress(true);
    await startGeneration();
  }

  return (
    <div className="glass-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge tone="sky">Expert research</Badge>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            {hasReport ? "Report ready" : "Run expert panel"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {hasReport
              ? "Open the visual report or regenerate to refresh answers and charts."
              : `${questionCount} question${questionCount === 1 ? "" : "s"} · expert panel`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasReport ? (
            <Button asChild size="lg">
              <Link href={`/research/${projectId}/report`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                View report
              </Link>
            </Button>
          ) : hasBrief ? (
            <Button asChild size="lg">
              <Link href={`/research/${projectId}/generating`}>Generate report</Link>
            </Button>
          ) : null}
          {hasBrief ? (
            <Button variant="secondary" onClick={() => void regenerate()} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {hasReport ? "Regenerate" : "Generate here"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatTile label="Brief" value={hasBrief ? "Ready" : "Missing"} tone={hasBrief ? "emerald" : "amber"} />
        <StatTile label="Experts" value={personaCount || "—"} tone="indigo" />
        <StatTile label="Report" value={hasReport ? "Ready" : "Pending"} tone={hasReport ? "emerald" : "default"} />
      </div>

      {showProgress && isGenerating ? (
        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-indigo-900">
            <Loader2 className="h-4 w-4 animate-spin" />
            {message}
          </p>
          <div className="mt-3">
            <Progress value={progress} />
          </div>
        </div>
      ) : null}

      {!hasBrief ? (
        <p className="mt-4 text-sm text-amber-800">Complete the research wizard to create a brief first.</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
