import { NextResponse } from "next/server";
import { researchScopeSchema } from "@/lib/ai/schemas";
import { getProjectBundle, updateProjectScope } from "@/lib/research/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    const body = await request.json();
    const scope = researchScopeSchema.parse(body.scope);
    const title = typeof body.title === "string" ? body.title.trim() : undefined;
    await updateProjectScope(supabase, user.id, projectId, scope, title);
    const bundle = await getProjectBundle(supabase, projectId);

    return NextResponse.json({ ok: true, scope: bundle?.brief?.structured_brief?.scope ?? scope });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update scope." },
      { status: 500 }
    );
  }
}
