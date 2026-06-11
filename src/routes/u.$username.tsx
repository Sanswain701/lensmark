import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SocialIcons } from "@/components/social-icons";
import { Shield, Calendar, Image as ImageIcon, Layers } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} · LensMark` },
      { name: "description", content: `Photographs by @${params.username} on LensMark.` },
      { property: "og:title", content: `@${params.username} · LensMark` },
    ],
  }),
  component: ProfilePage,
  errorComponent: () => <ErrorView />,
  notFoundComponent: () => <ErrorView />,
});

function ErrorView() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <p className="font-display text-2xl">We couldn't find this photographer.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground">Back home</Link>
      </main>
    </div>
  );
}

function ProfilePage() {
  const { username } = Route.useParams();
  const profileQ = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,username,display_name,bio,avatar_url,cover_url,instagram,twitter,website,featured_collection_id,trust_score,created_at")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });
  const profile = profileQ.data;

  const photosQ = useQuery({
    queryKey: ["photos-by", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("id,image_url,caption,created_at")
        .eq("owner_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const collectionsQ = useQuery({
    queryKey: ["collections-by", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id,name,description,cover_url,cover_photo_id,photos:cover_photo_id(image_url)")
        .eq("owner_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  if (profileQ.isLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-5 py-12">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </main>
      </div>
    );
  }
  if (!profile) return <ErrorView />;

  const featured = collectionsQ.data?.find((c) => c.id === profile.featured_collection_id);
  const otherCollections = collectionsQ.data?.filter((c) => c.id !== profile.featured_collection_id) ?? [];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pb-16">
        {/* Cover band */}
        <div className="relative h-52 w-full overflow-hidden bg-muted sm:h-72">
          {profile.cover_url ? (
            <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-b from-muted to-background" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="mx-auto max-w-5xl px-5">
          {/* Identity row */}
          <section className="-mt-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-secondary">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-2xl font-medium">
                    {profile.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <h1 className="font-display mt-4 text-4xl tracking-tight">{profile.display_name ?? profile.username}</h1>
              <div className="mt-1 flex items-center gap-3">
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                <SocialIcons instagram={profile.instagram} twitter={profile.twitter} website={profile.website} />
              </div>
              {profile.bio && <p className="mt-4 max-w-xl whitespace-pre-line text-sm leading-relaxed text-foreground/90">{profile.bio}</p>}
            </div>
            <dl className="grid grid-cols-3 gap-3 text-sm md:max-w-sm">
              <Stat icon={<Shield className="h-4 w-4" strokeWidth={1.5} />} label="Trust" value={String(profile.trust_score)} />
              <Stat icon={<ImageIcon className="h-4 w-4" strokeWidth={1.5} />} label="Photos" value={String(photosQ.data?.length ?? "—")} />
              <Stat icon={<Calendar className="h-4 w-4" strokeWidth={1.5} />} label="Joined" value={format(new Date(profile.created_at), "MMM yyyy")} />
            </dl>
          </section>

          {/* Featured collection band */}
          {featured && (
            <section className="mt-12">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Featured collection</p>
              <Link to="/c/$id" params={{ id: featured.id }} className="group mt-3 grid gap-5 overflow-hidden rounded-xl border border-border bg-card md:grid-cols-[2fr_1fr]">
                <div className="aspect-[16/9] overflow-hidden bg-muted md:aspect-auto md:h-full">
                  {(featured.cover_url || featured.photos?.image_url) ? (
                    <img src={featured.cover_url || featured.photos.image_url} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" loading="lazy" />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground"><Layers className="h-6 w-6" /></div>
                  )}
                </div>
                <div className="flex flex-col justify-center p-6">
                  <h3 className="font-display text-2xl tracking-tight">{featured.name}</h3>
                  {featured.description && <p className="mt-2 text-sm text-muted-foreground">{featured.description}</p>}
                  <span className="mt-4 text-xs uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-foreground">View collection →</span>
                </div>
              </Link>
            </section>
          )}

        {otherCollections.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display mb-4 text-2xl">Collections</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {otherCollections.map((c) => (
                <Link key={c.id} to="/c/$id" params={{ id: c.id }} className="group overflow-hidden rounded-lg border border-border bg-card">
                  <div className="aspect-[5/4] overflow-hidden bg-muted">
                    {(c.cover_url || c.photos?.image_url) ? (
                      <img src={c.cover_url || c.photos.image_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="grid h-full place-items-center text-muted-foreground"><Layers className="h-6 w-6" /></div>
                    )}
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    {c.description && <p className="truncate text-xs text-muted-foreground">{c.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14">
          <h2 className="font-display mb-4 text-2xl">Photographs</h2>
          {photosQ.isLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
          ) : !photosQ.data || photosQ.data.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <p className="font-display text-lg">A quiet archive, for now.</p>
              <p className="mt-1 text-sm text-muted-foreground">No photographs yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {photosQ.data.map((p) => (
                <Link key={p.id} to="/p/$id" params={{ id: p.id }} className="group block overflow-hidden rounded-md bg-muted">
                  <img src={p.image_url} alt={p.caption ?? ""} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                </Link>
              ))}
            </div>
          )}
        </section>
        </div>
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">{icon}{label}</div>
      <div className="font-display mt-1 text-xl">{value}</div>
    </div>
  );
}