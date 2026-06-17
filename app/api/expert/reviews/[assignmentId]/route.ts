import { NextResponse } from "next/server";
import { submitExpertReview } from "@/lib/validation/server";
import type { SubmitReviewInput } from "@/lib/validation/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserProfile, isExpertRole } from "@/lib/auth/profile";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const { assignmentId } = await params;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(supabase, user.id);
  if (!profile || !isExpertRole(profile.role)) {
    return NextResponse.json({ error: "Expert account required." }, { status: 403 });
  }

  const body = (await request.json()) as SubmitReviewInput;

  if (!body.verdict || !body.attestedName?.trim() || !body.attestedCredentials?.trim()) {
    return NextResponse.json(
      { error: "Verdict, attested name, and credentials are required." },
      { status: 400 }
    );
  }

  try {
    const result = await submitExpertReview(supabase, assignmentId, user.id, {
      ...body,
      flags: body.flags ?? []
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not submit review." },
      { status: 400 }
    );
  }
}
