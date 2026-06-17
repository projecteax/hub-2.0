import { NextResponse } from "next/server";
import { z } from "zod";
import { refineResearchBriefWithAi } from "@/lib/ai/brief-editor";
import { GOOGLE_AI_MODEL } from "@/lib/ai/config";
import { researchBriefSchema } from "@/lib/ai/schemas";
import { generateResearchBrief } from "@/lib/ai/research";
import {
  listAdaptiveAnswers,
  listProjectQuestionTexts,
  getFormSession,
  getProjectScope,
  persistResearchBriefForProject
} from "@/lib/research/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { stableHash } from "@/lib/utils";

const refineSchema = z.object({
  action: z.literal("refine"),
  instruction: z.string().min(5),
  brief: researchBriefSchema
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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
    const body = z.object({ brief: researchBriefSchema }).parse(await request.json());
    const questions = await listProjectQuestionTexts(supabase, projectId);

    await persistResearchBriefForProject(supabase, user.id, projectId, {
      questions,
      brief: body.brief
    });

    return NextResponse.json({ ok: true, brief: body.brief, projectId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save brief." },
      { status: 500 }
    );
  }
}

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

  const rawBody = await request.json().catch(() => ({}));

  if (rawBody?.action === "refine") {
    try {
      const body = refineSchema.parse(rawBody);
      const questions = await listProjectQuestionTexts(supabase, projectId);
      const result = await refineResearchBriefWithAi({
        brief: body.brief,
        instruction: body.instruction,
        questions
      });

      return NextResponse.json({ ...result, projectId });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Refinement failed." },
        { status: 500 }
      );
    }
  }

  const scope = await getProjectScope(supabase, projectId);
  const questions = await listProjectQuestionTexts(supabase, projectId);

  if (!scope || questions.length === 0) {
    return NextResponse.json({ error: "Add at least one question before generating the brief." }, { status: 400 });
  }

  const session = await getFormSession(supabase, projectId);
  const adaptiveAnswers = session ? await listAdaptiveAnswers(supabase, session.id) : [];

  const input = {
    questions,
    question: questions[0],
    scope,
    adaptiveAnswers
  };

  const inputHash = stableHash(input);

  const { data: aiRun } = await supabase
    .from("ai_runs")
    .insert({
      project_id: projectId,
      model: process.env.GOOGLE_AI_API_KEY ? GOOGLE_AI_MODEL : "deterministic-fallback",
      service_name: "brief-generator",
      prompt_version: "brief-generator-v2",
      input_hash: inputHash,
      temperature: 0.2,
      status: "started"
    })
    .select("id")
    .maybeSingle();

  try {
    const result = await generateResearchBrief(input);
    await persistResearchBriefForProject(supabase, user.id, projectId, {
      questions,
      brief: result.brief
    });

    if (aiRun?.id) {
      await supabase
        .from("ai_runs")
        .update({
          output_hash: stableHash(result.brief),
          status: "complete",
          completed_at: new Date().toISOString(),
          config: { source: result.source, promptVersion: result.promptVersion }
        })
        .eq("id", aiRun.id);
    }

    return NextResponse.json({ ...result, projectId });
  } catch (error) {
    if (aiRun?.id) {
      await supabase
        .from("ai_runs")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown generation error",
          completed_at: new Date().toISOString()
        })
        .eq("id", aiRun.id);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown generation error" },
      { status: 500 }
    );
  }
}
