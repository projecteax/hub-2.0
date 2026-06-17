export type MethodologyStep = {
  id: string;
  title: string;
  stage: string;
  promptVersion: string;
  summary: string;
  guidelines: string[];
  outputs: string[];
};

export const AI_METHODOLOGY_STEPS: MethodologyStep[] = [
  {
    id: "scope",
    title: "Research scope",
    stage: "Wizard — Step 1",
    promptVersion: "client-input",
    summary:
      "You define industry, geography, company size, audience, and market segment. These fields constrain every downstream step — panel design, web research queries, and confidence scoring.",
    guidelines: [
      "Scope is stored as structured metadata on the project and passed verbatim into every AI call.",
      "Industry and geography codes map to standardized taxonomies used for expert matching.",
      "No AI is invoked at this step; it is pure client input."
    ],
    outputs: ["research_projects scope fields", "research_briefs industry/geography codes"]
  },
  {
    id: "adaptive-intake",
    title: "Adaptive clarifying questions",
    stage: "Wizard — Step 2",
    promptVersion: "adaptive-intake-v1",
    summary:
      "An intake designer model asks one clarifying question at a time until business context, success criteria, stakes, audience, and timeline are covered.",
    guidelines: [
      "Role: expert B2B research intake designer.",
      "Each question must materially change methodology, panel design, or deliverable format.",
      "Only include multiple-choice options when there are 2+ concrete answers; otherwise free text.",
      "Skips fields already answered; completes after business context, success criteria, decision stakes, audience, and timeline.",
      "Falls back to a deterministic question sequence if the model fails."
    ],
    outputs: ["adaptive_form_sessions", "adaptive_form_answers"]
  },
  {
    id: "follow-ups",
    title: "Follow-up question suggestions",
    stage: "Wizard — Step 3",
    promptVersion: "follow-up-suggestions-v1",
    summary:
      "After your core questions and adaptive answers, the system proposes 3–5 additional research questions you can accept, edit, or dismiss.",
    guidelines: [
      "Role: B2B research strategist.",
      "Each suggestion must be distinct from existing client questions and grounded in scope.",
      "Suggestions target segment cuts, adoption drivers/blockers, and human-validation scoping.",
      "Deterministic fallback suggestions are used if the model fails."
    ],
    outputs: ["research_questions (accepted suggestions)"]
  },
  {
    id: "brief",
    title: "Research brief generation",
    stage: "Wizard — Step 4",
    promptVersion: "brief-generator-v2",
    summary:
      "Generates a structured brief: objective, canonical question, key questions, methodology, and output plan.",
    guidelines: [
      "Role: self-serve B2B research brief designer.",
      "Returns strict JSON: title, objective, canonicalQuestion, keyQuestions, methodology, outputPlan.",
      "keyQuestions and outputPlan must be plain string arrays, not nested objects.",
      "methodology includes panelType, segments, and confidencePolicy.",
      "Never claims output is human verified.",
      "Synthesizes one canonical question when multiple client questions are provided.",
      "Temperature 0.2 for consistency."
    ],
    outputs: ["research_briefs.structured_brief", "research_briefs version history"]
  },
  {
    id: "brief-editor",
    title: "Brief refinement",
    stage: "Brief review",
    promptVersion: "brief-editor-v1",
    summary:
      "When you edit the brief with natural-language instructions, the model applies your changes while preserving valid structure.",
    guidelines: [
      "Role: B2B research brief editor for a self-serve platform.",
      "Preserves question fingerprint and valid ResearchBrief schema.",
      "keyQuestions and outputPlan remain plain string arrays.",
      "Uses current brief + project questions + your instruction as context."
    ],
    outputs: ["Updated research_briefs row (new version)"]
  },
  {
    id: "web-research",
    title: "Public source grounding",
    stage: "Report generation",
    promptVersion: "web-research-v1",
    summary:
      "Before the expert panel runs, the system searches credible public sources aligned with market, industry, geography, and top questions.",
    guidelines: [
      "Uses Google Search grounding only — no invented URLs.",
      "Summarizes what credible public sources say about the research focus.",
      "Sources are attached to the report as citations where available.",
      "Skipped when no API key is configured."
    ],
    outputs: ["source_documents", "citation references on report sections"]
  },
  {
    id: "personas",
    title: "Virtual expert panel",
    stage: "Report generation",
    promptVersion: "expert-personas-v1",
    summary:
      "Creates 5–6 AI-simulated executive personas with distinct roles, segments, and viewpoints matched to the brief.",
    guidelines: [
      "Never uses real company names or realistic-sounding fake brands.",
      "Organizations are anonymized labels (e.g. Anonymized Org A).",
      "Bios: 2–3 sentences relevant to the research topic.",
      "expertiseAreas: 3–5 concrete domains.",
      "Segments map to brief methodology segments when possible."
    ],
    outputs: ["virtual_expert_personas"]
  },
  {
    id: "responses",
    title: "Expert interview simulation",
    stage: "Report generation",
    promptVersion: "expert-responses-v1",
    summary:
      "Each persona answers every research question. Quantitative questions get numeric values; qualitative questions get 3–5 sentence answers.",
    guidelines: [
      "Every answer must directly address the exact question text.",
      "Quantitative: numericValue + appropriate unit ($, %, employees, etc.).",
      "Qualitative: concrete examples, tools, processes, or metrics — no platitudes.",
      "Never use placeholder phrases (e.g. simulated response, cautious optimism).",
      "Never mention specific vendor names; use my organization / our team.",
      "Each persona answer must be meaningfully different.",
      "Generic answers trigger an automatic retry with stricter instructions."
    ],
    outputs: ["virtual_expert_responses"]
  },
  {
    id: "synthesis",
    title: "Report synthesis",
    stage: "Report generation",
    promptVersion: "expert-synthesis-v1",
    summary:
      "Aggregates panel responses into executive summary, quantitative findings, qualitative themes, validation gaps, charts, and per-question insights.",
    guidelines: [
      "questionInsights: one per question, grounded in actual response data.",
      "sections: executive_summary, quantitative_findings, qualitative_themes, validation_gaps.",
      "metrics: one chart per quantitative question; chart type chosen adaptively.",
      "Do not invent URLs.",
      "All outputs are labeled AI-simulated until human experts attest."
    ],
    outputs: ["report_sections", "report_metrics", "confidence scores"]
  },
  {
    id: "human-verification",
    title: "Human expert verification",
    stage: "Post-report (optional)",
    promptVersion: "n/a",
    summary:
      "Real experts review the report, attest with name and credentials, and flag or comment on specific sections. This is the only step that produces human-verified evidence.",
    guidelines: [
      "Experts are matched by industry, geography, and expertise tags.",
      "Experts review full report sections and can comment per section.",
      "Positive attestation updates evidence_state to human_validated on sections and metrics.",
      "Client dashboard shows attested name and credentials."
    ],
    outputs: ["validation_assignments", "validation_flags", "human_verified project status"]
  }
];

export const AI_METHODOLOGY_INTRO =
  "Hub 2.0 uses staged AI pipelines with explicit prompt versions. Each step receives your scope, questions, and prior answers as structured context. Outputs are AI-simulated by default; only human expert attestation marks findings as verified.";
