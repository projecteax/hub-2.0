import { NextResponse } from "next/server";
import { requestHumanVerification } from "@/lib/validation/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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

  const body = (await request.json()) as { projectId?: string };
  if (!body.projectId) {
    return NextResponse.json({ error: "projectId is required." }, { status: 400 });
  }

  try {
    const result = await requestHumanVerification(supabase, body.projectId, user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not request verification." },
      { status: 400 }
    );
  }
}
