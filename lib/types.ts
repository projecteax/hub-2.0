export type EvidenceState = "ai_simulated" | "historical_source_supported" | "human_validated";

export type ResearchScope = {
  industry: string;
  industryCode: string;
  market: string;
  geography: string;
  geographyCode: string;
  companySize: string;
  audience: string;
  decisionStakes: string;
  timeline: string;
  researchType: string;
};

export type AdaptiveQuestion = {
  id: string;
  fieldKey: keyof ResearchScope | "businessContext" | "successCriteria" | "competitiveSet" | "budgetRange";
  question: string;
  helper: string;
  options?: string[];
};

export type FollowUpSuggestion = {
  id: string;
  question: string;
  rationale: string;
  status: "pending" | "accepted" | "edited" | "dismissed";
  editedQuestion?: string;
};

export type DbResearchQuestion = {
  id: string;
  original_question: string;
  canonical_question: string;
  sort_order: number;
  status: string;
  source: string;
};

export type ResearchBrief = {
  title: string;
  objective: string;
  canonicalQuestion: string;
  questionFingerprint: string;
  scope: ResearchScope;
  keyQuestions: string[];
  methodology: {
    panelSize?: number;
    panelType: string;
    segments: string[];
    confidencePolicy: string;
  };
  outputPlan: string[];
};

export type VirtualExpertPersona = {
  id: string;
  segment: string;
  seniority: string;
  geography: string;
  industryExperience: string;
  companySizeBand: string;
};

export type VirtualExpertResponse = {
  personaId: string;
  adoptionStage: string;
  satisfactionScore: number;
  purchaseDriver: string;
  keyConcern: string;
  confidence: number;
  reasoningSummary: string;
};

export type ReportMetric = {
  key: string;
  title: string;
  chartType: "bar" | "radar" | "line";
  data: Array<Record<string, string | number>>;
  evidenceState: EvidenceState;
};

export type ReportSection = {
  key: string;
  title: string;
  content: string;
  confidenceLevel: number;
  evidenceState: EvidenceState;
};

export type ResearchReport = {
  brief: ResearchBrief;
  personas: VirtualExpertPersona[];
  responses: VirtualExpertResponse[];
  sections: ReportSection[];
  metrics: ReportMetric[];
  validationGaps: string[];
};

export type ProjectSummary = {
  id: string;
  title: string;
  status: string;
  evidenceState: EvidenceState;
  updatedAt: string;
  geography: string;
  market: string;
};
