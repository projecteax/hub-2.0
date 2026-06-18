import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Cog,
  Database,
  FileSearch,
  Megaphone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";

export type SlideLayout =
  | "title"
  | "agenda"
  | "statement"
  | "stats"
  | "evaluation"
  | "ladder"
  | "insights"
  | "pillars"
  | "split"
  | "roadmap"
  | "poc-honest"
  | "diagram"
  | "hybrid-ramp"
  | "calibration"
  | "crossfunctional"
  | "ownership"
  | "demo"
  | "close";

export type DiagramNode = {
  id: string;
  label: string;
  sub?: string;
  tone?: "ai" | "human" | "neutral" | "warn" | "success";
};

export type CrossFunctionalRow = {
  team: string;
  icon: LucideIcon;
  needs: string[];
  questions: string[];
  whyItMatters: string;
};

export type RoadmapTheme = {
  focus: string;
  objective: string;
  build: string[];
  validation: string[];
  why: string;
};

export type RoadmapHorizon = {
  horizon: "Q1" | "Q2" | "Q3" | "Beyond";
  focus: string;
  themes: RoadmapTheme[];
};

export type RoadmapPhase = {
  phase: string;
  period: string;
  goal: string;
  items: string[];
  metric: string;
};

export type Slide = {
  id: string;
  section: string;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  bullets?: string[];
  stats?: { value: string; label: string; accent?: string }[];
  items?: { icon?: LucideIcon; title: string; body: string; tag?: string }[];
  columns?: { heading: string; items: string[]; tone?: "in" | "out" | "neutral" | "warn" }[];
  phases?: RoadmapPhase[];
  horizons?: RoadmapHorizon[];
  evaluationSteps?: { label: string; body: string }[];
  pocStatus?: { proves: string[]; gaps: string[] };
  diagramNodes?: DiagramNode[];
  rampStages?: { pct: string; label: string; detail: string }[];
  calibrationSteps?: { label: string; body: string; tone?: "human" | "ai" | "neutral" | "success" }[];
  crossFunctional?: CrossFunctionalRow[];
  ownership?: { own: string[]; delegate: string[] };
  screenshotSlots?: { id: string; label: string; caption: string }[];
};

export const SLIDES: Slide[] = [
  {
    id: "title",
    section: "Intro",
    layout: "title",
    eyebrow: "NewtonX Hub",
    title: "Self-Serve Research on Hub",
    subtitle: "Product plan, feedback synthesis, and prototype"
  },
  {
    id: "agenda",
    section: "Intro",
    layout: "agenda",
    eyebrow: "Agenda",
    title: "Presentation outline",
    bullets: [
      "User feedback synthesis",
      "Product plan — MVP, credibility, persona calibration",
      "Quarterly product roadmap",
      "Cross-functional execution",
      "Prototype walkthrough"
    ]
  },
  {
    id: "assignment",
    section: "Context",
    layout: "statement",
    eyebrow: "Context",
    title: "Hub as a self-serve research platform",
    subtitle: "Synthetic + human research — fast exploration, verified escalation.",
    bullets: [
      "Scope the question with adaptive intake",
      "Deliver a synthesized memo with clear evidence tier",
      "Escalate to human experts when stakes rise"
    ]
  },
  {
    id: "problem-data",
    section: "Context",
    layout: "stats",
    eyebrow: "Business data",
    title: "Why self-serve matters now",
    stats: [
      { value: "34%", label: "Lost deals — timeline", accent: "rose" },
      { value: "24%", label: "Lost deals — budget", accent: "amber" },
      { value: "+44%", label: "Enterprise Tech bookings YoY", accent: "emerald" }
    ]
  },
  {
    id: "evaluation-method",
    section: "Feedback",
    layout: "evaluation",
    eyebrow: "Feedback synthesis",
    title: "How 14 user voices were weighed",
    subtitle: "Pain mapped to win/loss data — not a popularity vote",
    evaluationSteps: [
      {
        label: "Group by decision stakes",
        body: "Fast explorers (Sarah, Natalie) vs. board-grade validators (Catherine, Priya, James) — same product, different moments"
      },
      {
        label: "Align with revenue data",
        body: "58% of losses tied to speed and budget — priority on recoverable deal patterns"
      },
      {
        label: "Apply business filters",
        body: "MVP scope limited to ideas that fit unit economics (~$100/interaction) and protect the expert graph IP"
      }
    ]
  },
  {
    id: "ladder",
    section: "Feedback",
    layout: "ladder",
    eyebrow: "Core insight",
    title: "The Speed–Trust Ladder",
    subtitle: "Different users sit on different rungs — the product must serve both",
    items: [
      { icon: Zap, title: "Explore", body: "Directional answer in 48h — internal planning", tag: "Sarah · Natalie" },
      { icon: ShieldCheck, title: "Validate", body: "Expert attestation before the board", tag: "Catherine · Priya" },
      { icon: TrendingUp, title: "Deep dive", body: "Full SI engagement — $30K–$150K+", tag: "Existing motion" }
    ]
  },
  {
    id: "insights",
    section: "Feedback",
    layout: "insights",
    eyebrow: "What to build",
    title: "Three priorities from the feedback",
    items: [
      {
        icon: Sparkles,
        title: "Adaptive scoping",
        body: "A thinking partner — not a static form. Marcus & Natalie need fast hypothesis tests.",
        tag: "Build"
      },
      {
        icon: FileSearch,
        title: "Audit trail",
        body: "Every claim traceable — sources, credentials, evidence labels. Priya & Greg won't defend data without it.",
        tag: "Build"
      },
      {
        icon: TrendingUp,
        title: "SI pull-through",
        body: "Self-serve as entry point; high-stakes decisions still convert to $120K+ SI expansions.",
        tag: "Build"
      }
    ]
  },
  {
    id: "pillars",
    section: "Product",
    layout: "pillars",
    eyebrow: "Product architecture",
    title: "Three pillars",
    items: [
      { icon: Sparkles, title: "Adaptive scoping", body: "AI clarifying questions — credible today", tag: "Pillar I ✓" },
      { icon: Database, title: "NewtonX-grounded synthesis", body: "RAG on proprietary reports + citations", tag: "Pillar II · Phase 1" },
      { icon: Users, title: "Expert verification", body: "Named experts attest with credentials", tag: "Pillar III ✓ POC" }
    ]
  },
  {
    id: "mvp",
    section: "Product",
    layout: "split",
    eyebrow: "MVP scope",
    title: "Phase 1 pilot — in and out of scope",
    columns: [
      {
        heading: "In scope",
        tone: "in",
        items: [
          "Adaptive wizard + AI brief generation",
          "Hybrid panel: 95% real experts, 5% AI fill",
          "Expert calibration: AI twin vs real survey answers",
          "NewtonX data feed to LLM (curated subset)",
          "Expert verification marketplace",
          "Evidence labels + audit trail"
        ]
      },
      {
        heading: "Out of scope",
        tone: "out",
        items: [
          "Fully AI-generated expert panels",
          "Full historical RAG library",
          "Freemium tier under $500/month",
          "White-label agency channel",
          "Mobile micro-payout marketplace"
        ]
      }
    ]
  },
  {
    id: "poc-honest",
    section: "Prototype",
    layout: "poc-honest",
    eyebrow: "Prototype assessment",
    title: "What the POC proves — and what it doesn't",
    subtitle: "Flow is validated; credibility is not — yet",
    pocStatus: {
      proves: [
        "End-to-end journey: scope → brief → report → verify",
        "Adaptive forms — AI asks the right clarifiers",
        "Expert attestation UX — name, credentials, flags",
        "Evidence states: AI-simulated vs human-verified"
      ],
      gaps: [
        "AI-generated experts are not credible yet",
        "No NewtonX proprietary data in the model",
        "Simulated panel is directional only — not board-ready",
        "Confidence scores are heuristic, not statistical"
      ]
    }
  },
  {
    id: "credibility-adaptive",
    section: "Product",
    layout: "statement",
    eyebrow: "Credibility today",
    title: "Adaptive forms — ready for pilot",
    subtitle: "AI asks clarifying questions; the client answers. No synthetic data claims.",
    bullets: [
      "Scopes methodology, segments, and decision stakes",
      "Structured context passed to every downstream step",
      "Live in the POC"
    ]
  },
  {
    id: "credibility-experts",
    section: "Product",
    layout: "statement",
    eyebrow: "Credibility gap",
    title: "AI experts — not production-ready",
    subtitle: "Synthetic personas cannot replace verified NewtonX experts in Phase 1.",
    bullets: [
      "POC uses 100% simulated panel to demonstrate speed",
      "Production target: 5% AI agents, 95% real experts",
      "Persona quality improves via expert calibration loop (see next slide)"
    ]
  },
  {
    id: "expert-calibration",
    section: "Product",
    layout: "calibration",
    eyebrow: "Persona calibration",
    title: "Duplicate real experts — learn from the delta",
    subtitle:
      "Build on existing expert search and survey questionnaires: match a verified expert, run an AI twin on the same questions, compare answers, fine-tune personas.",
    calibrationSteps: [
      {
        label: "Match real expert",
        body: "NewtonX Graph search selects a verified expert; existing survey / questionnaire flow fields the study",
        tone: "human"
      },
      {
        label: "AI twin predicts",
        body: "A persona model generates what the system believes that expert would answer — same questions, same scope",
        tone: "ai"
      },
      {
        label: "Compare & score",
        body: "Prediction vs actual response — error by question type, segment, and seniority. Low delta = higher persona confidence",
        tone: "neutral"
      },
      {
        label: "Fine-tune & ramp",
        body: "Calibration data tunes personas and sets when AI share can increase — evidence-based, not arbitrary",
        tone: "success"
      }
    ]
  },
  {
    id: "hybrid-ramp",
    section: "Product",
    layout: "hybrid-ramp",
    eyebrow: "Hybrid panel",
    title: "AI share ramps with measured confidence",
    subtitle: "Tunable design — driven by validation outcomes, not a fixed roadmap",
    rampStages: [
      { pct: "5%", label: "Phase 1 pilot", detail: "AI fills gaps only; 95% real NewtonX experts" },
      { pct: "20%", label: "Phase 2 beta", detail: "Personas calibrated against real expert deltas; A/B before ramping AI share" },
      { pct: "50%+", label: "Phase 3+", detail: "Scale only where error rate meets SI quality bar" }
    ]
  },
  {
    id: "verification",
    section: "Product",
    layout: "statement",
    eyebrow: "Trust layer",
    title: "Tier 3 in practice — expert co-signing",
    subtitle: "An optional upgrade on any sourced memo: verified experts attest, flag errors, and put their name on the output.",
    bullets: [
      "Async attestation — not a full SI engagement; minutes, not hours",
      "Evidence label upgrades from sourced → human-verified on co-signed sections",
      "POC proves the UX; Ops capacity and payout model unlock production scale"
    ]
  },
  {
    id: "roadmap",
    section: "Product",
    layout: "roadmap",
    eyebrow: "Product roadmap",
    title: "Quarterly product roadmap",
    subtitle: "Current plan, not a promise: each quarter pairs what ships with how it is validated.",
    horizons: [
      {
        horizon: "Q1",
        focus: "Discovery foundation",
        themes: [
          {
            focus: "Define the right product",
            objective: "Decide which research jobs Hub can credibly support before scaling build.",
            build: [
              "Research-area taxonomy: market landscape, buyer persona, vendor shortlist, TAM, competitive scan",
              "Intake fields: industry, geography, segment, buyer role, urgency, evidence tier",
              "Clickable adaptive intake prototype and SI quality rubric",
              "Source inventory for NewtonX reports, expert survey answers, and open-web data"
            ],
            validation: [
              "Concept testing with target buyers and SI stakeholders",
              "A/B test static brief form vs adaptive intake",
              "Review generated briefs against SI expectations"
            ],
            why: "Prevents a generic AI chatbot and locks the roadmap to repeatable, defensible research use cases."
          }
        ]
      },
      {
        horizon: "Q2",
        focus: "Pilot build",
        themes: [
          {
            focus: "Ship the credible MVP loop",
            objective: "Move from prototype flow to a pilotable self-serve research product.",
            build: [
              "Adaptive intake connected to brief generation",
              "Curated RAG on approved NewtonX research",
              "Labeled memo: AI-simulated, sourced, human-verified",
              "Expert attestation queue using existing Graph matching",
              "Instrumentation for completion, source usage, and verification requests"
            ],
            validation: [
              "Pilot with selected accounts from lost-deal and expansion motions",
              "A/B test memo layout and expert-verification CTA",
              "Compare output quality against SI-written baseline"
            ],
            why: "Tests whether speed plus labeled evidence can create trust without a full SI engagement."
          }
        ]
      },
      {
        horizon: "Q3",
        focus: "Quality and commercial validation",
        themes: [
          {
            focus: "Prove quality, economics, and expansion path",
            objective: "Decide which features earn scale based on usage, quality, and buyer behavior.",
            build: [
              "AI-twin calibration pipeline against real expert survey answers",
              "Quality dashboard for citations, expert deltas, edits, and flags",
              "Packaging experiments: self-serve memo vs verification add-on",
              "SI handoff triggers when project scope exceeds self-serve"
            ],
            validation: [
              "A/B test packaging, trust labels, and escalation prompts",
              "Analyze repeat usage, verification demand, and SI pull-through",
              "Quality review before expanding AI share or research areas"
            ],
            why: "Separates features that feel impressive in demo from features that improve revenue, trust, or margin."
          }
        ]
      },
      {
        horizon: "Beyond",
        focus: "Scale platform",
        themes: [
          {
            focus: "Expand only where the data supports it",
            objective: "Turn Hub into a scalable entry point without weakening NewtonX credibility.",
            build: [
              "Broader research-area coverage with governance by domain",
              "Enterprise controls: permissions, audit log, compliance export",
              "Automated claim-checking and source-quality scoring",
              "Partner and API surfaces for proven workflows"
            ],
            validation: [
              "Cohort analysis by research area and buyer role",
              "Market validation for enterprise packaging and partner channels",
              "Scale gates based on quality, capacity, and SI conversion"
            ],
            why: "Scale should follow proof: defensible quality, repeat demand, and a clear path into strategic insights revenue."
          }
        ]
      }
    ]
  },
  {
    id: "crossfunctional",
    section: "Execution",
    layout: "crossfunctional",
    eyebrow: "Cross-functional execution",
    title: "Dependencies by team",
    crossFunctional: [
      {
        team: "Engineering / AI",
        icon: Cog,
        needs: [
          "Calibration pipeline: AI twin answers same questionnaire as matched expert, store delta",
          "Retrieval on a small curated set of SI reports (pilot scope)",
          "Prompt/version logging on every client-facing artifact"
        ],
        questions: [
          "Can calibration run on top of existing survey fielding — no extra expert burden?",
          "What's the minimum retrieval setup before full vector migration?",
          "Who builds and owns automated claim-checking if added post-pilot?"
        ],
        whyItMatters: "Without this, Hub either ships fast hallucinations or waits months on infra before learning anything."
      },
      {
        team: "Strategic Insights",
        icon: BarChart3,
        needs: [
          "Select which historical reports enter the pilot knowledge base",
          "Written quality bar: internal-use vs board-ready output",
          "List of scoping / desk-research tasks intake can absorb safely"
        ],
        questions: [
          "Which RM workflows today are repeatable enough to automate in v1?",
          "What would make SI comfortable putting Hub output in a client deck — even labeled?",
          "Who signs off when calibration error is 'too high' to ramp AI share?"
        ],
        whyItMatters: "SI reputation is on the line for every output — their rubric becomes the product quality ceiling."
      },
      {
        team: "Operations",
        icon: Users,
        needs: [
          "Expert capacity plan for validation spike post-launch",
          "Async micro-task workflow (not full-hour calls)",
          "Payout model for short attestation tasks"
        ],
        questions: [
          "How many experts can realistically take async validation in the pilot window?",
          "Does pro-rated pay work for 10–15 minute attestations?",
          "What lead time is needed before opening self-serve beyond invite-only?"
        ],
        whyItMatters: "Expert queue is already backlogged — launching without Ops breaks the verification promise."
      },
      {
        team: "Marketing",
        icon: Megaphone,
        needs: [
          "Positioning line that works for regulated buyers",
          "Alignment with brand refresh timeline",
          "Clear language for AI-simulated vs human-verified states"
        ],
        questions: [
          "How should 'AI' appear on the website for pharma and financial services accounts?",
          "Is 'Verified AI' the right frame — or something more conservative?",
          "What proof points can be used before full calibration data exists?"
        ],
        whyItMatters: "Wrong messaging triggers compliance calls and blocks the exact enterprise accounts that matter."
      },
      {
        team: "Sales",
        icon: Building2,
        needs: [
          "Named pilot accounts from existing SI relationships",
          "Comp model that credits Hub usage toward account growth",
          "Talk track: when to lead with Hub vs full SI"
        ],
        questions: [
          "Which lost-deal accounts are right for a pilot re-engagement?",
          "Does hybrid ARR comp solve the 'small deal' concern — or need a different structure?",
          "Who owns the account when Hub activity signals SI opportunity?"
        ],
        whyItMatters: "Sales won't lead with Hub if it feels like a downgrade from six-figure SI deals."
      }
    ]
  },
  {
    id: "ownership",
    section: "Execution",
    layout: "ownership",
    eyebrow: "PM scope",
    title: "Ownership & delegation",
    ownership: {
      own: [
        "Product requirements & user journey",
        "MVP scope & hybrid panel policy",
        "Pilot success metrics & persona calibration thresholds",
        "Pricing mechanics & escalation triggers"
      ],
      delegate: [
        "Engineering sprints & RAG infrastructure",
        "Legal / compliance review",
        "Expert recruiting & payout operations",
        "Sales account mapping & pilot recruitment"
      ]
    }
  },
  {
    id: "demo",
    section: "Prototype",
    layout: "demo",
    eyebrow: "Prototype",
    title: "Hub 2.0 POC — flow demonstration",
    subtitle: "Scope → Brief → Report → Expert verification",
    screenshotSlots: [
      { id: "wizard", label: "Adaptive wizard", caption: "public/screenshots/wizard.png" },
      { id: "report", label: "Report + evidence labels", caption: "public/screenshots/report.png" },
      { id: "verify", label: "Expert attestation", caption: "public/screenshots/verify.png" }
    ],
    bullets: [
      "Adaptive forms — credible",
      "AI experts — demo only",
      "Verification UX — credible path to trust"
    ]
  },
  {
    id: "close",
    section: "Close",
    layout: "close",
    eyebrow: "Takeaway",
    title: "Fast exploration and verified escalation — same product, two moments.",
    subtitle: "The POC shows the journey works. Production credibility depends on expert calibration, proprietary data, and co-signing — in that order.",
    bullets: [
      "Adaptive intake is shippable today",
      "AI personas earn trust only against real expert answers",
      "Human verification is the upgrade path, not a nice-to-have",
      "Roadmap learns before it scales"
    ]
  }
];

export const SECTION_COLORS: Record<string, string> = {
  Intro: "from-indigo-500/20",
  Context: "from-rose-500/15",
  Feedback: "from-sky-500/20",
  Product: "from-indigo-500/20",
  GTM: "from-emerald-500/20",
  Execution: "from-amber-500/20",
  Prototype: "from-cyan-500/20",
  Close: "from-indigo-500/25"
};
