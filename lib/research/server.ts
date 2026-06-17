import type { FollowUpSuggestion } from "@/lib/ai/follow-ups";
import type { AdaptiveAnswer } from "@/lib/ai/adaptive";
import type { ResearchBrief, EvidenceState, ResearchScope } from "@/lib/types";
import type { ResearchReport } from "@/lib/research/report-types";
import { persistWebSources } from "@/lib/research/report-bundle";
import { questionInsightToSectionRow } from "@/lib/research/question-insights";
import {
  parseQuestionMeta,
  parseResearchScope,
  scopeWithQuestionMeta,
  type QuestionSource
} from "@/lib/research/question-meta";
import type { SupabaseClient } from "@supabase/supabase-js";
import { stableHash } from "@/lib/utils";

export type DbProject = {
  id: string;
  title: string;
  status: string;
  decision_context: string | null;
  created_at: string;
  updated_at: string;
};

export type DbBrief = {
  id: string;
  project_id: string;
  industry_code: string;
  geography_code: string;
  market_segment: string;
  structured_brief: ResearchBrief;
  methodology: ResearchBrief["methodology"];
};

export type DbFormSession = {
  id: string;
  project_id: string;
  completion_score: number;
  current_step: string;
  missing_fields: string[];
  next_question_history: FollowUpSuggestion[] | unknown;
};

export type DbFormAnswer = {
  id: string;
  field_key: string;
  question_text: string;
  answer_text: string;
  created_at: string;
};

export type DbResearchQuestion = {
  id: string;
  original_question: string;
  canonical_question: string;
  sort_order: number;
  status: string;
  source: string;
};

export function formatStatus(status: string) {
  const labels: Record<string, string> = {
    human_verified: "Human verified",
    validation_requested: "Verification pending",
    report_ready: "Report ready",
    brief_ready: "Brief ready",
    generating: "Generating"
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

export function formatRelativeDate(value: string) {
  const date = new Date(value);
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  return formatter.format(date);
}

export async function getUserOrganizationId(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.organization_id) {
    throw new Error("Organization membership not found for this user.");
  }

  return data.organization_id as string;
}

export async function listProjects(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("research_projects")
    .select("id, title, status, decision_context, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbProject[];
}

export async function getProjectBundle(supabase: SupabaseClient, projectId: string) {
  const { data: project, error: projectError } = await supabase
    .from("research_projects")
    .select("id, title, status, decision_context, created_at, updated_at")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return null;
  }

  const [
    { data: brief },
    { data: sections },
    { data: metrics },
    { data: questions },
    { data: session },
    { data: personas },
    { data: adaptiveAnswers }
  ] = await Promise.all([
    supabase
      .from("research_briefs")
      .select("id, project_id, industry_code, geography_code, market_segment, structured_brief, methodology")
      .eq("project_id", projectId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("report_sections")
      .select("section_key, title, content, confidence_level, evidence_state, sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("report_metrics")
      .select("metric_key, title, chart_type, data, evidence_state")
      .eq("project_id", projectId),
    supabase
      .from("research_questions")
      .select("id, original_question, canonical_question, normalized_scope, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase
      .from("adaptive_form_sessions")
      .select("id, project_id, completion_score, current_step, missing_fields, next_question_history")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("virtual_expert_personas")
      .select("id, persona_key, segment, seniority, geography, industry_experience, company_size_band")
      .eq("project_id", projectId),
    supabase
      .from("adaptive_form_sessions")
      .select("id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(async ({ data: sessionRow }) => {
        if (!sessionRow?.id) return { data: [] as DbFormAnswer[] };
        return supabase
          .from("adaptive_form_answers")
          .select("id, field_key, question_text, answer_text, created_at")
          .eq("session_id", sessionRow.id)
          .order("created_at", { ascending: true });
      })
  ]);

  const mappedQuestions = ((questions ?? []) as Array<{
    id: string;
    original_question: string;
    canonical_question: string;
    normalized_scope: unknown;
    created_at: string;
  }>)
    .map((row, index) => {
      const meta = parseQuestionMeta(row.normalized_scope, index);
      return {
        id: row.id,
        original_question: row.original_question,
        canonical_question: row.canonical_question,
        sort_order: meta.sortOrder,
        status: meta.status,
        source: meta.source
      } satisfies DbResearchQuestion;
    })
    .sort((left, right) => left.sort_order - right.sort_order);

  return {
    project: project as DbProject,
    brief: (brief as DbBrief | null) ?? null,
    sections: sections ?? [],
    metrics: metrics ?? [],
    questions: mappedQuestions,
    session: (session as DbFormSession | null) ?? null,
    adaptiveAnswers: (adaptiveAnswers ?? []) as DbFormAnswer[],
    personas: personas ?? []
  };
}

export async function createDraftProject(
  supabase: SupabaseClient,
  userId: string,
  input: { title: string; scope: ResearchScope }
) {
  const organizationId = await getUserOrganizationId(supabase, userId);

  const { data: project, error: projectError } = await supabase
    .from("research_projects")
    .insert({
      organization_id: organizationId,
      owner_id: userId,
      title: input.title,
      status: "scoping",
      decision_context: input.scope.decisionStakes
    })
    .select("id")
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message ?? "Could not create research project.");
  }

  const projectId = project.id as string;

  const { data: session, error: sessionError } = await supabase
    .from("adaptive_form_sessions")
    .insert({
      project_id: projectId,
      completion_score: 0,
      current_step: "questions",
      missing_fields: ["questions", "adaptive", "follow_ups"]
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    throw new Error(sessionError?.message ?? "Could not create adaptive form session.");
  }

  return { projectId, sessionId: session.id as string, scope: input.scope };
}

export async function saveProjectQuestions(
  supabase: SupabaseClient,
  projectId: string,
  questions: string[],
  scope: ResearchScope
) {
  await supabase.from("research_questions").delete().eq("project_id", projectId);

  const rows = questions.map((question, index) => ({
    project_id: projectId,
    original_question: question.trim(),
    canonical_question: question.trim(),
    question_fingerprint: stableHash({ question: question.toLowerCase().trim(), index }),
    normalized_scope: scopeWithQuestionMeta(scope, {
      sortOrder: index,
      source: "client",
      status: "active"
    })
  }));

  const { error } = await supabase.from("research_questions").insert(rows);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getProjectScope(supabase: SupabaseClient, projectId: string): Promise<ResearchScope | null> {
  const { data } = await supabase
    .from("research_questions")
    .select("normalized_scope")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return parseResearchScope(data?.normalized_scope);
}

export async function listProjectQuestionTexts(supabase: SupabaseClient, projectId: string) {
  const { data, error } = await supabase
    .from("research_questions")
    .select("original_question, normalized_scope, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row, index) => ({
      text: row.original_question as string,
      meta: parseQuestionMeta(row.normalized_scope, index)
    }))
    .filter((row) => row.meta.status === "active")
    .sort((left, right) => left.meta.sortOrder - right.meta.sortOrder)
    .map((row) => row.text);
}

export async function getFormSession(supabase: SupabaseClient, projectId: string) {
  const { data, error } = await supabase
    .from("adaptive_form_sessions")
    .select("id, project_id, completion_score, current_step, missing_fields, next_question_history")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbFormSession | null) ?? null;
}

export async function listAdaptiveAnswers(supabase: SupabaseClient, sessionId: string): Promise<AdaptiveAnswer[]> {
  const { data, error } = await supabase
    .from("adaptive_form_answers")
    .select("field_key, question_text, answer_text")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    fieldKey: row.field_key as string,
    questionText: row.question_text as string,
    answerText: row.answer_text as string
  }));
}

export async function saveAdaptiveAnswer(
  supabase: SupabaseClient,
  sessionId: string,
  answer: AdaptiveAnswer,
  completionScore: number,
  currentStep: string
) {
  const { error: answerError } = await supabase.from("adaptive_form_answers").insert({
    session_id: sessionId,
    field_key: answer.fieldKey,
    question_text: answer.questionText,
    answer_text: answer.answerText,
    normalized_value: { value: answer.answerText }
  });

  if (answerError) {
    throw new Error(answerError.message);
  }

  const { error: sessionError } = await supabase
    .from("adaptive_form_sessions")
    .update({
      completion_score: completionScore,
      current_step: currentStep
    })
    .eq("id", sessionId);

  if (sessionError) {
    throw new Error(sessionError.message);
  }
}

export async function saveFollowUpSuggestions(
  supabase: SupabaseClient,
  sessionId: string,
  suggestions: FollowUpSuggestion[]
) {
  const { error } = await supabase
    .from("adaptive_form_sessions")
    .update({
      current_step: "follow_ups",
      next_question_history: suggestions
    })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function applyFollowUpSuggestions(
  supabase: SupabaseClient,
  projectId: string,
  sessionId: string,
  suggestions: FollowUpSuggestion[],
  scope: ResearchScope
) {
  const accepted = suggestions.filter((item) => item.status === "accepted" || item.status === "edited");

  if (accepted.length > 0) {
    const { data: existing } = await supabase
      .from("research_questions")
      .select("normalized_scope")
      .eq("project_id", projectId);

    const startOrder =
      (existing ?? []).reduce((max, row, index) => {
        const meta = parseQuestionMeta(row.normalized_scope, index);
        return Math.max(max, meta.sortOrder);
      }, -1) + 1;

    const rows = accepted.map((item, index) => {
      const text = (item.editedQuestion ?? item.question).trim();
      return {
        project_id: projectId,
        original_question: text,
        canonical_question: text,
        question_fingerprint: stableHash({ question: text.toLowerCase(), source: "follow_up" }),
        normalized_scope: scopeWithQuestionMeta(scope, {
          sortOrder: startOrder + index,
          source: "ai_follow_up",
          status: "active"
        })
      };
    });

    const { error } = await supabase.from("research_questions").insert(rows);
    if (error) {
      throw new Error(error.message);
    }
  }

  const { error: sessionError } = await supabase
    .from("adaptive_form_sessions")
    .update({
      next_question_history: suggestions,
      current_step: "brief"
    })
    .eq("id", sessionId);

  if (sessionError) {
    throw new Error(sessionError.message);
  }
}

export async function persistResearchBriefForProject(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  input: {
    questions: string[];
    brief: ResearchBrief;
  }
) {
  const organizationId = await getUserOrganizationId(supabase, userId);

  const { error: projectError } = await supabase
    .from("research_projects")
    .update({
      title: input.brief.title,
      status: "brief_ready",
      decision_context: input.brief.scope.decisionStakes
    })
    .eq("id", projectId);

  if (projectError) {
    throw new Error(projectError.message);
  }

  await supabase.from("research_briefs").delete().eq("project_id", projectId);

  const { error: briefError } = await supabase.from("research_briefs").insert({
    project_id: projectId,
    industry_code: input.brief.scope.industryCode,
    geography_code: input.brief.scope.geographyCode,
    market_segment: input.brief.scope.market,
    company_size_band: input.brief.scope.companySize,
    research_type: input.brief.scope.researchType,
    decision_stakes: input.brief.scope.decisionStakes,
    structured_brief: input.brief,
    methodology: input.brief.methodology
  });

  if (briefError) {
    throw new Error(briefError.message);
  }

  const primaryQuestion = input.questions[0] ?? input.brief.canonicalQuestion;

  const { data: primaryQuestionRow } = await supabase
    .from("research_questions")
    .select("id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (primaryQuestionRow?.id) {
    await supabase
      .from("research_questions")
      .update({
        canonical_question: input.brief.canonicalQuestion,
        question_fingerprint: input.brief.questionFingerprint
      })
      .eq("id", primaryQuestionRow.id);
  }

  await supabase
    .from("adaptive_form_sessions")
    .update({
      completion_score: 100,
      current_step: "brief_ready",
      missing_fields: []
    })
    .eq("project_id", projectId);

  await supabase.from("audit_events").insert({
    organization_id: organizationId,
    project_id: projectId,
    actor_id: userId,
    event_type: "research.brief_created",
    event_payload: { title: input.brief.title, primaryQuestion }
  });

  return projectId;
}

export async function persistResearchProject(
  supabase: SupabaseClient,
  userId: string,
  input: {
    question: string;
    brief: ResearchBrief;
  }
) {
  const organizationId = await getUserOrganizationId(supabase, userId);

  const { data: project, error: projectError } = await supabase
    .from("research_projects")
    .insert({
      organization_id: organizationId,
      owner_id: userId,
      title: input.brief.title,
      status: "brief_ready",
      decision_context: input.brief.scope.decisionStakes
    })
    .select("id")
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message ?? "Could not create research project.");
  }

  const projectId = project.id as string;

  const coreInserts = await Promise.all([
    supabase.from("research_questions").insert({
      project_id: projectId,
      original_question: input.question,
      canonical_question: input.brief.canonicalQuestion,
      question_fingerprint: input.brief.questionFingerprint,
      normalized_scope: scopeWithQuestionMeta(input.brief.scope, {
        sortOrder: 0,
        source: "client",
        status: "active"
      })
    }),
    supabase.from("research_briefs").insert({
      project_id: projectId,
      industry_code: input.brief.scope.industryCode,
      geography_code: input.brief.scope.geographyCode,
      market_segment: input.brief.scope.market,
      company_size_band: input.brief.scope.companySize,
      research_type: input.brief.scope.researchType,
      decision_stakes: input.brief.scope.decisionStakes,
      structured_brief: input.brief,
      methodology: input.brief.methodology
    }),
    supabase.from("adaptive_form_sessions").insert({
      project_id: projectId,
      completion_score: 100,
      current_step: "brief_ready",
      missing_fields: []
    })
  ]);

  for (const result of coreInserts) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  await supabase.from("audit_events").insert({
    organization_id: organizationId,
    project_id: projectId,
    actor_id: userId,
    event_type: "research.brief_created",
    event_payload: { title: input.brief.title }
  });

  return projectId;
}

export async function assertProjectAccess(supabase: SupabaseClient, projectId: string) {
  const { data, error } = await supabase
    .from("research_projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Project not found or access denied.");
  }
}

export async function updateProjectScope(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  scope: ResearchScope,
  title?: string
) {
  await assertProjectAccess(supabase, projectId);

  const bundle = await getProjectBundle(supabase, projectId);
  if (!bundle?.brief?.structured_brief) {
    throw new Error("Save a research brief before updating scope.");
  }

  const questions = await listProjectQuestionTexts(supabase, projectId);
  const updatedBrief: ResearchBrief = {
    ...bundle.brief.structured_brief,
    scope,
    ...(title ? { title } : {})
  };

  await persistResearchBriefForProject(supabase, userId, projectId, {
    questions,
    brief: updatedBrief
  });

  const { data: existingQuestions } = await supabase
    .from("research_questions")
    .select("id, normalized_scope")
    .eq("project_id", projectId);

  for (const row of existingQuestions ?? []) {
    const meta = parseQuestionMeta(row.normalized_scope, 0);
    await supabase
      .from("research_questions")
      .update({
        normalized_scope: scopeWithQuestionMeta(scope, meta)
      })
      .eq("id", row.id);
  }
}

export type EditableProjectQuestion = {
  text: string;
  source: QuestionSource;
};

export async function replaceAllProjectQuestions(
  supabase: SupabaseClient,
  projectId: string,
  scope: ResearchScope,
  questions: EditableProjectQuestion[]
) {
  await assertProjectAccess(supabase, projectId);

  const valid = questions.map((item) => ({ ...item, text: item.text.trim() })).filter((item) => item.text.length >= 10);

  if (valid.length === 0) {
    throw new Error("Keep at least one research question with 10 or more characters.");
  }

  await supabase.from("research_questions").delete().eq("project_id", projectId);

  const rows = valid.map((question, index) => ({
    project_id: projectId,
    original_question: question.text,
    canonical_question: question.text,
    question_fingerprint: stableHash({ question: question.text.toLowerCase(), index, source: question.source }),
    normalized_scope: scopeWithQuestionMeta(scope, {
      sortOrder: index,
      source: question.source,
      status: "active"
    })
  }));

  const { error } = await supabase.from("research_questions").insert(rows);
  if (error) {
    throw new Error(error.message);
  }
}

export async function healStuckGeneratingProject(
  supabase: SupabaseClient,
  projectId: string,
  project: DbProject,
  hasReport: boolean
): Promise<DbProject> {
  if (project.status !== "generating" || hasReport) {
    return project;
  }

  const { error } = await supabase
    .from("research_projects")
    .update({ status: "brief_ready" })
    .eq("id", projectId)
    .eq("status", "generating");

  if (error) {
    return project;
  }

  return { ...project, status: "brief_ready" };
}

export async function persistExpertReport(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  report: ResearchReport
) {
  const organizationId = await getUserOrganizationId(supabase, userId);

  await supabase.from("research_projects").update({ status: "generating" }).eq("id", projectId);

  try {
    await Promise.all([
      supabase.from("virtual_expert_personas").delete().eq("project_id", projectId),
      supabase.from("virtual_expert_responses").delete().eq("project_id", projectId),
      supabase.from("report_sections").delete().eq("project_id", projectId),
      supabase.from("report_metrics").delete().eq("project_id", projectId)
    ]);

    const personaRows = report.personas.map((persona, index) => ({
      project_id: projectId,
      persona_key: persona.id || `persona-${index + 1}`,
      segment: persona.segment,
      seniority: persona.seniority,
      geography: persona.geography,
      industry_experience: persona.industryExperience,
      company_size_band: persona.companySizeBand,
      metadata: {
        title: persona.title,
        organization: persona.organization,
        bio: persona.bio,
        expertiseAreas: persona.expertiseAreas,
        yearsExperience: persona.yearsExperience
      },
      disclaimer_state: "ai_simulated" as const
    }));

    const { data: insertedPersonas, error: personaError } = await supabase
      .from("virtual_expert_personas")
      .insert(personaRows)
      .select("id, persona_key");

    if (personaError || !insertedPersonas) {
      throw new Error(personaError?.message ?? "Could not save expert personas.");
    }

    const personaIdByKey = new Map(insertedPersonas.map((row) => [row.persona_key as string, row.id as string]));

    const responseRows = report.responses.map((response) => ({
      project_id: projectId,
      persona_id: personaIdByKey.get(response.personaId) ?? insertedPersonas[0]?.id,
      question_key: response.questionKey,
      answer_value: {
        questionText: response.questionText,
        questionType: response.questionType,
        adoptionStage: response.adoptionStage,
        satisfactionScore: response.satisfactionScore,
        purchaseDriver: response.purchaseDriver,
        keyConcern: response.keyConcern,
        numericValue: response.numericValue,
        numericUnit: response.numericUnit,
        openAnswer: response.openAnswer,
        citations: response.citations ?? []
      },
      confidence: response.confidence,
      reasoning_summary: response.reasoningSummary
    }));

    const { error: responseError } = await supabase.from("virtual_expert_responses").insert(responseRows);
    if (responseError) {
      throw new Error(responseError.message);
    }

    const sectionRows = [
      ...report.sections.map((section, index) => ({
        project_id: projectId,
        section_key: section.key,
        title: section.title,
        content: section.content,
        confidence_level: section.confidenceLevel,
        evidence_state: "ai_simulated" as const,
        citations: section.citations ?? [],
        sort_order: index
      })),
      ...report.questionInsights.map((insight, index) =>
        questionInsightToSectionRow(projectId, insight, 100 + index)
      )
    ];

    const { error: sectionError } = await supabase.from("report_sections").insert(sectionRows);
    if (sectionError) {
      throw new Error(sectionError.message);
    }

    const metricRows = report.metrics.map((metric) => ({
      project_id: projectId,
      metric_key: metric.key,
      title: metric.title,
      chart_type: metric.chartType,
      data: metric.data,
      segment_cuts: {
        questionKey: metric.questionKey,
        questionType: metric.questionType,
        unit: metric.unit,
        description: metric.description
      },
      evidence_state: "ai_simulated" as const
    }));

    const { error: metricError } = await supabase.from("report_metrics").insert(metricRows);
    if (metricError) {
      throw new Error(metricError.message);
    }

    await supabase.from("research_projects").update({ status: "report_ready" }).eq("id", projectId);

    await persistWebSources(supabase, organizationId, projectId, report.webSources);

    await supabase.from("audit_events").insert({
      organization_id: organizationId,
      project_id: projectId,
      actor_id: userId,
      event_type: "research.report_generated",
      event_payload: {
        personaCount: report.personas.length,
        sectionCount: report.sections.length,
        evidenceState: "ai_simulated"
      }
    });
  } catch (error) {
    await supabase.from("research_projects").update({ status: "brief_ready" }).eq("id", projectId);
    throw error;
  }
}

export function primaryEvidenceState(
  sections: Array<{ evidence_state: EvidenceState }>,
  metrics: Array<{ evidence_state: EvidenceState }>
): EvidenceState | null {
  const states = [...sections, ...metrics].map((item) => item.evidence_state);
  if (states.includes("human_validated")) return "human_validated";
  if (states.includes("historical_source_supported")) return "historical_source_supported";
  if (states.includes("ai_simulated")) return "ai_simulated";
  return null;
}

export function parseFollowUpSuggestions(value: unknown): FollowUpSuggestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const parsed: FollowUpSuggestion[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.question !== "string") continue;
    parsed.push({
      id: typeof record.id === "string" ? record.id : stableHash(record.question),
      question: record.question,
      rationale: typeof record.rationale === "string" ? record.rationale : "",
      status: (record.status as FollowUpSuggestion["status"]) ?? "pending",
      editedQuestion: typeof record.editedQuestion === "string" ? record.editedQuestion : undefined
    });
  }

  return parsed;
}
