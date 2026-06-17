import type { GenerateResearchInput } from "@/lib/ai/schemas";
import type { ResearchBrief } from "@/lib/types";
import { stableHash } from "@/lib/utils";

function primaryQuestion(input: GenerateResearchInput) {
  return (input.questions?.[0] ?? input.question ?? "").trim();
}

export function buildDeterministicBrief(input: GenerateResearchInput): ResearchBrief {
  const question = primaryQuestion(input);
  const fingerprint = stableHash({
    question: question.toLowerCase(),
    industry: input.scope.industryCode,
    geography: input.scope.geographyCode,
    market: input.scope.market.toLowerCase().trim(),
    audience: input.scope.audience.toLowerCase().trim(),
    researchType: input.scope.researchType
  });

  return {
    title: `${input.scope.market} in ${input.scope.geography}`,
    objective: `Help the client make a ${input.scope.decisionStakes} decision about ${input.scope.market} for ${input.scope.audience}.`,
    canonicalQuestion: `Assess ${input.scope.market} ${input.scope.researchType} across ${input.scope.geography} for ${input.scope.companySize} organizations.`,
    questionFingerprint: fingerprint,
    scope: input.scope,
    keyQuestions: [
      `What is the current level of ${input.scope.market} adoption?`,
      "Which drivers explain the strongest positive signals?",
      "Which frictions create the biggest gap between interest and purchase?",
      "How do findings differ by segment and company size?",
      "Which claims require human expert validation before external use?"
    ],
    methodology: {
      panelType: "Brief scoping only",
      segments: [
        `${input.scope.geography} ${input.scope.companySize}`,
        `${input.scope.industry}`,
        input.scope.audience
      ],
      confidencePolicy:
        "Report confidence is scored from panel consensus (40%), desk research corroboration (30%), question fit (20%), and synthesis clarity (10%). Request human verification for high-stakes use."
    },
    outputPlan: [
      "Executive summary",
      "Adoption and satisfaction metrics",
      "Driver and friction ranking",
      "Segment cuts",
      "Validation gaps",
      "Recommended next actions"
    ]
  };
}
