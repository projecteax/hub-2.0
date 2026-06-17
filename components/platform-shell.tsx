"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileSearch, LayoutDashboard, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";
import { homePathForRole, isExpertRole } from "@/lib/auth/profile";
import { PRODUCT_NAME } from "@/lib/brand";

const clientNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/research/new", label: "New research", icon: Plus },
  { href: "/about", label: "How AI works", icon: FileSearch }
];

const expertNav = [{ href: "/expert/marketplace", label: "Marketplace", icon: ShieldCheck }];

export function PlatformShell({
  children,
  userEmail,
  userRole = "client_admin"
}: {
  children: React.ReactNode;
  userEmail?: string | null;
  userRole?: string;
}) {
  const pathname = usePathname();
  const isExpert = isExpertRole(userRole);
  const navItems = isExpert ? expertNav : clientNav;
  const homeHref = homePathForRole(userRole);
  const isImmersive =
    pathname.includes("/report") || pathname.includes("/generating") || pathname.includes("/expert/reviews");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-slate-200/80 bg-white/80 px-5 py-6 backdrop-blur lg:block">
        <Link className="flex items-center gap-3" href={homeHref}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-500/20">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">{PRODUCT_NAME}</p>
            <p className="text-xs text-slate-500">{isExpert ? "Expert marketplace" : "Research workspace"}</p>
          </div>
        </Link>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
                href={item.href}
                key={item.href}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
          <div className="flex items-start gap-3">
            <FileSearch className="mt-0.5 h-4 w-4 text-indigo-600" />
            <div>
              <p className="text-sm font-semibold text-indigo-950">
                {isExpert ? "Human verification" : "Guided research"}
              </p>
              <p className="mt-1 text-xs leading-5 text-indigo-900/70">
                {isExpert
                  ? "Review matched reports, attest with credentials, and flag inaccuracies."
                  : "Scope → questions → brief → expert panel → visual report."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-slate-200 pt-6">
          {userEmail ? <p className="mb-3 truncate text-xs text-slate-500">{userEmail}</p> : null}
          <SignOutButton />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-5 py-3 backdrop-blur lg:hidden">
          <Link className="text-sm font-semibold text-slate-950" href={homeHref}>
            {PRODUCT_NAME}
          </Link>
          {!isExpert ? (
            <Button asChild size="sm" variant="secondary">
              <Link href="/research/new">New</Link>
            </Button>
          ) : null}
        </header>
        <main className={cn(isImmersive ? "p-0" : "px-5 py-8 lg:px-10")}>{children}</main>
      </div>
    </div>
  );
}
