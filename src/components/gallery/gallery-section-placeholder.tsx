import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Eyebrow } from "@/components/ui/typography";

type Props = {
  handle: string;
  eyebrow: string;
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
};

/**
 * Standard body used by each future section (Frames/Daily/Stuff/Collections/About)
 * until the section is implemented. Preserves the shell surface, links back Home,
 * and honours the "future sections exist" affordance from the spec.
 */
export function GallerySectionPlaceholder({ eyebrow, icon, title, description, handle }: Props) {
  return (
    <div>
      <Eyebrow className="text-muted-foreground">{eyebrow}</Eyebrow>
      <div className="mt-4">
        <EmptyState
          icon={icon}
          title={title}
          description={description}
          action={
            <Link
              to="/@$handle"
              params={{ handle }}
              className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Back to gallery home
            </Link>
          }
        />
      </div>
    </div>
  );
}