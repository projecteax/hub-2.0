import { PageHeader } from "@/components/ui/page-shell";
import { ExpertMarketplaceList } from "@/components/expert-marketplace-list";
import { getExpertMarketplaceBundle } from "@/lib/validation/server";
import { getUserProfile, isExpertRole } from "@/lib/auth/profile";
import { requireUser } from "@/lib/supabase/require-user";
import { redirect } from "next/navigation";

export default async function ExpertMarketplacePage({
  searchParams
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user.id);

  if (!profile || !isExpertRole(profile.role)) {
    redirect("/dashboard");
  }

  const bundle = await getExpertMarketplaceBundle(supabase, user.id);
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Expert marketplace"
        title="Verification queue"
        description={
          bundle.showAllReports
            ? "QA mode: all report-ready projects are listed. Review, attest with credentials, and comment on specific sections."
            : "Reports matched to your industry and geography. Review, attest with credentials, and flag inaccuracies."
        }
      />

      {params.submitted ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Your verification was submitted. The client will see attestation on their dashboard.
        </div>
      ) : null}

      <ExpertMarketplaceList bundle={bundle} />
    </div>
  );
}
