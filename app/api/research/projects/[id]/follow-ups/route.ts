import { NextResponse } from "next/server";
import { z } from "zod";
import { generateFollowUpSuggestions, type FollowUpSuggestion } from "@/lib/ai/follow-ups";
import {
  applyFollowUpSuggestions,
  getFormSession,
  getProjectScope,
  listAdaptiveAnswers,
  listProjectQuestionTexts,
  parseFollowUpSuggestions,
  saveFollowUpSuggestions
} from "@/lib/research/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const suggestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  rationale: z.string(),
  status: z.enum(["pending", "accepted", "edited", "dismissed"]),
  editedQuestion: z.string().optional()
});

export function mergeFollowUpSuggestions(
  existing: FollowUpSuggestion[],
  generated: FollowUpSuggestion[]
): FollowUpSuggestion[] {
  const reserved = existing.filter((item) => item.status === "accepted" || item.status === "edited");
  const reservedTexts = new Set(
    reserved.map((item) => (item.editedQuestion ?? item.question).trim().toLowerCase())
  );

  const freshPending = generated.filter((item) => !reservedTexts.has(item.question.trim().toLowerCase()));

  return [...reserved, ...freshPending];
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
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
    const session = await getFormSession(supabase, projectId);
    if (!session) {
      return NextResponse.json({ suggestions: [] });
    }

    return NextResponse.json({ suggestions: parseFollowUpSuggestions(session.next_question_history) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load follow-ups." },
      { status: 500 }
    );
  }
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
    const session = await getFormSession(supabase, projectId);
    const scope = await getProjectScope(supabase, projectId);

    if (!session || !scope) {
      return NextResponse.json({ error: "Project intake is incomplete." }, { status: 400 });
    }

    const existing = parseFollowUpSuggestions(session.next_question_history);
    const clientQuestions = await listProjectQuestionTexts(supabase, projectId);
    const adaptiveAnswers = await listAdaptiveAnswers(supabase, session.id);
    const result = await generateFollowUpSuggestions({ scope, clientQuestions, adaptiveAnswers });
    const merged = mergeFollowUpSuggestions(existing, result.suggestions);

    await saveFollowUpSuggestions(supabase, session.id, merged);

    return NextResponse.json({ ...result, suggestions: merged });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not generate follow-ups." },
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
    const body = z.object({ suggestions: z.array(suggestionSchema) }).parse(await request.json());
    const session = await getFormSession(supabase, projectId);
    const scope = await getProjectScope(supabase, projectId);

    if (!session || !scope) {
      return NextResponse.json({ error: "Project intake is incomplete." }, { status: 400 });
    }

    await applyFollowUpSuggestions(supabase, projectId, session.id, body.suggestions, scope);

    return NextResponse.json({ ok: true, suggestions: body.suggestions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save follow-ups." },
      { status: 500 }
    );
  }
}
