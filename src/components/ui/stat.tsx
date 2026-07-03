import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Display } from "@/components/ui/typography";

type StatProps = {
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
  className?: string;
};

/**
 * Compact statistic card. Used in profile headers and future dashboards.
 * Visual: bordered card, eyebrow label, serif value.
 */
export function Stat({ icon, label, value, className }: StatProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card p-3.5 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div className="eyebrow flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <Display size="sm" as="p" className="mt-1">
        {value}
      </Display>
    </div>
  );
}