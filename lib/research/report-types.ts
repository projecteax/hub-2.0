import type { EvidenceState } from "@/lib/types";

export type QuestionType = "quantitative" | "qualitative";

export type WebResearchSource = {
  title: string;
  url: string;
  snippet: string;
  relevance: string;
  verified?: boolean;
};

export type Citation = {
  label: string;
  url?: string;
  sourceType: "expert_panel" | "web_research" | "ai_synthesis";
};

export type VirtualExpertPersona = {
  id: string;
  segment: string;
  seniority: string;
  geography: string;
  industryExperience: string;
  companySizeBand: string;
  title?: string;
  organization?: string;
  bio?: string;
  expertiseAreas?: string[];
  yearsExperience?: number;
};

export type VirtualExpertResponse = {
  personaId: string;
  questionKey: string;
  questionText: string;
  questionType: QuestionType;
  adoptionStage?: string;
  satisfactionScore?: number;
  purchaseDriver?: string;
  keyConcern?: string;
  numericValue?: number;
  numericUnit?: string;
  openAnswer?: string;
  confidence: number;
  reasoningSummary: string;
  citations?: Citation[];
};

export type ReportMetric = {
  key: string;
  title: string;
  chartType: "bar" | "horizontal_bar" | "pie" | "donut" | "line" | "radar" | "stat";
  data: Array<Record<string, string | number>>;
  evidenceState: EvidenceState;
  questionKey?: string;
  questionType?: QuestionType;
  unit?: string;
  description?: string;
};

export type ReportSection = {
  key: string;
  title: string;
  content: string;
  confidenceLevel: number;
  evidenceState: EvidenceState;
  citations?: Citation[];
};

export type QuestionInsight = {
  questionKey: string;
  questionText: string;
  questionType: QuestionType;
  headline: string;
  summary: string;
};

export type ResearchReport = {
  brief: import("@/lib/types").ResearchBrief;
  personas: VirtualExpertPersona[];
  responses: VirtualExpertResponse[];
  sections: ReportSection[];
  metrics: ReportMetric[];
  questionInsights: QuestionInsight[];
  webSources: WebResearchSource[];
  validationGaps: string[];
};
