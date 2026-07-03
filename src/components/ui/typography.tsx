import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Typography primitives for LensMark.
 *
 * Scale (font-display / serif — Fraunces):
 *   display-hero   text-5xl md:text-7xl   Home hero
 *   display-xl     text-5xl md:text-6xl   Collection title
 *   display-lg     text-4xl               Auth / upload / settings titles
 *   display-md     text-3xl               Section headings, featured names
 *   display-sm     text-2xl               Card headings, empty state titles
 *   display-xs     text-xl                Compact titles
 *
 * Body (sans — Inter): default paragraph = base leading-relaxed.
 * Utilities: `.eyebrow` (all-caps micro-label), `.meta` (tabular numerals).
 */

type DisplaySize = "hero" | "xl" | "lg" | "md" | "sm" | "xs";

const displaySizes: Record<DisplaySize, string> = {
  hero: "text-5xl leading-[1.04] md:text-7xl",
  xl: "text-5xl md:text-6xl",
  lg: "text-4xl",
  md: "text-3xl",
  sm: "text-2xl",
  xs: "text-xl",
};

type DisplayProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | "h2" | "h3" | "h4" | "p";
  size?: DisplaySize;
};

export const Display = React.forwardRef<HTMLHeadingElement, DisplayProps>(
  ({ as: Tag = "h2", size = "md", className, ...props }, ref) => (
    <Tag
      ref={ref as never}
      className={cn("font-display tracking-tight", displaySizes[size], className)}
      {...props}
    />
  ),
);
Display.displayName = "Display";

export const Eyebrow = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("eyebrow", className)} {...props} />
));
Eyebrow.displayName = "Eyebrow";

export const Meta = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span ref={ref} className={cn("meta", className)} {...props} />
));
Meta.displayName = "Meta";

export const Muted = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
Muted.displayName = "Muted";