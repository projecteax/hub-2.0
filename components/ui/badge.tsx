import * as React from "react";
import { cn } from "@/lib/utils";

const toneMap = {
  slate: "bg-slate-100 text-slate-700",
  sky: "bg-sky-100 text-sky-800",
  amber: "bg-amber-100 text-amber-800",
  emerald: "bg-emerald-100 text-emerald-800"
};

export function Badge({
  className,
  tone = "slate",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof toneMap }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", toneMap[tone], className)}
      {...props}
    />
  );
}
