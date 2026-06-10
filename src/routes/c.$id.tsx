import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/c/$id")({
  head: () => ({ meta: [{ title: "Collection · LensMark" }] }),
  component: CollectionPage,
});

function CollectionPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null)); }, []);

  const colQ = useQuery({
    queryKey: ["collection", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id,name,description,owner_id,profiles!collections_owner_id_fkey(username,display_name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as any;
    },
  });

  const photosQ = useQuery({
    queryKey: ["collection-photos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_photos")
        .select("photo_id, photos(id,image_url,caption,created_at)")
        .eq("collection_id", id);
      if (error) throw error;
      return (data ?? []).map((x: any) => x.photos).filter(Boolean);
    },
  });

  const remove = async () => {
    if (!confirm("Delete this collection?")) return;
    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (error) return toast.error(error.message);
    navigate({ to: "/" });
  };

  if (colQ.isLoading || !colQ.data) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-5xl p-12"><div className="h-24 animate-pulse rounded-lg bg-muted" /></main>
      </div>
    );
  }
  const c = colQ.data;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <header className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Collection</p>
            <h1 className="font-display mt-2 text-5xl tracking-tight">{c.name}</h1>
            {c.description && <p className="mt-3 max-w-xl text-sm text-muted-foreground">{c.description}</p>}
            <Link to="/u/$username" params={{ username: c.profiles?.username ?? "" }} className="mt-3 inline-block text-sm">
              by <span className="underline-offset-4 hover:underline">@{c.profiles?.username}</span>
            </Link>
          </div>
          {me === c.owner_id && (
            <Button variant="outline" size="icon" onClick={remove}><Trash2 className="h-4 w-4" /></Button>
          )}
        </header>

        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {photosQ.data?.map((p: any) => (
            <Link key={p.id} to="/p/$id" params={{ id: p.id }} className="mb-4 block break-inside-avoid overflow-hidden rounded-lg bg-muted">
              <img src={p.image_url} alt={p.caption ?? ""} loading="lazy" className="w-full" />
            </Link>
          ))}
          {photosQ.data?.length === 0 && <p className="text-sm text-muted-foreground">No photographs in this collection yet.</p>}
        </div>
      </main>
    </div>
  );
}