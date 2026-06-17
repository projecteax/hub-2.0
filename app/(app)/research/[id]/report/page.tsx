import { notFound, redirect } from "next/navigation";
import { ReportDashboard } from "@/components/report-dashboard";
import { getUserProfile, isExpertRole } from "@/lib/auth/profile";
import { getReportBundle } from "@/lib/research/report-bundle";
import { listProjectQuestionTexts } from "@/lib/research/server";
import { getProjectValidationSummary } from "@/lib/validation/server";
import { requireUser } from "@/lib/supabase/require-user";

export default async function ResearchReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user.id);
  const bundle = await getReportBundle(supabase, id);

  if (!bundle) {
    notFound();
  }

  if (bundle.reportSections.filter((section) => !section.section_key.startsWith("question_insight_")).length === 0) {
    redirect(`/research/${id}`);
  }

  const questions = await listProjectQuestionTexts(supabase, id);
  const validation = profile && !isExpertRole(profile.role) ? await getProjectValidationSummary(supabase, id) : null;

  return (
    <ReportDashboard
      projectId={id}
      projectTitle={bundle.project.title}
      projectStatus={bundle.project.status}
      validation={validation}
      brief={bundle.brief?.structured_brief ?? null}
      questions={questions}
      personas={bundle.expertPersonas}
      responses={bundle.expertResponses}
      sections={bundle.reportSections}
      metrics={bundle.reportMetrics}
      webSources={bundle.webSources}
    />
  );
}
