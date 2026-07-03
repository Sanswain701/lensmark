import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Display, Muted } from "@/components/ui/typography";

type Variant = "panel" | "quiet";

type EmptyStateProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: Variant;
  className?: string;
};

/**
 * Unified empty / placeholder surface for LensMark.
 *
 * - `panel` (default): dashed border, warm surface gradient, generous padding.
 *   Use for primary empty states (home feed, collections, profiles).
 * - `quiet`: dashed border only, tighter. Use inside sections/panels.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "panel",
  className,
}: EmptyStateProps) {
  const base =
    variant === "panel"
      ? "rounded-2xl border border-dashed border-border bg-[image:var(--gradient-surface)] p-12 text-center shadow-[var(--shadow-soft)] sm:p-16"
      : "rounded-xl border border-dashed border-border p-10 text-center";

  return (
    <div className={cn(base, className)}>
      {icon && (
        <div className="mx-auto mb-4 text-gold [&_svg]:mx-auto [&_svg]:h-8 [&_svg]:w-8">
          {icon}
        </div>
      )}
      <Display size={variant === "panel" ? "sm" : "xs"} as="p">
        {title}
      </Display>
      {description && (
        <Muted className="mx-auto mt-2 max-w-md">{description}</Muted>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}