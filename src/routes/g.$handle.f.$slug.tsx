import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ChevronLeft, ExpandIcon, Pencil, Share2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { StatusView, BackHomeLink, RetryButton } from "@/components/ui/status-view";
import { Display, Eyebrow, Meta } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PhotoViewer } from "@/components/photo-viewer";
import { displayUrl, buildSrcSet, DEFAULT_SIZES } from "@/lib/photo-urls";
import { galleryQueryOptions } from "@/lib/gallery";
import {
  frameBySlugQueryOptions,
  framesListQueryOptions,
} from "@/lib/frames";

export const Route = createFileRoute("/g/$handle/f/$slug")({
  loader: async ({ context, params }) => {
    const gallery = await context.queryClient.ensureQueryData(
      galleryQueryOptions(params.handle),
    );
    if (!gallery.profile) throw notFound();
    const frame = await context.queryClient.ensureQueryData(
      frameBySlugQueryOptions(gallery.profile.id, params.slug),
    );
    if (!frame || frame.visibility !== "published") {
      // Owner may still access drafts; component handles that check.
      return { ownerId: gallery.profile.id, allowDraft: true };
    }
    return { ownerId: gallery.profile.id, allowDraft: false };
  },
  head: ({ params }) => {
    const name = params.slug.replace(/-/g, " ");
    const title = `${name} · Frame · @${params.handle} · LensMark`;
    const description = `${name} — a frame from the portfolio of @${params.handle} on LensMark.`;
    const url = `https://lensmark.lovable.app/g/${params.handle}/f/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: FrameDetailRoute,
  errorComponent: ({ error, reset }) => (
    <StatusView
      title="We couldn't open this frame."
      description={error.message}
      action={<RetryButton onClick={reset} />}
    />
  ),
  notFoundComponent: () => (
    <StatusView title="Frame not found." action={<BackHomeLink />} />
  ),
});

function FrameDetailRoute() {
  const { handle, slug } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const gallery = useSuspenseQuery(galleryQueryOptions(handle));
  const owner = gallery.data.profile!;
  const isOwner = Boolean(user && user.id === owner.id);

  const frameQ = useSuspenseQuery(frameBySlugQueryOptions(owner.id, slug));
  const framesListQ = useQuery(
    framesListQueryOptions(owner.id, { includeDrafts: isOwner }),
  );
  const [viewerOpen, setViewerOpen] = useState(false);

  const frame = frameQ.data;
  const list = framesListQ.data ?? [];

  const { prev, next } = useMemo(() => {
    if (!frame || list.length === 0) return { prev: null, next: null };
    const i = list.findIndex((f) => f.id === frame.id);
    return {
      prev: i > 0 ? list[i - 1] : null,
      next: i >= 0 && i < list.length - 1 ? list[i + 1] : null,
    };
  }, [frame, list]);

  if (!frame) {
    return (
      <StatusView title="Frame not found." action={<BackHomeLink />} />
    );
  }
  if (frame.visibility === "draft" && !isOwner) {
    return (
      <StatusView title="Frame not found." action={<BackHomeLink />} />
    );
  }

  const cover = frame.cover;
  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: frame.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied.");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          to="/g/$handle/frames"
          params={{ handle }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to Frames
        </Link>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                navigate({
                  to: "/g/$handle/frames",
                  params: { handle },
                  search: { edit: frame.id },
                })
              }
            >
              <Pencil className="h-4 w-4" strokeWidth={1.5} /> Edit
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-2" onClick={share}>
            <Share2 className="h-4 w-4" strokeWidth={1.5} /> Share
          </Button>
        </div>
      </div>

      <header className="mb-6">
        <Eyebrow className="text-muted-foreground">Frame</Eyebrow>
        <Display as="h1" size="lg" className="mt-2">
          {frame.title}
        </Display>
        <Meta className="mt-2 block text-xs text-muted-foreground">
          {format(new Date(frame.created_at), "MMMM yyyy")}
          {frame.visibility === "draft" && " · Draft"}
        </Meta>
      </header>

      <button
        type="button"
        onClick={() => setViewerOpen(true)}
        aria-label="Open photograph fullscreen"
        className="group relative block w-full overflow-hidden rounded-2xl bg-[image:var(--gradient-surface)] shadow-[var(--shadow-elegant)] ring-1 ring-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <img
          src={displayUrl(cover, "medium")}
          srcSet={buildSrcSet(cover) ?? undefined}
          sizes={DEFAULT_SIZES}
          alt={cover.caption ?? frame.title}
          width={cover.width ?? undefined}
          height={cover.height ?? undefined}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          className="mx-auto max-h-[80vh] w-full object-contain"
        />
        <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/80 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus:opacity-100">
          <ExpandIcon className="h-3 w-3" strokeWidth={1.5} /> Open
        </span>
      </button>

      {frame.description && (
        <p className="mt-8 max-w-prose whitespace-pre-line text-[15px] leading-[1.75] text-foreground/90">
          {frame.description}
        </p>
      )}

      <nav
        aria-label="Frame navigation"
        className="mt-12 grid grid-cols-2 gap-3 border-t border-border/70 pt-6"
      >
        {prev ? (
          <Link
            to="/g/$handle/f/$slug"
            params={{ handle, slug: prev.slug }}
            className="group flex flex-col rounded-lg border border-border p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowLeft className="h-3 w-3" strokeWidth={1.5} /> Previous
            </span>
            <span className="mt-1 line-clamp-1 font-display text-base">{prev.title}</span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            to="/g/$handle/f/$slug"
            params={{ handle, slug: next.slug }}
            className="group flex flex-col items-end rounded-lg border border-border p-4 text-right transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              Next <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
            </span>
            <span className="mt-1 line-clamp-1 font-display text-base">{next.title}</span>
          </Link>
        ) : (
          <div />
        )}
      </nav>

      <PhotoViewer
        src={displayUrl(cover, "original")}
        alt={cover.caption ?? frame.title}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />

      {framesListQ.isLoading && !list.length && (
        <div className="mt-4"><Skeleton className="h-4 w-24" /></div>
      )}
    </article>
  );
}