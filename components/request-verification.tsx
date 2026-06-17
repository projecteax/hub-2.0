"use client";

import { useState, useTransition } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProjectValidationSummary } from "@/lib/validation/types";

type RequestVerificationProps = {
  projectId: string;
  projectStatus: string;
  validation: ProjectValidationSummary;
};

export function RequestVerification({ projectId, projectStatus, validation }: RequestVerificationProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canRequest =
    (projectStatus === "report_ready" || projectStatus === "human_verified") &&
    !validation.request &&
    !validation.isVerified;

  const inProgress = validation.request && !validation.isVerified;

  function requestVerification() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const response = await fetch("/api/validation/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Request failed.");
        return;
      }
      setSuccess(`Invited ${payload.expertCount} experts to verify this report.`);
      window.location.reload();
    });
  }

  if (validation.isVerified) {
    return (
      <div className="glass-card border-emerald-200 bg-emerald-50/60 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          <div>
            <p className="font-semibold text-emerald-950">Human verified</p>
            <p className="text-sm text-emerald-800">
              {validation.verifiedExpertCount} expert{validation.verifiedExpertCount === 1 ? "" : "s"} attested this report
              with name and credentials.
            </p>
          </div>
          <Badge tone="emerald">Verified</Badge>
        </div>
        {validation.assignments.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm text-emerald-900">
            {validation.assignments
              .filter((a) => a.verdict === "verified" || a.verdict === "verified_with_flags")
              .map((a) => (
                <li className="rounded-xl bg-white/70 px-3 py-2" key={a.id}>
                  <span className="font-medium">{a.attested_name}</span>
                  <span className="text-emerald-700"> · {a.attested_credentials}</span>
                  {a.verdict === "verified_with_flags" ? (
                    <span className="ml-2 text-amber-700">(with flags)</span>
                  ) : null}
                </li>
              ))}
          </ul>
        ) : null}
      </div>
    );
  }

  if (inProgress) {
    return (
      <div className="glass-card border-amber-200 bg-amber-50/50 p-5">
        <p className="font-semibold text-amber-950">Expert verification in progress</p>
        <p className="mt-1 text-sm text-amber-800">
          {validation.assignments.length} expert{validation.assignments.length === 1 ? "" : "s"} invited · waiting for
          attestation
        </p>
        <ul className="mt-3 space-y-1 text-sm text-amber-900">
          {validation.assignments.map((a) => (
            <li key={a.id}>
              {a.expertName ?? "Expert"} — {a.status.replaceAll("_", " ")}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!canRequest) {
    return null;
  }

  return (
    <div className="glass-card p-5">
      <p className="font-semibold text-slate-950">Request human expert verification</p>
      <p className="mt-1 text-sm text-slate-600">
        We&apos;ll match experts in your industry, email them the report, and collect signed attestation with flags or
        comments.
      </p>
      <Button className="mt-4" onClick={requestVerification} disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
        Request verification
      </Button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-2 text-sm text-emerald-700">{success}</p> : null}
    </div>
  );
}
