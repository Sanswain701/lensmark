import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("username,display_name,bio").eq("id", u.user.id).maybeSingle();
      if (data) {
        setUsername(data.username);
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    if (bio.length > 280) return toast.error("Bio must be 280 characters or less.");
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({
        username: parsed.data,
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
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
      <main className="mx-auto max-w-xl px-5 py-12">
        <h1 className="font-display text-4xl">Your identity</h1>
        <p className="mt-2 text-sm text-muted-foreground">How others find and recognize you on LensMark.</p>
        {loading ? (
          <div className="mt-10 h-40 animate-pulse rounded-lg bg-muted" />
        ) : (
          <form onSubmit={save} className="mt-8 space-y-5">
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
              <Textarea id="b" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} />
              <p className="text-right text-xs text-muted-foreground">{bio.length}/280</p>
            </div>
            <Button type="submit" disabled={busy} className="w-full">{busy ? "Saving…" : "Save"}</Button>
          </form>
        )}
      </main>
    </div>
  );
}