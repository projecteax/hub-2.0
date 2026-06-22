import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Cog,
  Database,
  FileSearch,
  Megaphone,
  Sparkles,
  TrendingUp,
  Users
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
    id: "problem-data",
    section: "Context",
    layout: "stats",
    eyebrow: "Business data",
    title: "Why self-serve matters now",
    stats: [
      { value: "34%", label: "Lost deals: timeline", accent: "rose" },
      { value: "24%", label: "Lost deals: budget", accent: "amber" },
      { value: "+44%", label: "Enterprise Tech bookings YoY", accent: "emerald" }
    ]
  },
  {
    id: "evaluation-method",
    section: "Feedback",
    layout: "split",
    eyebrow: "Feedback synthesis",
    title: "Who we built for and who we cut",
    subtitle: "14 voices filtered through win/loss data, unit economics, and NewtonX credibility",
    columns: [
      {
        heading: "Prioritized",
        tone: "in",
        items: [
          "Sarah: directional memo in 48h, upgrade when stakes rise. Maps to timeline losses (34%)",
          "Natalie: stress-test many hypotheses per week without waiting 5 weeks for SI",
          "Marcus: adaptive scoping and follow-ups, not a new project per question",
          "Catherine: expert attestation and evidence labels before board use"
        ]
      },
      {
        heading: "Deprioritized",
        tone: "out",
        items: [
          "Lisa: freemium under $500/mo. Unit economics don't work at MVP",
          "Derek: API and open-source matching. Expert graph stays proprietary",
          "David Kim: same-day live calls. Expert network play, not self-serve memo"
        ]
      }
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
        body: "A thinking partner, not a static form. Marcus and Natalie need fast hypothesis tests.",
        tag: "Build"
      },
      {
        icon: FileSearch,
        title: "Audit trail",
        body: "Every claim traceable through sources, credentials, and evidence labels. Priya and Greg won't defend data without it.",
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
      { icon: Sparkles, title: "Adaptive scoping", body: "AI clarifying questions that turn a raw ask into a structured research brief", tag: "Pillar I" },
      { icon: Database, title: "NewtonX-grounded synthesis", body: "RAG on proprietary reports with citations and labeled evidence", tag: "Pillar II" },
      { icon: Users, title: "Expert verification", body: "Named experts attest findings and put credentials on the output", tag: "Pillar III" }
    ]
  },
  {
    id: "demo",
    section: "Prototype",
    layout: "demo",
    eyebrow: "Prototype",
    title: "Hub 2.0 live walkthrough",
    subtitle: "Scope, brief, report, and expert verification",
    screenshotSlots: [
      { id: "wizard", label: "Launch a study", caption: "Adaptive intake clarifies scope before the brief is accepted." },
      { id: "report", label: "Building your expert research report", caption: "Report generation shows the evidence workflow step by step." },
      { id: "verify", label: "Review and attest", caption: "Experts review sections, add notes, and submit verification." }
    ],
    bullets: [
      "Adaptive forms: credible today",
      "AI experts: demo only",
      "Verification UX: path to trust"
    ]
  },
  {
    id: "poc-honest",
    section: "Prototype",
    layout: "poc-honest",
    eyebrow: "Prototype assessment",
    title: "What the POC proves and what it doesn't",
    subtitle: "Flow is validated; credibility still needs proof",
    pocStatus: {
      proves: [
        "End-to-end journey: scope to brief to report to verify",
        "Adaptive forms: AI asks the right clarifiers",
        "Expert attestation UX: name, credentials, flags",
        "Evidence states: AI-simulated vs human-verified"
      ],
      gaps: [
        "AI-generated experts are not credible yet",
        "No NewtonX proprietary data in the model",
        "Simulated panel is directional only, not board-ready",
        "Confidence scores are heuristic, not statistical"
      ]
    }
  },
  {
    id: "credibility-adaptive",
    section: "Product",
    layout: "statement",
    eyebrow: "Credibility today",
    title: "Adaptive forms are not production-ready yet",
    subtitle: "The POC is early, but it shows this approach can work: AI asks clarifiers, the client answers, no synthetic data claims.",
    bullets: [
      "Scopes methodology, segments, and decision stakes before any report runs",
      "Structured context flows into brief generation and downstream steps",
      "Still needs SI rubric review, edge-case testing, and pilot hardening before we call it shippable"
    ]
  },
  {
    id: "credibility-experts",
    section: "Product",
    layout: "statement",
    eyebrow: "Credibility gap",
    title: "AI experts are not production-ready",
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
    title: "Duplicate real experts and learn from the delta",
    subtitle:
      "Match a verified expert, run an AI twin on the same questions, compare answers, fine-tune personas.",
    calibrationSteps: [
      {
        label: "Match real expert",
        body: "NewtonX Graph search selects a verified expert; existing survey flow fields the study",
        tone: "human"
      },
      {
        label: "AI twin predicts",
        body: "A persona model generates what the system believes that expert would answer on the same questions",
        tone: "ai"
      },
      {
        label: "Compare and score",
        body: "Prediction vs actual response, with error by question type, segment, and seniority. Low delta = higher persona confidence",
        tone: "neutral"
      },
      {
        label: "Fine-tune and ramp",
        body: "Calibration data tunes personas and sets when AI share can increase. Evidence-based, not arbitrary.",
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
    subtitle: "Tunable design driven by validation outcomes, not a fixed roadmap",
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
    title: "Tier 3 in practice: expert co-signing",
    subtitle: "An optional upgrade on any sourced memo: verified experts attest, flag errors, and put their name on the output.",
    bullets: [
      "Async attestation, not a full SI engagement; minutes, not hours",
      "Evidence label upgrades from sourced to human-verified on co-signed sections",
      "POC proves the UX; Ops capacity and payout model unlock production scale"
    ]
  },
  {
    id: "strategy",
    section: "Product",
    layout: "statement",
    eyebrow: "Strategy",
    title: "The POC proves AI helps shape better research",
    subtitle: "Adaptive forms are the clearest signal so far: AI clarifies the ask and produces a tighter brief before any synthetic panel runs.",
    bullets: [
      "Clients answer follow-up questions they would not have thought to scope on a static form",
      "The brief captures methodology, segments, and decision stakes in a format SI can review",
      "PM validation next: concept tests with explorers (Sarah, Natalie) on whether this alone saves scoping time",
      "Market research: A/B static brief vs adaptive intake on brief quality, time to scope, and pilot willingness to pay"
    ]
  },
  {
    id: "roadmap",
    section: "Product",
    layout: "roadmap",
    eyebrow: "Product roadmap",
    title: "Quarterly product roadmap",
    subtitle: "Each quarter pairs what ships with how we validate it.",
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
          "Can calibration run on top of existing survey fielding with no extra expert burden?",
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
          "What would make SI comfortable putting Hub output in a client deck, even labeled?",
          "Who signs off when calibration error is 'too high' to ramp AI share?"
        ],
        whyItMatters: "SI reputation is on the line for every output, so their rubric becomes the product quality ceiling."
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
          "Does pro-rated pay work for 10-15 minute attestations?",
          "What lead time is needed before opening self-serve beyond invite-only?"
        ],
        whyItMatters: "Expert queue is already backlogged. Launching without Ops breaks the verification promise."
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
          "Is 'Verified AI' the right frame, or should it be something more conservative?",
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
          "Does hybrid ARR comp solve the 'small deal' concern, or need a different structure?",
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
        "Client and expert journey: brief to report to verification",
        "MVP scope, phased rollout, and what ships in the pilot",
        "Trust UX: evidence tiers, attestation flow, audit trail",
        "Pilot metrics, success criteria, and go/no-go gates",
        "Feedback synthesis, roadmap priorities, cross-functional alignment"
      ],
      delegate: [
        "Engineering / AI: build, RAG, calibration pipeline, instrumentation",
        "Strategic Insights: output quality bar, methodology, report curation",
        "Operations: expert capacity, matching, async payout workflow",
        "Sales: pilot account selection and SI handoff motion",
        "Legal / Finance: compliance review and pricing/packaging decisions"
      ]
    }
  },
  {
    id: "gtm",
    section: "GTM",
    layout: "split",
    eyebrow: "Go to market",
    title: "Go to market strategy",
    subtitle: "Position, price, and sell without cannibalizing the $120K SI motion Sales already runs",
    columns: [
      {
        heading: "Positioning and pricing",
        tone: "neutral",
        items: [
          "Lead with verified escalation, not \"AI insights in 4 hours.\" Evidenza competes on synthetic speed; NewtonX competes on explore now, attest before the board",
          "Two SKUs per the product brief: the Survey (AI scoping + brief) and the Research Output (synthesized memo). Sarah explicitly said she would pay separately for directional vs validated",
          "Unit economics set the floor: ~$50/expert interaction + ~$50 delivery overhead. No freemium race with DataMesh at $199/mo. Pilot: per-project bundle for scoping + directional memo; verification priced as add-on per attestation",
          "Regulated accounts (James, Catherine): internal-use directional by default; human-verified tier required before anything client-facing"
        ]
      },
      {
        heading: "Launch customers and SI motion",
        tone: "in",
        items: [
          "First pilot cohort (5-10 accounts): existing SI clients in Enterprise Tech (+44% bookings YoY) plus re-engagement on the 38 lost deals where timeline was the blocker",
          "Jordan Reeves profile: prospects in active SI cycles who need proof AI is live today, not on a roadmap",
          "Replicate the motion Sales already trusts: last quarter a $120K SI expansion started as a Hub conversation. AEs lead with scoping; SI owns upgrade when stakes exceed self-serve"
        ]
      }
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
