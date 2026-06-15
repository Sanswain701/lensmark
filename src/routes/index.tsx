import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Camera, Sparkles, Eye, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LensMark — Quiet photography, made to be seen" },
      { name: "description", content: "Discover photographers who shoot for the craft. A trust-first community built around identity, collections, and slow viewing." },
      { property: "og:title", content: "LensMark" },
      { property: "og:description", content: "Quiet photography, made to be seen." },
    ],
  }),
  component: Home,
});

type Photo = {
  id: string;
  image_url: string;
  medium_url: string | null;
  thumb_url: string | null;
  caption: string | null;
  created_at: string;
  appreciations_count: number;
  owner_id: string;
  profiles: { username: string; display_name: string | null; avatar_url: string | null } | null;
};

function Home() {
  const { data: photos, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("id,image_url,medium_url,thumb_url,caption,created_at,appreciations_count,owner_id,profiles!photos_owner_id_fkey(username,display_name,avatar_url)")
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return data as unknown as Photo[];
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-24">
        <section className="py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-soft px-3.5 py-1.5 text-[0.6875rem] uppercase tracking-[0.22em] text-gold">
              <Sparkles className="h-3 w-3" strokeWidth={1.5} /> A quieter photo community
            </span>
            <h1 className="font-display mt-8 text-5xl leading-[1.04] md:text-7xl">
              Photography,<br />
              <span className="italic text-muted-foreground">made to be seen.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-[1.7] text-muted-foreground">
              LensMark is a trust-first home for photographers — built around identity,
              collections, and slow viewing. No likes leaderboards. No virality theatre.
              Just images, kept well.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/auth" className="rounded-md bg-primary px-6 py-3 text-sm font-medium tracking-[0.01em] text-primary-foreground shadow-[var(--shadow-soft)] transition-[colors,box-shadow] duration-300 ease-[var(--ease-luxury)] hover:bg-primary/92 hover:shadow-[var(--shadow-elegant)]">
                Create your gallery
              </Link>
              <a href="#feed" className="rounded-md border border-foreground/15 px-6 py-3 text-sm font-medium tracking-[0.01em] text-foreground transition-colors duration-300 ease-[var(--ease-luxury)] hover:border-gold/60 hover:text-gold">
                Browse the latest
              </a>
            </div>
          </div>
        </section>

        <section id="feed" className="border-t border-border/70 pt-14">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Recent uploads</h2>
            <span className="eyebrow">Chronological · No algorithm</span>
          </div>

          {isLoading ? (
            <FeedSkeleton />
          ) : !photos || photos.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 sm:gap-6 lg:columns-3 [column-fill:_balance]">
              {photos.map((p) => (
                <PhotoCard key={p.id} photo={p} />
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="border-t border-border py-10 text-center text-xs text-muted-foreground">
        LensMark · Made by{" "}
        <a
          href="https://instagram.com/sanfrfr._"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground"
        >
          @sanfrfr._
        </a>
      </footer>
    </div>
  );
}

function PhotoCard({ photo }: { photo: Photo }) {
  const display = photo.medium_url || photo.image_url;
  const srcSet = photo.thumb_url && photo.medium_url
    ? `${photo.thumb_url} 400w, ${photo.medium_url} 2000w`
    : undefined;
  return (
    <div className="mb-5 break-inside-avoid sm:mb-7">
      <Link
        to="/p/$id"
        params={{ id: photo.id }}
        className="group block overflow-hidden rounded-xl bg-card shadow-[var(--shadow-soft)] ring-1 ring-foreground/[0.06] transition-[box-shadow,transform] duration-500 ease-[var(--ease-luxury)] hover:shadow-[var(--shadow-elegant)] hover:ring-foreground/[0.12]"
      >
        <div className="relative overflow-hidden bg-[image:var(--gradient-surface)]">
          <img
            src={display}
            srcSet={srcSet}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            alt={photo.caption ?? "Untitled"}
            loading="lazy"
            decoding="async"
            onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
            className="w-full opacity-0 transition-[opacity,transform] duration-[900ms] ease-[var(--ease-luxury)] group-hover:scale-[1.015]"
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {photo.profiles?.display_name ?? photo.profiles?.username ?? "Unknown"}
            </p>
            <p className="meta truncate text-xs text-muted-foreground">
              @{photo.profiles?.username ?? "anon"} · {formatDistanceToNow(new Date(photo.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="meta flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-gold/80" strokeWidth={1.5} />
            {photo.appreciations_count}
          </div>
        </div>
      </Link>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="mb-7 break-inside-avoid rounded-xl bg-card ring-1 ring-foreground/[0.06] shadow-[var(--shadow-soft)]">
          <div className="aspect-[4/5] animate-pulse bg-[image:var(--gradient-surface)]" />
          <div className="px-4 py-3">
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-[image:var(--gradient-surface)] p-16 text-center shadow-[var(--shadow-soft)]">
      <Camera className="mx-auto h-8 w-8 text-gold" strokeWidth={1.25} />
      <p className="font-display mt-4 text-2xl">A blank gallery, waiting.</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Be one of the first to share an image. Every photograph here was placed with intent.
      </p>
      <Link to="/auth" className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        <Eye className="h-4 w-4" /> Join LensMark
      </Link>
    </div>
  );
}