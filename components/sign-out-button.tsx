"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <Button className={compact ? "" : "w-full"} onClick={signOut} size={compact ? "sm" : "default"} variant="ghost">
      <LogOut className="mr-2 h-4 w-4" />
      Sign out
    </Button>
  );
}
