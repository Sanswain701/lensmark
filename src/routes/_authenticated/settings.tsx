import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageCropper } from "@/components/image-cropper";
import { uploadAvatarBlob, fileToDataUrl } from "@/lib/avatars";
import { Camera, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · LensMark" }] }),
  component: Settings,
});

const usernameSchema = z.string().trim().min(3).max(30).regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, underscores only");

function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [featured, setFeatured] = useState<string>("");
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const [crop, setCrop] = useState<{ src: string; kind: "avatar" | "cover" } | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUid(u.user.id);
      const { data } = await supabase
        .from("profiles")
        .select("username,display_name,bio,avatar_url,cover_url,instagram,twitter,website,featured_collection_id")
        .eq("id", u.user.id)
        .maybeSingle();
      if (data) {
        setUsername(data.username);
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatar_url ?? null);
        setCoverUrl(data.cover_url ?? null);
        setInstagram(data.instagram ?? "");
        setTwitter(data.twitter ?? "");
        setWebsite(data.website ?? "");
        setFeatured(data.featured_collection_id ?? "");
      }
      const { data: cols } = await supabase
        .from("collections")
        .select("id,name")
        .eq("owner_id", u.user.id)
        .order("created_at", { ascending: false });
      setCollections(cols ?? []);
      setLoading(false);
    })();
  }, []);

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>, kind: "avatar" | "cover") => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please choose an image.");
    if (f.size > 15 * 1024 * 1024) return toast.error("Image must be under 15MB.");
    setCrop({ src: await fileToDataUrl(f), kind });
  };

  const onCropped = async (blob: Blob) => {
    if (!crop || !uid) return;
    try {
      const url = await uploadAvatarBlob(uid, blob, crop.kind);
      if (crop.kind === "avatar") setAvatarUrl(url);
      else setCoverUrl(url);
      toast.success(crop.kind === "avatar" ? "Avatar updated." : "Cover updated.");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed.");
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    if (bio.length > 500) return toast.error("Bio must be 500 characters or less.");
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({
        username: parsed.data,
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        instagram: instagram.trim().replace(/^@/, "") || null,
        twitter: twitter.trim().replace(/^@/, "") || null,
        website: website.trim() || null,
        featured_collection_id: featured || null,
      })
      .eq("id", u.user!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated.");
    navigate({ to: "/u/$username", params: { username: parsed.data } });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-display text-4xl">Your identity</h1>
        <p className="mt-2 text-sm text-muted-foreground">How others find and recognize you on LensMark.</p>
        {loading ? (
          <div className="mt-10 h-40 animate-pulse rounded-lg bg-muted" />
        ) : (
          <form onSubmit={save} className="mt-8 space-y-8">
            {/* Cover + avatar */}
            <section>
              <div className="relative h-44 w-full overflow-hidden rounded-lg border border-border bg-muted sm:h-56">
                {coverUrl ? (
                  <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground">
                    <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => coverInput.current?.click()}
                  className="absolute right-3 top-3 rounded-full bg-background/85 px-3 py-1 text-xs backdrop-blur transition hover:bg-background"
                >
                  {coverUrl ? "Change cover" : "Add cover"}
                </button>
                <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e, "cover")} />
              </div>
              <div className="-mt-10 flex items-end gap-4 pl-4">
                <button
                  type="button"
                  onClick={() => avatarInput.current?.click()}
                  className="group relative h-20 w-20 overflow-hidden rounded-full border-4 border-background bg-secondary"
                  aria-label="Change avatar"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center text-xl font-medium">
                      {(username || "?").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-5 w-5 text-white" strokeWidth={1.5} />
                  </span>
                </button>
                <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e, "avatar")} />
                <p className="pb-2 text-xs text-muted-foreground">Tap the avatar or cover to upload, then crop.</p>
              </div>
            </section>

            <div className="space-y-1.5">
              <Label htmlFor="u">Username</Label>
              <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d">Display name</Label>
              <Input id="d" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b">Bio</Label>
              <Textarea id="b" rows={5} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} placeholder="A few sentences about your practice." />
              <p className="text-right text-xs text-muted-foreground">{bio.length}/500</p>
            </div>

            <section className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Links</Label>
                <p className="text-xs text-muted-foreground">Optional. Shown as small icons on your profile.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5"><Label htmlFor="ig">Instagram</Label><Input id="ig" placeholder="handle" value={instagram} onChange={(e) => setInstagram(e.target.value)} maxLength={60} /></div>
                <div className="space-y-1.5"><Label htmlFor="tw">X / Twitter</Label><Input id="tw" placeholder="handle" value={twitter} onChange={(e) => setTwitter(e.target.value)} maxLength={60} /></div>
                <div className="space-y-1.5"><Label htmlFor="w">Website</Label><Input id="w" placeholder="example.com" value={website} onChange={(e) => setWebsite(e.target.value)} maxLength={200} /></div>
              </div>
            </section>

            <section className="space-y-1.5">
              <Label>Featured collection</Label>
              <Select value={featured || "none"} onValueChange={(v) => setFeatured(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Pinned at the top of your profile.</p>
            </section>

            <Button type="submit" disabled={busy} className="w-full">{busy ? "Saving…" : "Save"}</Button>
          </form>
        )}

        <ImageCropper
          open={!!crop}
          src={crop?.src ?? null}
          aspect={crop?.kind === "avatar" ? 1 : 3}
          shape={crop?.kind === "avatar" ? "round" : "rect"}
          title={crop?.kind === "avatar" ? "Adjust avatar" : "Adjust cover"}
          outputSize={crop?.kind === "avatar" ? 800 : 1800}
          onClose={() => setCrop(null)}
          onCropped={onCropped}
        />
      </main>
    </div>
  );
}