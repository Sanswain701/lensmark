import { Link } from "@tanstack/react-router";
import { EyeOff } from "lucide-react";
import { buildSrcSet, DEFAULT_SIZES, displayUrl } from "@/lib/photo-urls";
import { Eyebrow, Meta } from "@/components/ui/typography";
import type { Frame } from "@/lib/frames";

type Props = {
  frame: Frame;
  handle: string;
  priority?: boolean;
};

/**
 * Frame tile used inside FrameGrid. Serif title, hairline meta, no likes,
 * no follower counts. Draft badge only appears in owner view (parent filters).
 */
export function FrameCard({ frame, handle, priority = false }: Props) {
  const src = displayUrl(frame.cover, "medium");
  const srcSet = buildSrcSet(frame.cover);
  const isDraft = frame.visibility === "draft";
  return (
    <Link
      to="/g/$handle/f/$slug"
      params={{ handle, slug: frame.slug }}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-shadow duration-500 ease-[var(--ease-luxury)] hover:shadow-[var(--shadow-elegant)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative overflow-hidden bg-[image:var(--gradient-surface)]">
        <img
          src={src}
          srcSet={srcSet}
          sizes={DEFAULT_SIZES}
          alt={frame.cover.caption ?? frame.title}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding={priority ? "sync" : "async"}
          width={frame.cover.width ?? undefined}
          height={frame.cover.height ?? undefined}
          className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[var(--ease-luxury)] group-hover:scale-[1.015]"
        />
        {isDraft && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-border bg-background/85 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
            <EyeOff className="h-3 w-3" strokeWidth={1.5} /> Draft
          </span>
        )}
      </div>
      <div className="px-5 py-4">
        <Eyebrow className="text-muted-foreground">Frame</Eyebrow>
        <h3 className="mt-1.5 font-display text-xl tracking-tight text-foreground">
          {frame.title}
        </h3>
        {frame.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {frame.description}
          </p>
        )}
        <Meta className="mt-2 block text-xs text-muted-foreground">
          One photograph
        </Meta>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px scale-x-0 bg-gold transition-transform duration-500 ease-[var(--ease-luxury)] group-hover:scale-x-100"
      />
    </Link>
  );
}