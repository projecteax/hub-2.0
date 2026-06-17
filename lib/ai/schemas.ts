import { z } from "zod";

export const researchScopeSchema = z.object({
  industry: z.string().min(2),
  industryCode: z.string().min(2),
  market: z.string().min(2),
  geography: z.string().min(2),
  geographyCode: z.string().min(2),
  companySize: z.string().min(2),
  audience: z.string().min(2),
  decisionStakes: z.string().min(2),
  timeline: z.string().min(2),
  researchType: z.string().min(2)
});

export const generateResearchInputSchema = z.object({
  question: z.string().min(10).optional(),
  questions: z.array(z.string().min(10)).min(1).max(10).optional(),
  scope: researchScopeSchema,
  adaptiveAnswers: z
    .array(
      z.object({
        fieldKey: z.string(),
        questionText: z.string(),
        answerText: z.string()
      })
    )
    .optional()
}).refine((value) => Boolean(value.question?.trim()) || (value.questions?.length ?? 0) > 0, {
  message: "Provide at least one research question."
});

export const researchBriefSchema = z.object({
  title: z.string(),
  objective: z.string(),
  canonicalQuestion: z.string(),
  questionFingerprint: z.string(),
  scope: researchScopeSchema,
  keyQuestions: z.array(z.string()).min(3).max(6),
  methodology: z.object({
    panelSize: z.number().int().min(0).max(200).optional(),
    panelType: z.string(),
    segments: z.array(z.string()).min(1).max(6),
    confidencePolicy: z.string()
  }),
  outputPlan: z.array(z.string()).min(3).max(8)
});

export type GenerateResearchInput = z.infer<typeof generateResearchInputSchema>;
