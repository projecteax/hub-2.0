import Link from "next/link";
import { ArrowRight, BarChart3, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";

const pillars = [
  {
    icon: Sparkles,
    title: "Adaptive scoping",
    copy: "Guided intake turns broad business questions into structured research briefs with industry, market, geography, audience, and decision context."
  },
  {
    icon: FileCheck2,
    title: "Repeatable outputs",
    copy: "Canonical question fingerprints, schema validation, and stored versions keep similar asks from drifting into inconsistent answers."
  },
  {
    icon: ShieldCheck,
    title: "Expert validation",
    copy: "Request human verification from matched experts who attest findings with their credentials."
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">{PRODUCT_NAME}</p>
            <p className="text-xs text-slate-500">{PRODUCT_TAGLINE}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Get started</Link>
          </Button>
        </div>
      </nav>

      <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <Badge tone="sky">Self-serve B2B research</Badge>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 md:text-7xl">
              Fast research exploration with expert-grade rigor.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Clients draft a better brief, save structured research projects, and build toward validated outputs with
              visual reports and optional human verification.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/login">
                Start research <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <Card className="space-y-6 p-8">
          {pillars.map((pillar) => (
            <div className="flex gap-4" key={pillar.title}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-800">
                <pillar.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-950">{pillar.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{pillar.copy}</p>
              </div>
            </div>
          ))}
        </Card>
      </section>
    </main>
  );
}
