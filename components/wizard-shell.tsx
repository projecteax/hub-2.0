"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type WizardStep = {
  id: string;
  label: string;
  description?: string;
};

export function WizardShell({
  steps,
  currentStepId,
  title,
  description,
  children,
  preview
}: {
  steps: WizardStep[];
  currentStepId: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  preview?: React.ReactNode;
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);
  const progress = Math.round(((currentIndex + 1) / steps.length) * 100);

  return (
    <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="glass-card h-fit p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Research wizard</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
        <div className="mt-5">
          <Progress value={progress} />
          <p className="mt-2 text-xs text-slate-500">
            Step {currentIndex + 1} of {steps.length}
          </p>
        </div>
        <ol className="mt-6 space-y-2">
          {steps.map((step, index) => {
            const done = index < currentIndex;
            const active = step.id === currentStepId;
            return (
              <li
                key={step.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm",
                  active && "bg-indigo-50 text-indigo-950",
                  done && !active && "text-emerald-700",
                  !done && !active && "text-slate-400"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    active && "bg-indigo-600 text-white",
                    done && !active && "bg-emerald-100 text-emerald-700",
                    !done && !active && "bg-slate-100"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div>
                  <p className="font-medium">{step.label}</p>
                  {step.description ? <p className="text-xs opacity-80">{step.description}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="space-y-6">
        <div className="glass-card p-6 sm:p-8">{children}</div>
        {preview ? <div className="glass-card p-6">{preview}</div> : null}
      </div>
    </div>
  );
}
