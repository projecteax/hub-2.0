import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ className, value }: { className?: string; value: number }) {
  return (
    <ProgressPrimitive.Root className={cn("relative h-2 w-full overflow-hidden rounded-full bg-indigo-100", className)} value={value}>
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
