import { notFound, redirect } from "next/navigation";
import { ExpertVerificationSubmitted } from "@/components/expert-verification-submitted";
import { ExpertVerificationWorkspace } from "@/components/expert-verification-workspace";
import { getExpertProfile, getUserProfile, isExpertRole } from "@/lib/auth/profile";
import { getReportBundle } from "@/lib/research/report-bundle";
import { listProjectQuestionTexts } from "@/lib/research/server";
import { getAssignmentForExpert } from "@/lib/validation/server";
import { requireUser } from "@/lib/supabase/require-user";

export default async function ExpertReviewPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user.id);

  if (!profile || !isExpertRole(profile.role)) {
    redirect("/dashboard");
  }

  const assignment = await getAssignmentForExpert(supabase, assignmentId, user.id);
  if (!assignment) {
    notFound();
  }

  const expertProfile = await getExpertProfile(supabase, user.id);
  const request = assignment.validation_requests as {
    research_projects: {
      id: string;
      title: string;
    };
  };

  const project = request.research_projects;
  const bundle = await getReportBundle(supabase, project.id);
  const { data: projectContext } = await supabase
    .from("research_projects")
    .select("organizations(name)")
    .eq("id", project.id)
    .maybeSingle();

  const sections = bundle?.reportSections ?? [];
  const metrics = bundle?.reportMetrics ?? [];
  const questions = await listProjectQuestionTexts(supabase, project.id);
  const organization = projectContext?.organizations as { name?: string } | { name?: string }[] | null;
  const clientCompanyName = Array.isArray(organization) ? organization[0]?.name : organization?.name;

  const flags = (assignment.validation_flags ?? []) as Array<{
    section_key: string | null;
    flag_type: string;
    comment: string;
  }>;

  if (assignment.status === "submitted") {
    return (
      <ExpertVerificationSubmitted
        projectTitle={project.title}
        sections={sections}
        verdict={assignment.verdict as "verified" | "verified_with_flags" | "unable_to_verify"}
        attestedName={assignment.attested_name ?? profile.full_name ?? ""}
        attestedCredentials={assignment.attested_credentials ?? expertProfile?.credentials ?? ""}
        generalComment={assignment.general_comment}
        submittedAt={assignment.submitted_at ?? assignment.updated_at}
        flags={flags}
      />
    );
  }

  return (
    <ExpertVerificationWorkspace
      assignmentId={assignmentId}
      projectTitle={project.title}
      clientCompanyName={clientCompanyName ?? null}
      brief={bundle?.brief?.structured_brief ?? null}
      clientFields={bundle?.adaptiveAnswers ?? []}
      sections={sections}
      metrics={metrics}
      questions={questions}
      personas={bundle?.expertPersonas ?? []}
      responses={bundle?.expertResponses ?? []}
      defaultName={profile.full_name ?? ""}
      defaultCredentials={expertProfile?.credentials ?? ""}
    />
  );
}
