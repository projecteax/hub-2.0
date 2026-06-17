import { redirect } from "next/navigation";
import { getUserProfile, isExpertRole } from "@/lib/auth/profile";
import { ensureExpertTestAssignment } from "@/lib/validation/server";
import { requireUser } from "@/lib/supabase/require-user";

export default async function ExpertClaimReviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user.id);

  if (!profile || !isExpertRole(profile.role)) {
    redirect("/dashboard");
  }

  const assignmentId = await ensureExpertTestAssignment(supabase, projectId, user.id);
  redirect(`/expert/reviews/${assignmentId}`);
}
