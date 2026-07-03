import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Display, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";

type StatusViewProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

/**
 * Full-screen route status view used by `errorComponent` and
 * `notFoundComponent` on every leaf route. Keeps the header + main
 * landmark for accessibility.
 */
export function StatusView({ title, description, action }: StatusViewProps) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-md p-10 text-center">
        <Display size="sm" as="p">
          {title}
        </Display>
        {description && <Muted className="mt-2">{description}</Muted>}
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </main>
    </div>
  );
}

export function BackHomeLink({ label = "Back home" }: { label?: string }) {
  return (
    <Link
      to="/"
      className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      {label}
    </Link>
  );
}

export function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      Try again
    </Button>
  );
}