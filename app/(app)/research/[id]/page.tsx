import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { ProjectActions } from "@/components/project-actions";
import { ProjectWorkspace } from "@/components/project-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-shell";
import { formatRelativeDate, formatStatus, getProjectBundle, healStuckGeneratingProject } from "@/lib/research/server";
import { requireUser } from "@/lib/supabase/require-user";

export default async function ResearchProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const bundle = await getProjectBundle(supabase, id);

  if (!bundle) {
    notFound();
  }

  const { project: rawProject, brief, sections, questions, adaptiveAnswers, personas } = bundle;
  const project = await healStuckGeneratingProject(supabase, id, rawProject, sections.length > 0);
  const briefData = brief?.structured_brief ?? null;
  const hasReport = sections.filter((s) => !s.section_key.startsWith("question_insight_")).length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Research project"
        title={project.title}
        description={briefData?.objective ?? "Complete the wizard to add a research brief."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={hasReport ? "emerald" : "sky"}>{formatStatus(project.status)}</Badge>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            {hasReport ? (
              <Button asChild size="sm">
                <Link href={`/research/${project.id}/report`}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Report
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Updated</p>
            <p className="mt-1 text-lg font-semibold">{formatRelativeDate(project.updated_at)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Questions</p>
            <p className="mt-1 text-lg font-semibold">{questions.length}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Experts</p>
            <p className="mt-1 text-lg font-semibold">{personas.length}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Report</p>
            <p className="mt-1 text-lg font-semibold">{hasReport ? "Ready" : "Pending"}</p>
          </div>
        </div>

        {briefData ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{briefData.scope.market}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{briefData.scope.geography}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{briefData.scope.audience}</span>
          </div>
        ) : null}
      </section>

      <ProjectActions
        projectId={project.id}
        status={project.status}
        hasBrief={Boolean(briefData)}
        hasReport={hasReport}
        personaCount={personas.length}
        questionCount={questions.length}
      />

      {questions.length > 0 ? (
        <section className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Research questions</h2>
          <ol className="mt-4 space-y-2">
            {questions.map((q, index) => (
              <li className="flex gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" key={q.id}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="leading-6 text-slate-800">{q.original_question}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <ProjectWorkspace
        projectId={project.id}
        projectTitle={project.title}
        initialScope={briefData?.scope ?? null}
        initialBrief={briefData}
        initialQuestions={questions}
      />

      {adaptiveAnswers.length > 0 ? (
        <section className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Intake clarifiers</h2>
          <p className="mt-1 text-sm text-slate-500">Answers collected during adaptive scoping</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {adaptiveAnswers.map((answer) => (
              <div className="surface-muted p-4" key={answer.id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 line-clamp-2">
                  {answer.question_text}
                </p>
                <p className="mt-2 text-sm text-slate-800 line-clamp-3">{answer.answer_text}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
