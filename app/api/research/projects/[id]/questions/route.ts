import { NextResponse } from "next/server";
import { z } from "zod";
import { researchScopeSchema } from "@/lib/ai/schemas";
import {
  getProjectScope,
  replaceAllProjectQuestions,
  saveProjectQuestions
} from "@/lib/research/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  questions: z.array(z.string().min(10)).min(1).max(10),
  scope: researchScopeSchema
});

const patchSchema = z.object({
  questions: z
    .array(
      z.object({
        text: z.string().min(10),
        source: z.enum(["client", "ai_follow_up"]).default("client")
      })
    )
    .min(1)
    .max(20),
  scope: researchScopeSchema.optional()
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
    const input = bodySchema.parse(await request.json());
    await saveProjectQuestions(supabase, projectId, input.questions, input.scope);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save questions." },
      { status: 500 }
    );
  }
}

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
    const input = patchSchema.parse(await request.json());
    const scope = input.scope ?? (await getProjectScope(supabase, projectId));

    if (!scope) {
      return NextResponse.json({ error: "Project scope not found." }, { status: 400 });
    }

    await replaceAllProjectQuestions(supabase, projectId, scope, input.questions);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update questions." },
      { status: 500 }
    );
  }
}
