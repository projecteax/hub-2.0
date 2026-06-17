import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResearchReport, VirtualExpertPersona, VirtualExpertResponse } from "@/lib/research/report-types";
import { getProjectBundle } from "@/lib/research/server";

export type DbExpertPersona = {
  id: string;
  persona_key: string;
  segment: string;
  seniority: string;
  geography: string;
  industry_experience: string;
  company_size_band: string;
  metadata: Record<string, unknown>;
};

export type DbExpertResponse = {
  id: string;
  persona_id: string;
  question_key: string;
  answer_value: Record<string, unknown>;
  confidence: number;
  reasoning_summary: string | null;
};

export type DbReportSection = {
  section_key: string;
  title: string;
  content: string;
  confidence_level: number;
  evidence_state: string;
  citations: unknown;
  sort_order: number;
};

export type DbReportMetric = {
  metric_key: string;
  title: string;
  chart_type: string;
  data: unknown;
  evidence_state: string;
  segment_cuts: Record<string, unknown>;
};

export type DbWebSource = {
  id: string;
  title: string;
  source_type: string;
  metadata: Record<string, unknown>;
};

export async function getReportBundle(supabase: SupabaseClient, projectId: string) {
  const base = await getProjectBundle(supabase, projectId);
  if (!base) return null;

  const organizationId = (
    await supabase.from("research_projects").select("organization_id").eq("id", projectId).maybeSingle()
  ).data?.organization_id as string | undefined;

  const [{ data: personas }, { data: responses }, { data: sections }, { data: metrics }, { data: webSources }] =
    await Promise.all([
      supabase
        .from("virtual_expert_personas")
        .select("id, persona_key, segment, seniority, geography, industry_experience, company_size_band, metadata")
        .eq("project_id", projectId),
      supabase
        .from("virtual_expert_responses")
        .select("id, persona_id, question_key, answer_value, confidence, reasoning_summary")
        .eq("project_id", projectId),
      supabase
        .from("report_sections")
        .select("section_key, title, content, confidence_level, evidence_state, citations, sort_order")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("report_metrics")
        .select("metric_key, title, chart_type, data, evidence_state, segment_cuts")
        .eq("project_id", projectId),
      organizationId
        ? supabase
            .from("source_documents")
            .select("id, title, source_type, metadata")
            .eq("organization_id", organizationId)
            .eq("source_type", "web_research")
        : Promise.resolve({ data: [] as DbWebSource[] })
    ]);

  const filteredWebSources = ((webSources ?? []) as DbWebSource[]).filter(
    (row) => row.metadata?.project_id === projectId && row.metadata?.verified === true
  );

  return {
    ...base,
    expertPersonas: (personas ?? []) as DbExpertPersona[],
    expertResponses: (responses ?? []) as DbExpertResponse[],
    reportSections: (sections ?? []) as DbReportSection[],
    reportMetrics: (metrics ?? []) as DbReportMetric[],
    webSources: filteredWebSources
  };
}

export function mapDbPersonaToView(row: DbExpertPersona): VirtualExpertPersona {
  const meta = row.metadata ?? {};
  return {
    id: row.persona_key,
    dbId: row.id,
    segment: row.segment,
    seniority: row.seniority,
    geography: row.geography,
    industryExperience: row.industry_experience,
    companySizeBand: row.company_size_band,
    title: typeof meta.title === "string" ? meta.title : undefined,
    organization: typeof meta.organization === "string" ? meta.organization : undefined,
    bio: typeof meta.bio === "string" ? meta.bio : undefined,
    expertiseAreas: Array.isArray(meta.expertiseAreas) ? (meta.expertiseAreas as string[]) : undefined,
    yearsExperience: typeof meta.yearsExperience === "number" ? meta.yearsExperience : undefined
  } as VirtualExpertPersona & { dbId: string };
}

export function mapDbResponseToView(
  row: DbExpertResponse,
  personaKeyById: Map<string, string>,
  questions: string[]
): VirtualExpertResponse {
  const av = row.answer_value ?? {};
  const qIndex = Number(row.question_key.replace("q-", "")) || 0;

  return {
    personaId: personaKeyById.get(row.persona_id) ?? row.persona_id,
    questionKey: row.question_key,
    questionText: (av.questionText as string) ?? questions[qIndex] ?? row.question_key,
    questionType: (av.questionType as VirtualExpertResponse["questionType"]) ?? "quantitative",
    adoptionStage: av.adoptionStage as string | undefined,
    satisfactionScore: av.satisfactionScore as number | undefined,
    purchaseDriver: av.purchaseDriver as string | undefined,
    keyConcern: av.keyConcern as string | undefined,
    numericValue: av.numericValue as number | undefined,
    numericUnit: av.numericUnit as string | undefined,
    openAnswer: av.openAnswer as string | undefined,
    confidence: row.confidence,
    reasoningSummary: row.reasoning_summary ?? "",
    citations: Array.isArray(av.citations) ? (av.citations as VirtualExpertResponse["citations"]) : undefined
  };
}

export async function persistWebSources(
  supabase: SupabaseClient,
  organizationId: string,
  projectId: string,
  sources: ResearchReport["webSources"]
) {
  const { data: existing } = await supabase
    .from("source_documents")
    .select("id, metadata")
    .eq("organization_id", organizationId)
    .eq("source_type", "web_research");

  const idsToDelete = (existing ?? [])
    .filter((row) => (row.metadata as Record<string, unknown>)?.project_id === projectId)
    .map((row) => row.id as string);

  if (idsToDelete.length > 0) {
    await supabase.from("source_documents").delete().in("id", idsToDelete);
  }

  if (sources.length === 0) return;

  const verifiedSources = sources.filter((source) => source.verified && source.url);
  if (verifiedSources.length === 0) return;

  await supabase.from("source_documents").insert(
    verifiedSources.map((source) => ({
      organization_id: organizationId,
      title: source.title,
      source_type: "web_research",
      metadata: {
        project_id: projectId,
        url: source.url,
        snippet: source.snippet,
        relevance: source.relevance,
        verified: true
      }
    }))
  );
}
