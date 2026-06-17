import { NextResponse } from "next/server";
import { GOOGLE_AI_MODEL } from "@/lib/ai/config";
import { generateResearchInputSchema } from "@/lib/ai/schemas";
import { generateResearchBrief } from "@/lib/ai/research";
import { persistResearchProject } from "@/lib/research/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { stableHash } from "@/lib/utils";

export async function POST(request: Request) {
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

  const input = generateResearchInputSchema.parse(await request.json());
  const questions = input.questions ?? (input.question ? [input.question] : []);
  const inputHash = stableHash(input);

  const { data: aiRun, error: aiRunError } = await supabase
    .from("ai_runs")
    .insert({
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
    const result = await generateResearchBrief({ ...input, questions, question: questions[0] });
    const projectId = await persistResearchProject(supabase, user.id, {
      question: questions[0],
      brief: result.brief
    });

    if (!aiRunError && aiRun?.id) {
      await supabase
        .from("ai_runs")
        .update({
          project_id: projectId,
          output_hash: stableHash(result.brief),
          status: "complete",
          completed_at: new Date().toISOString(),
          config: { source: result.source, promptVersion: result.promptVersion }
        })
        .eq("id", aiRun.id);
    }

    return NextResponse.json({ ...result, projectId });
  } catch (error) {
    if (!aiRunError && aiRun?.id) {
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
