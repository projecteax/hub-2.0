import Link from "next/link";
import { ArrowRight, Clock3, FileBarChart2, FolderKanban, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader, StatTile } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate, formatStatus, listProjects } from "@/lib/research/server";
import { requireUser } from "@/lib/supabase/require-user";

export default async function DashboardPage() {
  const { supabase } = await requireUser();
  const projects = await listProjects(supabase);

  const briefReadyCount = projects.filter((project) => project.status === "brief_ready").length;
  const reportReadyCount = projects.filter((project) => project.status === "report_ready").length;
  const verifiedCount = projects.filter((project) => project.status === "human_verified").length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Research dashboard"
        description="Launch new studies, track progress, and open visual expert reports."
        actions={
          <Button asChild size="lg">
            <Link href="/research/new">
              <Plus className="mr-2 h-4 w-4" />
              New research
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatTile label="Projects" value={projects.length} icon={FolderKanban} tone="indigo" />
        <StatTile label="Briefs ready" value={briefReadyCount} icon={Sparkles} tone="amber" />
        <StatTile label="Reports ready" value={reportReadyCount} icon={FileBarChart2} tone="emerald" />
        <StatTile label="Human verified" value={verifiedCount} icon={ShieldCheck} tone="emerald" />
      </section>

      <section className="glass-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-semibold text-slate-950">How AI is used in your research</p>
          <p className="mt-1 text-sm text-slate-600">
            See the exact guidelines for each wizard step, brief generation, expert panel, and report synthesis.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/about">
            View methodology <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      <section className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Your research</h2>
          <p className="text-sm text-slate-500">{projects.length} total</p>
        </div>

        {projects.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-lg font-semibold text-slate-900">No research yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Start with scope and questions — the wizard builds your brief and runs the expert panel automatically.
            </p>
            <Button asChild className="mt-6">
              <Link href="/research/new">
                Start research <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-50"
                  href={`/research/${project.id}`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          project.status === "human_verified"
                            ? "emerald"
                            : project.status === "report_ready"
                              ? "emerald"
                              : project.status === "validation_requested"
                                ? "amber"
                                : "sky"
                        }
                      >
                        {formatStatus(project.status)}
                      </Badge>
                      {project.status === "human_verified" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Expert verified
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatRelativeDate(project.updated_at)}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-base font-semibold text-slate-950">{project.title}</p>
                    {project.decision_context ? (
                      <p className="mt-1 truncate text-sm text-slate-500">{project.decision_context}</p>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700">
                    Open <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
