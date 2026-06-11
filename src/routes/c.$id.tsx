import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ImageCropper } from "@/components/image-cropper";
import { uploadAvatarBlob, fileToDataUrl } from "@/lib/avatars";
import { Trash2, Pencil, X, ImagePlus } from "lucide-react";
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
        .select("id,name,description,owner_id,cover_url,profiles!collections_owner_id_fkey(username,display_name)")
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

  const removePhoto = async (photoId: string) => {
    const { error } = await supabase.from("collection_photos").delete().eq("collection_id", id).eq("photo_id", photoId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["collection-photos", id] });
  };

  // Edit dialog state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const openEdit = () => {
    if (!colQ.data) return;
    setName(colQ.data.name);
    setDesc(colQ.data.description ?? "");
    setCoverUrl(colQ.data.cover_url ?? null);
    setEditing(true);
  };

  const pickCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setCrop(await fileToDataUrl(f));
  };

  const onCovered = async (blob: Blob) => {
    if (!me) return;
    try {
      const url = await uploadAvatarBlob(me, blob, "collection");
      setCoverUrl(url);
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed.");
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required.");
    setSavingEdit(true);
    const { error } = await supabase.from("collections").update({
      name: name.trim(),
      description: desc.trim() || null,
      cover_url: coverUrl,
    }).eq("id", id);
    setSavingEdit(false);
    if (error) return toast.error(error.message);
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["collection", id] });
    toast.success("Collection updated.");
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
  const isOwner = me === c.owner_id;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      {c.cover_url && (
        <div className="relative h-52 w-full overflow-hidden bg-muted sm:h-72">
          <img src={c.cover_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}
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
          {isOwner && (
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={openEdit} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={remove} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
            </div>
          )}
        </header>

        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {photosQ.data?.map((p: any) => (
            <div key={p.id} className="relative mb-4 break-inside-avoid overflow-hidden rounded-lg bg-muted">
              <Link to="/p/$id" params={{ id: p.id }} className="block">
                <img src={p.image_url} alt={p.caption ?? ""} loading="lazy" className="w-full" />
              </Link>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label="Remove from collection"
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/85 text-foreground opacity-0 transition-opacity hover:bg-background group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  style={{ opacity: 1 }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {photosQ.data?.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <p className="font-display text-lg">An empty page, waiting.</p>
              <p className="mt-1 text-sm text-muted-foreground">Open any photograph and tap “Add to collection”.</p>
            </div>
          )}
        </div>
      </main>

      {/* Edit dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit collection</DialogTitle></DialogHeader>
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="relative h-40 overflow-hidden rounded-md border border-border bg-muted">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground"><ImagePlus className="h-6 w-6" strokeWidth={1.5} /></div>
              )}
              <button type="button" onClick={() => fileRef.current?.click()} className="absolute right-3 top-3 rounded-full bg-background/85 px-3 py-1 text-xs backdrop-blur hover:bg-background">
                {coverUrl ? "Change cover" : "Add cover"}
              </button>
              {coverUrl && (
                <button type="button" onClick={() => setCoverUrl(null)} className="absolute right-3 bottom-3 rounded-full bg-background/85 px-3 py-1 text-xs backdrop-blur hover:bg-background">Remove</button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickCover} />
            </div>
            <div className="space-y-1.5"><Label htmlFor="cn">Name</Label><Input id="cn" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
            <div className="space-y-1.5"><Label htmlFor="cd">Description</Label><Textarea id="cd" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={280} /></div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={savingEdit}>{savingEdit ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImageCropper
        open={!!crop}
        src={crop}
        aspect={16 / 9}
        outputSize={1800}
        title="Adjust cover"
        onClose={() => setCrop(null)}
        onCropped={onCovered}
      />
    </div>
  );
}