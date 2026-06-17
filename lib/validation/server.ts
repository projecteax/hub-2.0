import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { pickTopExperts, type ScoredExpert } from "@/lib/validation/matching";
import type {
  AssignmentStatus,
  ExpertMarketplaceBundle,
  ExpertMarketplaceItem,
  ProjectValidationSummary,
  SubmitReviewInput,
  ValidationAssignment,
  ValidationStatus
} from "@/lib/validation/types";
import { sendExpertVerificationInvite } from "@/lib/email/send";
import type { ExpertProfile } from "@/lib/auth/profile";
import { EXPERT_MARKETPLACE_SHOW_ALL } from "@/lib/validation/config";

const TARGET_EXPERT_COUNT = 3;

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function mapAssignmentRow(row: {
  id: string;
  status: string;
  match_score: number;
  invited_at: string;
  submitted_at?: string | null;
  verdict?: string | null;
  validation_requests: unknown;
}): ExpertMarketplaceItem {
  const request = asSingle(
    row.validation_requests as
      | {
          id: string;
          status: string;
          project_id: string;
          research_projects:
            | {
                id: string;
                title: string;
                research_briefs: Array<{
                  industry_code: string;
                  geography_code: string;
                  market_segment: string;
                }>;
              }
            | Array<{
                id: string;
                title: string;
                research_briefs: Array<{
                  industry_code: string;
                  geography_code: string;
                  market_segment: string;
                }>;
              }>;
        }
      | Array<{
          id: string;
          status: string;
          project_id: string;
          research_projects: unknown;
        }>
  );

  const project = asSingle(request?.research_projects) as {
    id: string;
    title: string;
    research_briefs: Array<{
      industry_code: string;
      geography_code: string;
      market_segment: string;
    }>;
  } | null;
  const brief = project?.research_briefs?.[0];

  return {
    assignmentId: row.id as string,
    projectId: project?.id ?? "",
    projectTitle: project?.title ?? "Research project",
    industryCode: brief?.industry_code ?? "",
    geographyCode: brief?.geography_code ?? "",
    marketSegment: brief?.market_segment ?? "",
    status: row.status as AssignmentStatus,
    matchScore: Number(row.match_score),
    invitedAt: row.invited_at as string,
    validationStatus: (request?.status ?? "requested") as ValidationStatus,
    verdict: (row.verdict as ExpertMarketplaceItem["verdict"]) ?? null,
    submittedAt: row.submitted_at ?? null
  };
}

export async function listExpertMarketplace(supabase: SupabaseClient, expertUserId: string) {
  const bundle = await getExpertMarketplaceBundle(supabase, expertUserId);
  return [...bundle.open, ...bundle.history, ...bundle.browse];
}

export async function getExpertMarketplaceBundle(
  supabase: SupabaseClient,
  expertUserId: string
): Promise<ExpertMarketplaceBundle> {
  const { data, error } = await supabase
    .from("validation_assignments")
    .select(
      `
      id,
      status,
      match_score,
      invited_at,
      submitted_at,
      verdict,
      validation_requests!inner (
        id,
        status,
        project_id,
        research_projects!inner (
          id,
          title,
          research_briefs (
            industry_code,
            geography_code,
            market_segment
          )
        )
      )
    `
    )
    .eq("expert_user_id", expertUserId)
    .order("invited_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const assignments = (data ?? []).map((row) => mapAssignmentRow(row));
  const open = assignments.filter((item) => item.status === "invited" || item.status === "in_review");
  const history = assignments.filter((item) => item.status === "submitted" || item.status === "declined");

  let browse: ExpertMarketplaceItem[] = [];

  if (EXPERT_MARKETPLACE_SHOW_ALL) {
    const service = createSupabaseServiceClient();
    if (service) {
      const assignedProjectIds = new Set(assignments.map((item) => item.projectId));
      const { data: projects } = await service
        .from("research_projects")
        .select(
          `
          id,
          title,
          status,
          updated_at,
          research_briefs (
            industry_code,
            geography_code,
            market_segment
          )
        `
        )
        .in("status", ["report_ready", "validation_requested", "human_verified"])
        .order("updated_at", { ascending: false });

      browse = (projects ?? [])
        .filter((project) => !assignedProjectIds.has(project.id as string))
        .map((project) => {
          const brief = asSingle(
            project.research_briefs as
              | Array<{ industry_code: string; geography_code: string; market_segment: string }>
              | { industry_code: string; geography_code: string; market_segment: string }
          );

          return {
            assignmentId: null,
            projectId: project.id as string,
            projectTitle: project.title as string,
            industryCode: brief?.industry_code ?? "",
            geographyCode: brief?.geography_code ?? "",
            marketSegment: brief?.market_segment ?? "",
            status: "available" as const,
            matchScore: 0,
            invitedAt: project.updated_at as string,
            validationStatus: "in_progress" as ValidationStatus,
            isBrowseOnly: true
          };
        });
    }
  }

  return {
    open,
    history,
    browse,
    showAllReports: EXPERT_MARKETPLACE_SHOW_ALL
  };
}

/** QA mode: create or return an assignment so any expert can review any report. */
export async function ensureExpertTestAssignment(supabase: SupabaseClient, projectId: string, expertUserId: string) {
  const service = createSupabaseServiceClient();
  if (!service) {
    throw new Error("Service role is required for marketplace QA mode.");
  }

  const { data: requests } = await service.from("validation_requests").select("id").eq("project_id", projectId);
  const requestIds = (requests ?? []).map((row) => row.id as string);

  if (requestIds.length > 0) {
    const { data: existingAssignment } = await supabase
      .from("validation_assignments")
      .select("id, status")
      .eq("expert_user_id", expertUserId)
      .in("validation_request_id", requestIds)
      .order("invited_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingAssignment) {
      return existingAssignment.id as string;
    }
  }

  let requestId: string | null = null;
  const { data: existingRequest } = await service
    .from("validation_requests")
    .select("id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRequest) {
    requestId = existingRequest.id as string;
  } else {
    const { data: newRequest, error: requestError } = await service
      .from("validation_requests")
      .insert({
        project_id: projectId,
        status: "in_progress",
        target_expert_count: 1,
        requested_by: null,
        validation_scope: { qa: true }
      })
      .select("id")
      .single();

    if (requestError || !newRequest) {
      throw new Error(requestError?.message ?? "Could not create validation request.");
    }
    requestId = newRequest.id as string;
  }

  const { data: assignment, error: assignmentError } = await service
    .from("validation_assignments")
    .insert({
      validation_request_id: requestId,
      expert_user_id: expertUserId,
      status: "invited",
      match_score: 0
    })
    .select("id")
    .single();

  if (assignmentError || !assignment) {
    throw new Error(assignmentError?.message ?? "Could not create assignment.");
  }

  return assignment.id as string;
}

export async function getProjectValidationSummary(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectValidationSummary> {
  const { data: request } = await supabase
    .from("validation_requests")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!request) {
    return { request: null, assignments: [], isVerified: false, verifiedExpertCount: 0 };
  }

  const { data: assignments } = await supabase
    .from("validation_assignments")
    .select(
      `
      *,
      profiles:expert_user_id ( full_name ),
      validation_flags ( id, assignment_id, section_key, flag_type, comment )
    `
    )
    .eq("validation_request_id", request.id);

  const mapped = (assignments ?? []).map((row) => ({
    ...(row as ValidationAssignment),
    expertName: (row.profiles as { full_name: string | null } | null)?.full_name ?? null,
    flags: (row.validation_flags ?? []) as ProjectValidationSummary["assignments"][number]["flags"]
  }));

  const verifiedExpertCount = mapped.filter(
    (a) => a.verdict === "verified" || a.verdict === "verified_with_flags"
  ).length;

  return {
    request: {
      id: request.id,
      project_id: request.project_id,
      status: request.status,
      target_expert_count: request.target_expert_count,
      requested_by: request.requested_by,
      created_at: request.created_at,
      completed_at: request.completed_at
    },
    assignments: mapped,
    isVerified: verifiedExpertCount > 0 && request.status === "complete",
    verifiedExpertCount
  };
}

async function loadAvailableExperts(service: SupabaseClient): Promise<ScoredExpert[]> {
  const { data: experts, error } = await service
    .from("expert_profiles")
    .select("*, profiles:user_id ( full_name )")
    .eq("is_available", true);

  if (error) {
    if (error.message.includes("Could not find the table")) {
      throw new Error(
        "Expert marketplace tables are not installed. Run supabase/APPLY_EXPERT_MARKETPLACE.sql in the Supabase SQL Editor, then retry."
      );
    }
    throw new Error(error.message);
  }

  const userIds = (experts ?? []).map((e) => e.user_id as string);
  const emails = new Map<string, string>();

  for (const userId of userIds) {
    const { data } = await service.auth.admin.getUserById(userId);
    if (data.user?.email) {
      emails.set(userId, data.user.email);
    }
  }

  return (experts ?? []).map((row) => ({
    ...(row as ExpertProfile),
    userId: row.user_id as string,
    email: emails.get(row.user_id as string) ?? "",
    fullName: (row.profiles as { full_name: string | null } | null)?.full_name ?? null,
    matchScore: 0
  }));
}

export async function requestHumanVerification(
  supabase: SupabaseClient,
  projectId: string,
  requestedBy: string
) {
  const service = createSupabaseServiceClient();
  if (!service) {
    throw new Error("Service role is required for expert matching.");
  }

  const { data: project, error: projectError } = await supabase
    .from("research_projects")
    .select("id, title, status")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    throw new Error("Project not found.");
  }

  if (project.status !== "report_ready" && project.status !== "validation_requested" && project.status !== "human_verified") {
    throw new Error("Generate a report before requesting human verification.");
  }

  const { data: existing } = await supabase
    .from("validation_requests")
    .select("id, status")
    .eq("project_id", projectId)
    .in("status", ["requested", "in_progress"])
    .maybeSingle();

  if (existing) {
    throw new Error("Verification is already in progress for this project.");
  }

  const { data: brief } = await supabase
    .from("research_briefs")
    .select("industry_code, geography_code, market_segment, structured_brief")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const structured = brief?.structured_brief as { objective?: string; scope?: { market?: string; audience?: string } } | null;
  const context = {
    industryCode: brief?.industry_code ?? "",
    geographyCode: brief?.geography_code ?? "",
    marketSegment: brief?.market_segment ?? structured?.scope?.market ?? "",
    expertiseTags: [structured?.scope?.audience ?? "", structured?.objective ?? ""].filter(Boolean)
  };

  const experts = await loadAvailableExperts(service);
  const selected = pickTopExperts(experts, context, TARGET_EXPERT_COUNT);

  if (selected.length === 0) {
    throw new Error("No available experts match this project. Add expert accounts first.");
  }

  const { data: request, error: requestError } = await service
    .from("validation_requests")
    .insert({
      project_id: projectId,
      status: "in_progress",
      target_expert_count: selected.length,
      requested_by: requestedBy,
      validation_scope: context
    })
    .select("*")
    .single();

  if (requestError || !request) {
    throw new Error(requestError?.message ?? "Could not create validation request.");
  }

  const assignmentRows = selected.map((expert) => ({
    validation_request_id: request.id,
    expert_user_id: expert.userId,
    status: "invited",
    match_score: expert.matchScore
  }));

  const { data: assignments, error: assignmentError } = await service
    .from("validation_assignments")
    .insert(assignmentRows)
    .select("id, expert_user_id, match_score");

  if (assignmentError || !assignments) {
    throw new Error(assignmentError?.message ?? "Could not assign experts.");
  }

  await service.from("research_projects").update({ status: "validation_requested" }).eq("id", projectId);

  await service.from("audit_events").insert({
    project_id: projectId,
    actor_id: requestedBy,
    event_type: "validation.requested",
    event_payload: {
      validation_request_id: request.id,
      expert_count: assignments.length
    }
  });

  for (const assignment of assignments) {
    const expert = selected.find((e) => e.userId === assignment.expert_user_id);
    if (!expert?.email) continue;

    await sendExpertVerificationInvite({
      expertEmail: expert.email,
      expertName: expert.fullName ?? expert.email,
      projectTitle: project.title,
      assignmentId: assignment.id as string,
      matchScore: Number(assignment.match_score)
    });
  }

  return {
    validationRequestId: request.id as string,
    expertCount: assignments.length
  };
}

export async function submitExpertReview(
  supabase: SupabaseClient,
  assignmentId: string,
  expertUserId: string,
  input: SubmitReviewInput
) {
  const service = createSupabaseServiceClient();
  if (!service) {
    throw new Error("Service role is required to finalize verification.");
  }

  const { data: assignment, error } = await supabase
    .from("validation_assignments")
    .select("*, validation_requests!inner ( id, project_id, status )")
    .eq("id", assignmentId)
    .eq("expert_user_id", expertUserId)
    .maybeSingle();

  if (error || !assignment) {
    throw new Error("Assignment not found.");
  }

  if (assignment.status === "submitted") {
    throw new Error("You already submitted this review.");
  }

  const request = assignment.validation_requests as { id: string; project_id: string; status: string };

  const { error: updateError } = await supabase
    .from("validation_assignments")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      verdict: input.verdict,
      attested_name: input.attestedName,
      attested_credentials: input.attestedCredentials,
      general_comment: input.generalComment ?? null
    })
    .eq("id", assignmentId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (input.flags.length > 0) {
    const { error: flagError } = await supabase.from("validation_flags").insert(
      input.flags.map((flag) => ({
        assignment_id: assignmentId,
        section_key: flag.sectionKey ?? null,
        flag_type: flag.flagType ?? "inaccurate",
        comment: flag.comment
      }))
    );

    if (flagError) {
      throw new Error(flagError.message);
    }
  }

  const isPositive = input.verdict === "verified" || input.verdict === "verified_with_flags";

  if (isPositive) {
    await service
      .from("report_sections")
      .update({ evidence_state: "human_validated" })
      .eq("project_id", request.project_id);

    await service
      .from("report_metrics")
      .update({ evidence_state: "human_validated" })
      .eq("project_id", request.project_id);

    await service.from("research_projects").update({ status: "human_verified" }).eq("id", request.project_id);

    await service
      .from("validation_requests")
      .update({ status: "complete", completed_at: new Date().toISOString() })
      .eq("id", request.id);
  }

  await service.from("audit_events").insert({
    project_id: request.project_id,
    actor_id: expertUserId,
    event_type: "validation.review_submitted",
    event_payload: {
      assignment_id: assignmentId,
      verdict: input.verdict,
      flag_count: input.flags.length
    }
  });

  return { projectId: request.project_id, verified: isPositive };
}

export async function getAssignmentForExpert(
  supabase: SupabaseClient,
  assignmentId: string,
  expertUserId: string
) {
  const { data, error } = await supabase
    .from("validation_assignments")
    .select(
      `
      *,
      validation_requests!inner (
        id,
        status,
        project_id,
        research_projects!inner (
          id,
          title,
          research_briefs ( structured_brief, industry_code, geography_code, market_segment )
        )
      ),
      validation_flags ( id, section_key, flag_type, comment )
    `
    )
    .eq("id", assignmentId)
    .eq("expert_user_id", expertUserId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}
