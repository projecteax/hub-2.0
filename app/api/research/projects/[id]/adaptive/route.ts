import { NextResponse } from "next/server";
import { z } from "zod";
import { generateNextAdaptiveQuestion } from "@/lib/ai/adaptive";
import {
  getFormSession,
  getProjectScope,
  listAdaptiveAnswers,
  listProjectQuestionTexts,
  saveAdaptiveAnswer
} from "@/lib/research/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const answerSchema = z.object({
  action: z.literal("answer"),
  fieldKey: z.string(),
  questionText: z.string(),
  answerText: z.string().min(2)
});

const nextSchema = z.object({
  action: z.literal("next")
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const session = await getFormSession(supabase, projectId);

    if (!session) {
      return NextResponse.json({ error: "Adaptive form session not found." }, { status: 404 });
    }

    const scope = await getProjectScope(supabase, projectId);
    if (!scope) {
      return NextResponse.json({ error: "Project scope not found. Save questions first." }, { status: 400 });
    }

    const clientQuestions = await listProjectQuestionTexts(supabase, projectId);
    let answers = await listAdaptiveAnswers(supabase, session.id);

    if (answerSchema.safeParse(body).success) {
      const parsed = answerSchema.parse(body);
      answers = [
        ...answers,
        {
          fieldKey: parsed.fieldKey,
          questionText: parsed.questionText,
          answerText: parsed.answerText
        }
      ];

      await saveAdaptiveAnswer(
        supabase,
        session.id,
        {
          fieldKey: parsed.fieldKey,
          questionText: parsed.questionText,
          answerText: parsed.answerText
        },
        session.completion_score,
        "adaptive"
      );
    } else {
      nextSchema.parse(body);
    }

    const result = await generateNextAdaptiveQuestion({
      scope,
      clientQuestions,
      answers
    });

    if (!result.isComplete && result.question) {
      await supabase
        .from("adaptive_form_sessions")
        .update({
          completion_score: result.completionScore,
          current_step: "adaptive"
        })
        .eq("id", session.id);
    } else {
      await supabase
        .from("adaptive_form_sessions")
        .update({
          completion_score: 100,
          current_step: "follow_ups"
        })
        .eq("id", session.id);
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Adaptive intake failed." },
      { status: 500 }
    );
  }
}
