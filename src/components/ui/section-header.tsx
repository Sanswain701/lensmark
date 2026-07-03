import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Display, Eyebrow } from "@/components/ui/typography";

type SectionHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  aside?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * Section heading used across feed / profile / collection pages.
 * Pairs a serif title with an optional eyebrow and right-aligned aside.
 */
export function SectionHeader({
  eyebrow,
  title,
  aside,
  size = "md",
  className,
}: SectionHeaderProps) {
  return (
    <header className={cn("mb-5 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <Display size={size === "lg" ? "lg" : size === "sm" ? "sm" : "md"} as="h2">
          {title}
        </Display>
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
  );
}