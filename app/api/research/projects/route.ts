import { NextResponse } from "next/server";
import { z } from "zod";
import { researchScopeSchema } from "@/lib/ai/schemas";
import { createDraftProject } from "@/lib/research/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createProjectSchema = z.object({
  title: z.string().min(3),
  scope: researchScopeSchema
});

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

  try {
    const input = createProjectSchema.parse(await request.json());
    const result = await createDraftProject(supabase, user.id, input);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create project." },
      { status: 500 }
    );
  }
}
