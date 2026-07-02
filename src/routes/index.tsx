import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Camera, Sparkles, Eye } from "lucide-react";
import { PhotoCard } from "@/components/photo-card";
import { PhotoGrid } from "@/components/photo-grid";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

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
    staleTime: 30_000,
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
      <main id="main" className="mx-auto max-w-6xl px-5 pb-28 md:pb-24">
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
            <PhotoGrid>
              {photos.map((p, i) => (
                <PhotoCard key={p.id} photo={p as any} priority={i < 3} />
              ))}
            </PhotoGrid>
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
      <MobileBottomNav />
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