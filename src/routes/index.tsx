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
        .select("id,image_url,caption,created_at,appreciations_count,owner_id,profiles!photos_owner_id_fkey(username,display_name,avatar_url)")
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
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3 w-3" /> A quieter photo community
            </span>
            <h1 className="font-display mt-6 text-5xl leading-[1.05] md:text-7xl">
              Photography,<br />
              <span className="italic text-muted-foreground">made to be seen.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              LensMark is a trust-first home for photographers — built around identity,
              collections, and slow viewing. No likes leaderboards. No virality theatre.
              Just images, kept well.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                Create your gallery
              </Link>
              <a href="#feed" className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                Browse the latest
              </a>
            </div>
          </div>
        </section>

        <section id="feed" className="border-t border-border pt-12">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Recent uploads</h2>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Chronological · No algorithm</span>
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
        LensMark · Made for image makers
      </footer>
    </div>
  );
}

function PhotoCard({ photo }: { photo: Photo }) {
  return (
    <div className="mb-4 break-inside-avoid sm:mb-6">
      <Link to="/p/$id" params={{ id: photo.id }} className="group block overflow-hidden rounded-lg border border-border bg-card">
        <div className="relative overflow-hidden bg-muted">
          <img
            src={photo.image_url}
            alt={photo.caption ?? "Untitled"}
            loading="lazy"
            decoding="async"
            onLoad={(e) => e.currentTarget.classList.remove("opacity-0", "blur-md")}
            className="w-full opacity-0 blur-md transition-[opacity,filter,transform] duration-700 ease-out group-hover:scale-[1.02]"
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {photo.profiles?.display_name ?? photo.profiles?.username ?? "Unknown"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              @{photo.profiles?.username ?? "anon"} · {formatDistanceToNow(new Date(photo.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="h-3.5 w-3.5" strokeWidth={1.5} />
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
        <div key={i} className="mb-6 break-inside-avoid rounded-lg border border-border bg-card">
          <div className="aspect-[4/5] animate-pulse bg-muted" />
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
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-16 text-center">
      <Camera className="mx-auto h-8 w-8 text-muted-foreground" strokeWidth={1.25} />
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