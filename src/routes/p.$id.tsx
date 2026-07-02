import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Trash2, MessageCircle, FolderPlus } from "lucide-react";
import { AddToCollectionDialog } from "@/components/add-to-collection-dialog";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export const Route = createFileRoute("/p/$id")({
  head: () => ({ meta: [{ title: `Photograph · LensMark` }] }),
  component: PhotoPage,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-md p-10 text-center">
        <p className="font-display text-2xl">We couldn't load this photograph.</p>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="mt-4 rounded-md border border-border px-4 py-2 text-sm">Try again</button>
      </main>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-md p-10 text-center">
        <p className="font-display text-2xl">Photograph not found.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground">Back home</Link>
      </main>
    </div>
  ),
});

function PhotoPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [me, setMe] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const photoQ = useQuery({
    queryKey: ["photo", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("id,image_url,medium_url,thumb_url,medium_path,thumb_path,caption,created_at,appreciations_count,owner_id,storage_path,profiles!photos_owner_id_fkey(username,display_name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as any;
    },
  });

  const commentsQ = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id,body,created_at,author_id,profiles!comments_author_id_fkey(username,display_name)")
        .eq("photo_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const appreciatedQ = useQuery({
    queryKey: ["appreciated", id, me],
    enabled: !!me,
    queryFn: async () => {
      const { data } = await supabase.from("appreciations").select("photo_id").eq("photo_id", id).eq("user_id", me!).maybeSingle();
      return !!data;
    },
  });

  const toggleAppreciate = async () => {
    if (!me) return navigate({ to: "/auth" });
    if (appreciatedQ.data) {
      await supabase.from("appreciations").delete().eq("photo_id", id).eq("user_id", me);
    } else {
      await supabase.from("appreciations").insert({ photo_id: id, user_id: me });
    }
    qc.invalidateQueries({ queryKey: ["appreciated", id, me] });
    qc.invalidateQueries({ queryKey: ["photo", id] });
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return navigate({ to: "/auth" });
    const body = comment.trim();
    if (body.length === 0 || body.length > 1000) return;
    setPosting(true);
    const { error } = await supabase.from("comments").insert({ photo_id: id, author_id: me, body });
    setPosting(false);
    if (error) return toast.error(error.message);
    setComment("");
    qc.invalidateQueries({ queryKey: ["comments", id] });
  };

  const deletePhoto = async () => {
    if (!photoQ.data) return;
    if (!confirm("Delete this photograph permanently?")) return;
    const paths = [photoQ.data.storage_path, photoQ.data.medium_path, photoQ.data.thumb_path].filter(
      (p): p is string => !!p,
    );
    await supabase.storage.from("photos").remove(paths);
    const { error } = await supabase.from("photos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed.");
    navigate({ to: "/" });
  };

  if (photoQ.isLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-5xl p-5"><div className="aspect-[4/3] animate-pulse rounded-xl bg-muted" /></div>
      </div>
    );
  }
  const photo = photoQ.data;
  if (!photo) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <p className="p-12 text-center text-muted-foreground">Photograph not found.</p>
      </div>
    );
  }
  const dt = new Date(photo.created_at);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-5 py-8 pb-28 md:pb-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl bg-black shadow-[var(--shadow-elegant)] ring-1 ring-foreground/10">
            <img src={photo.image_url} alt={photo.caption ?? ""} className="mx-auto max-h-[82vh] w-auto rounded-2xl object-contain" />
          </div>
          <aside className="space-y-6">
            <div>
              <Link to="/u/$username" params={{ username: photo.profiles?.username ?? "" }} className="inline-flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-sm font-medium ring-1 ring-foreground/10">
                  {(photo.profiles?.username ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{photo.profiles?.display_name ?? photo.profiles?.username}</p>
                  <p className="meta text-xs text-muted-foreground">@{photo.profiles?.username}</p>
                </div>
              </Link>
            </div>
            {photo.caption && <p className="text-[15px] leading-[1.75]">{photo.caption}</p>}
            <dl className="grid grid-cols-3 gap-3 border-y border-border/70 py-5 text-center">
              <div><dt className="eyebrow">Date</dt><dd className="font-display mt-1 text-base">{format(dt, "MMM d")}</dd></div>
              <div><dt className="eyebrow">Time</dt><dd className="font-display mt-1 text-base meta">{format(dt, "HH:mm")}</dd></div>
              <div><dt className="eyebrow">Year</dt><dd className="font-display mt-1 text-base meta">{format(dt, "yyyy")}</dd></div>
            </dl>
            <div className="flex items-center gap-2">
              <Button onClick={toggleAppreciate} variant={appreciatedQ.data ? "default" : "outline"} className="flex-1 gap-2">
                <Heart className={`h-4 w-4 ${appreciatedQ.data ? "fill-current" : ""}`} strokeWidth={1.5} />
                {photo.appreciations_count} {photo.appreciations_count === 1 ? "appreciation" : "appreciations"}
              </Button>
              {me === photo.owner_id && (
                <>
                  <Button onClick={() => setAddOpen(true)} variant="outline" size="icon" aria-label="Add to collection">
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                  <Button onClick={deletePhoto} variant="outline" size="icon" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            <div>
              <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-medium"><MessageCircle className="h-4 w-4" strokeWidth={1.5} /> Conversation</h3>
              <form onSubmit={postComment} className="space-y-2">
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={1000} placeholder={me ? "Share a thoughtful observation…" : "Sign in to share an observation"} disabled={!me} />
                <Button type="submit" size="sm" disabled={!me || posting || !comment.trim()}>Post</Button>
              </form>
              <ul className="mt-5 space-y-4">
                {commentsQ.data?.map((c) => (
                  <li key={c.id} className="text-sm">
                    <Link to="/u/$username" params={{ username: c.profiles?.username ?? "" }} className="font-medium hover:underline">@{c.profiles?.username}</Link>{" "}
                    <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                    <p className="mt-1 leading-relaxed text-foreground/90">{c.body}</p>
                  </li>
                ))}
                {commentsQ.data?.length === 0 && <p className="text-xs text-muted-foreground">No notes yet.</p>}
              </ul>
            </div>
          </aside>
        </div>
      </main>
      {me && me === photo.owner_id && (
        <AddToCollectionDialog open={addOpen} onClose={() => setAddOpen(false)} photoId={photo.id} ownerId={me} />
      )}
      <MobileBottomNav />
    </div>
  );
}