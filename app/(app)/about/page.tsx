import { PageHeader } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { AI_METHODOLOGY_INTRO, AI_METHODOLOGY_STEPS } from "@/lib/ai/methodology";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Methodology"
        title="How Hub 2.0 uses AI"
        description={AI_METHODOLOGY_INTRO}
      />

      <div className="glass-card border-indigo-100 bg-indigo-50/40 p-5 text-sm leading-6 text-indigo-950">
        Every step below maps to a real prompt in the codebase with a version tag (e.g. brief-generator-v2). Those
        versions are logged on generated artifacts so you can trace what produced each output.
      </div>

      <ol className="space-y-6">
        {AI_METHODOLOGY_STEPS.map((step, index) => (
          <li className="glass-card overflow-hidden" key={step.id}>
            <div className="border-b border-slate-100 px-6 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                  {index + 1}
                </span>
                <Badge tone="slate">{step.stage}</Badge>
                <Badge tone="sky">{step.promptVersion}</Badge>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-slate-950">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.summary}</p>
            </div>
            <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Design guidelines</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  {step.guidelines.map((guideline) => (
                    <li className="flex gap-2" key={guideline}>
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                      <span>{guideline}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Outputs</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  {step.outputs.map((output) => (
                    <li className="flex gap-2" key={output}>
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span>{output}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
