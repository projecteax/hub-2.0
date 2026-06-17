import Link from "next/link";
import { ArrowRight, Clock3, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ExpertMarketplaceBundle } from "@/lib/validation/types";
import { formatRelativeDate } from "@/lib/research/server";

function itemHref(item: ExpertMarketplaceBundle["open"][number]) {
  if (item.assignmentId) {
    return `/expert/reviews/${item.assignmentId}`;
  }
  return `/expert/reviews/claim/${item.projectId}`;
}

function MarketplaceSection({
  title,
  description,
  items,
  emptyLabel
}: {
  title: string;
  description?: string;
  items: ExpertMarketplaceBundle["open"];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <section className="glass-card px-6 py-8 text-center">
        <p className="text-sm font-medium text-slate-700">{emptyLabel}</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      <ul className="glass-card divide-y divide-slate-100 overflow-hidden">
        {items.map((item) => (
          <li key={item.assignmentId ?? item.projectId}>
            <Link
              className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 transition hover:bg-slate-50"
              href={itemHref(item)}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {item.matchScore > 0 ? <Badge tone="sky">{item.matchScore}% match</Badge> : null}
                  {item.isBrowseOnly ? <Badge tone="amber">QA — all reports</Badge> : null}
                  <Badge tone={item.status === "submitted" ? "emerald" : "slate"}>
                    {item.status === "available" ? "available" : item.status.replaceAll("_", " ")}
                  </Badge>
                  {item.verdict ? (
                    <Badge tone={item.verdict === "unable_to_verify" ? "amber" : "emerald"}>
                      {item.verdict.replaceAll("_", " ")}
                    </Badge>
                  ) : null}
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatRelativeDate(item.submittedAt ?? item.invitedAt)}
                  </span>
                </div>
                <p className="mt-2 truncate text-base font-semibold text-slate-950">{item.projectTitle}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.marketSegment || "Research report"} · {item.geographyCode || "Global"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700">
                {item.status === "submitted" ? "View" : "Review"} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ExpertMarketplaceList({ bundle }: { bundle: ExpertMarketplaceBundle }) {
  const isEmpty = bundle.open.length === 0 && bundle.history.length === 0 && bundle.browse.length === 0;

  if (isEmpty) {
    return (
      <div className="glass-card px-6 py-12 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-4 text-lg font-semibold text-slate-900">No verifications yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          When clients request human verification, matched reports appear here. In QA mode, all completed reports are
          also listed below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {bundle.showAllReports && bundle.browse.length > 0 ? (
        <MarketplaceSection
          title="All reports (testing)"
          description="Every report-ready project is visible for QA. You can open and verify any report."
          items={bundle.browse}
          emptyLabel=""
        />
      ) : null}

      <MarketplaceSection
        title="Open verifications"
        description="Assigned reports waiting for your attestation."
        items={bundle.open}
        emptyLabel="No open verifications right now."
      />

      <MarketplaceSection
        title="Past verifications"
        description="Your submitted attestations and section comments."
        items={bundle.history}
        emptyLabel="You have not submitted any verifications yet."
      />
    </div>
  );
}
