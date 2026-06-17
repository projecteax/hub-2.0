import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "default"
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: "default" | "indigo" | "emerald" | "amber";
}) {
  const tones = {
    default: "from-slate-50 to-white border-slate-200 text-slate-900",
    indigo: "from-indigo-50 to-white border-indigo-100 text-indigo-950",
    emerald: "from-emerald-50 to-white border-emerald-100 text-emerald-950",
    amber: "from-amber-50 to-white border-amber-100 text-amber-950"
  };

  return (
    <div className={cn("glass-card bg-gradient-to-br p-5", tones[tone])}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-slate-400" /> : null}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500 focus:ring-2"
      {...props}
    />
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500 focus:ring-2"
      {...props}
    />
  );
}
