import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { GALLERY_SECTIONS, type GallerySectionKey } from "@/lib/gallery";

type Props = {
  handle: string;
  hiddenSections?: Set<GallerySectionKey>;
};

/**
 * Six-section rail: horizontal scroll on mobile, sticky-ish inline row on
 * desktop. Order is invariant (spec §2). Active section carries
 * `aria-current="page"`. Empty sections still appear.
 *
 * `hiddenSections` is an owner-only UI-only toggle (spec: Owner Mode) used to
 * preview what visitors would see; hidden items render dimmed with a hint.
 */
export function GalleryNavigation({ handle, hiddenSections }: Props) {
  return (
    <nav
      aria-label="Gallery sections"
      className="sticky top-16 z-30 border-b border-border/60 bg-background/85 backdrop-blur-2xl"
    >
      <div className="mx-auto max-w-5xl">
        <ul
          className={cn(
            "flex snap-x snap-mandatory items-stretch gap-1 overflow-x-auto px-4 md:justify-start md:gap-2 md:overflow-visible md:px-6",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {GALLERY_SECTIONS.map((section) => {
            const hidden = hiddenSections?.has(section.key) ?? false;
            return (
              <li key={section.key} className="flex shrink-0 snap-start">
                <Link
                  to={section.path}
                  params={{ handle }}
                  activeOptions={{ exact: section.exact }}
                  activeProps={{ "aria-current": "page" } as never}
                  className={cn(
                    "group relative inline-flex items-center gap-2 px-3 py-3.5 text-sm text-muted-foreground transition-colors duration-300 ease-[var(--ease-luxury)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:px-4",
                    "data-[status=active]:text-foreground",
                    hidden && "opacity-40",
                  )}
                >
                  <span className="font-display text-[15px] tracking-tight">
                    {section.label}
                  </span>
                  {hidden && (
                    <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Hidden
                    </span>
                  )}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-3 -bottom-px h-px scale-x-0 bg-gold transition-transform duration-300 ease-[var(--ease-luxury)] group-data-[status=active]:scale-x-100"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}