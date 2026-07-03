import { cn } from "@/lib/utils";

/**
 * Neutral skeleton pulse. Use for measured loading states.
 * Prefer `SkeletonBlock` / `SkeletonLine` for consistent sizing.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3 w-full", className)} />;
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={cn("h-40 w-full rounded-lg", className)} />;
}