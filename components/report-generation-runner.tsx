"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  isGenerationDone,
  isGenerationError,
  type ReportGenerationEvent
} from "@/lib/research/generation-progress";

async function readSseStream(response: Response, onEvent: (event: ReportGenerationEvent) => void) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream from server.");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const line = chunk.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.replace(/^data:\s*/, "");
      if (payload) onEvent(JSON.parse(payload) as ReportGenerationEvent);
    }
  }
}

type UseReportGenerationOptions = {
  projectId: string;
  redirectTo: string;
  autostart?: boolean;
};

export function useReportGeneration({ projectId, redirectTo, autostart = false }: UseReportGenerationOptions) {
  const router = useRouter();
  const started = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Preparing expert research…");
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const startGeneration = useCallback(async () => {
    if (started.current) return;
    started.current = true;
    setIsGenerating(true);
    setError(null);
    setProgress(2);
    setMessage("Starting expert research…");

    try {
      const response = await fetch(`/api/research/projects/${projectId}/generate-report`, { method: "POST" });

      if (!response.ok && response.headers.get("content-type")?.includes("application/json")) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Report generation failed.");
      }
      if (!response.ok) throw new Error("Report generation failed.");

      await readSseStream(response, (event) => {
        if (isGenerationError(event)) throw new Error(event.error);
        if (isGenerationDone(event)) {
          setProgress(100);
          setMessage("Report ready — redirecting…");
          setIsComplete(true);
          router.push(redirectTo);
          router.refresh();
          return;
        }
        setProgress(event.progress);
        setMessage(event.message);
      });
    } catch (generationError) {
      started.current = false;
      setError(generationError instanceof Error ? generationError.message : "Report generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }, [projectId, redirectTo, router]);

  useEffect(() => {
    if (autostart) void startGeneration();
  }, [autostart, startGeneration]);

  return { startGeneration, isGenerating, progress, message, error, isComplete };
}

export function ReportGenerationRunner({
  projectId,
  redirectTo,
  autostart = true,
  title = "Generating your research report",
  subtitle
}: {
  projectId: string;
  redirectTo: string;
  autostart?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const { startGeneration, isGenerating, progress, message, error, isComplete } = useReportGeneration({
    projectId,
    redirectTo,
    autostart
  });

  const stages = [
    { key: "sources", label: "Desk research", at: 5 },
    { key: "personas", label: "Expert panel", at: 12 },
    { key: "responses", label: "Expert interviews", at: 40 },
    { key: "synthesis", label: "Synthesis", at: 88 },
    { key: "saving", label: "Saving", at: 98 }
  ];

  const activeIndex = stages.findIndex((stage, index) => {
    const next = stages[index + 1];
    return progress >= stage.at && (!next || progress < next.at);
  });

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="flex items-center gap-3">
          {isComplete ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          )}
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
        </div>

        <p className="mt-6 text-sm font-medium text-indigo-700">{message}</p>
        <div className="mt-4">
          <Progress value={Math.max(progress, 3)} />
        </div>

        <ol className="mt-8 space-y-3">
          {stages.map((stage, index) => {
            const done = progress >= (stages[index + 1]?.at ?? 100);
            const active = index === activeIndex;
            return (
              <li
                key={stage.key}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                  active ? "bg-indigo-50 text-indigo-900" : done ? "text-emerald-700" : "text-slate-400"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    done ? "bg-emerald-100" : active ? "bg-indigo-600 text-white" : "bg-slate-100"
                  }`}
                >
                  {done ? "✓" : index + 1}
                </span>
                {stage.label}
              </li>
            );
          })}
        </ol>

        {error ? (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button
              type="button"
              className="mt-3 font-semibold text-red-800 underline"
              onClick={() => void startGeneration()}
            >
              Try again
            </button>
          </div>
        ) : null}

        {!autostart && !isGenerating && !isComplete && !error ? (
          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white"
            onClick={() => void startGeneration()}
          >
            Start generation
          </button>
        ) : null}
      </div>
    </div>
  );
}
