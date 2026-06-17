import { NextResponse } from "next/server";
import { GOOGLE_AI_MODEL } from "@/lib/ai/config";
import { generateExpertResearchReport } from "@/lib/ai/report-generator";
import type { ReportGenerationEvent } from "@/lib/research/generation-progress";
import {
  assertProjectAccess,
  getProjectBundle,
  listProjectQuestionTexts,
  persistExpertReport
} from "@/lib/research/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { stableHash } from "@/lib/utils";

function encodeSse(event: ReportGenerationEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
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
    await assertProjectAccess(supabase, projectId);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Access denied." },
      { status: 403 }
    );
  }

  const bundle = await getProjectBundle(supabase, projectId);

  if (!bundle?.brief?.structured_brief) {
    return NextResponse.json({ error: "Generate a research brief before running expert research." }, { status: 400 });
  }

  const questions = await listProjectQuestionTexts(supabase, projectId);
  const brief = bundle.brief.structured_brief;
  const inputHash = stableHash({ projectId, brief, questions });

  const writeClient = createSupabaseServiceClient() ?? supabase;

  const { data: aiRun } = await supabase
    .from("ai_runs")
    .insert({
      project_id: projectId,
      model: process.env.GOOGLE_AI_API_KEY ? GOOGLE_AI_MODEL : "deterministic-fallback",
      service_name: "expert-report-generator",
      prompt_version: "expert-report-v3-staged",
      input_hash: inputHash,
      temperature: 0.25,
      status: "started"
    })
    .select("id")
    .maybeSingle();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: ReportGenerationEvent) => {
        controller.enqueue(encoder.encode(encodeSse(event)));
      };

      const updateRunProgress = async (stage: string, message: string, progress: number) => {
        if (!aiRun?.id) return;
        await supabase
          .from("ai_runs")
          .update({
            config: { stage, message, progress }
          })
          .eq("id", aiRun.id);
      };

      try {
        send({ stage: "starting", message: "Starting expert research…", progress: 2 });
        await updateRunProgress("starting", "Starting expert research…", 2);
        await writeClient.from("research_projects").update({ status: "generating" }).eq("id", projectId);

        const result = await generateExpertResearchReport({ brief, questions }, async (progress) => {
          send(progress);
          await updateRunProgress(progress.stage, progress.message, progress.progress);
        });

        send({ stage: "saving", message: "Saving report to your workspace…", progress: 98 });
        await updateRunProgress("saving", "Saving report to your workspace…", 98);

        await persistExpertReport(writeClient, user.id, projectId, result.report);

        if (aiRun?.id) {
          await supabase
            .from("ai_runs")
            .update({
              output_hash: stableHash(result.report),
              status: "complete",
              completed_at: new Date().toISOString(),
              config: { source: result.source, promptVersion: result.promptVersion, progress: 100 }
            })
            .eq("id", aiRun.id);
        }

        send({
          done: true,
          projectId,
          personaCount: result.report.personas.length,
          sectionCount: result.report.sections.length,
          source: result.source
        });
      } catch (error) {
        await writeClient.from("research_projects").update({ status: "brief_ready" }).eq("id", projectId);

        const message = error instanceof Error ? error.message : "Report generation failed";
        const rlsHint =
          message.includes("row-level security") && !process.env.SUPABASE_SERVICE_ROLE_KEY
            ? " Add SUPABASE_SERVICE_ROLE_KEY to .env.local or run supabase/migrations/006_report_generation_policies.sql in the SQL Editor."
            : "";

        if (aiRun?.id) {
          await supabase
            .from("ai_runs")
            .update({
              status: "failed",
              error_message: `${message}${rlsHint}`,
              completed_at: new Date().toISOString()
            })
            .eq("id", aiRun.id);
        }

        send({ error: `${message}${rlsHint}` });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
