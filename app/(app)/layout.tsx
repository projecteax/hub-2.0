import { PlatformShell } from "@/components/platform-shell";
import { getUserProfile } from "@/lib/auth/profile";
import { requireUser } from "@/lib/supabase/require-user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user.id);

  return (
    <PlatformShell userEmail={user.email} userRole={profile?.role ?? "client_admin"}>
      {children}
    </PlatformShell>
  );
}
