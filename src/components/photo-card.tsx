import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { buildSrcSet, DEFAULT_SIZES, displayUrl } from "@/lib/photo-urls";
import type { Photo } from "@/lib/photo-types";

type PhotoCardPhoto = Photo & {
  profiles?: {
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

type PhotoCardProps = {
  photo: PhotoCardPhoto;
  /** Give the LCP candidate `priority` so the browser preloads it. */
  priority?: boolean;
  /** Hide the caption/meta strip (used by grid variants that only show tiles). */
  showMeta?: boolean;
};

export function PhotoCard({ photo, priority = false, showMeta = true }: PhotoCardProps) {
  const src = displayUrl(photo, "medium");
  const srcSet = buildSrcSet(photo);
  return (
    <div className="mb-5 break-inside-avoid sm:mb-7">
      <Link
        to="/p/$id"
        params={{ id: photo.id }}
        className="group block overflow-hidden rounded-xl bg-card shadow-[var(--shadow-soft)] ring-1 ring-foreground/[0.06] transition-[box-shadow,transform] duration-500 ease-[var(--ease-luxury)] hover:shadow-[var(--shadow-elegant)] hover:ring-foreground/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative overflow-hidden bg-[image:var(--gradient-surface)]">
          <img
            src={src}
            srcSet={srcSet}
            sizes={DEFAULT_SIZES}
            alt={photo.caption ?? "Untitled photograph"}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding={priority ? "sync" : "async"}
            width={photo.width ?? undefined}
            height={photo.height ?? undefined}
            onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
            className="w-full opacity-0 transition-[opacity,transform] duration-[900ms] ease-[var(--ease-luxury)] group-hover:scale-[1.015]"
          />
        </div>
        {showMeta && (
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {photo.profiles?.display_name ?? photo.profiles?.username ?? "Unknown"}
              </p>
              {photo.created_at && (
                <p className="meta truncate text-xs text-muted-foreground">
                  @{photo.profiles?.username ?? "anon"} ·{" "}
                  {formatDistanceToNow(new Date(photo.created_at), { addSuffix: true })}
                </p>
              )}
            </div>
            <div className="meta flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3.5 w-3.5 text-gold/80" strokeWidth={1.5} />
              {photo.appreciations_count ?? 0}
            </div>
          </div>
        )}
      </Link>
    </div>
  );
}