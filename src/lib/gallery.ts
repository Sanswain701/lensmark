import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GalleryProfile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  instagram: string | null;
  twitter: string | null;
  website: string | null;
  featured_collection_id: string | null;
  trust_score: number;
  created_at: string;
};

export type GalleryCounts = {
  photos: number;
  collections: number;
};

export type GalleryData = {
  profile: GalleryProfile | null;
  counts: GalleryCounts;
};

/**
 * Shared TanStack Query options for a Gallery lookup by handle.
 * Consumed by the layout loader and every section leaf so cache is unified.
 */
export function galleryQueryOptions(handle: string) {
  return queryOptions({
    queryKey: ["gallery", handle],
    staleTime: 30_000,
    queryFn: async (): Promise<GalleryData> => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          "id,username,display_name,bio,avatar_url,cover_url,instagram,twitter,website,featured_collection_id,trust_score,created_at",
        )
        .eq("username", handle)
        .maybeSingle();
      if (error) throw error;
      if (!profile) return { profile: null, counts: { photos: 0, collections: 0 } };

      const [photosRes, collectionsRes] = await Promise.all([
        supabase
          .from("photos")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", profile.id),
        supabase
          .from("collections")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", profile.id),
      ]);

      return {
        profile: profile as GalleryProfile,
        counts: {
          photos: photosRes.count ?? 0,
          collections: collectionsRes.count ?? 0,
        },
      };
    },
  });
}

/** Static definition of the six Gallery sections, per GALLERY_SPEC.md §2. */
export const GALLERY_SECTIONS = [
  { key: "home", label: "Home", path: "/@$handle" as const, exact: true },
  { key: "frames", label: "Frames", path: "/@$handle/frames" as const, exact: false },
  { key: "daily", label: "Daily", path: "/@$handle/daily" as const, exact: false },
  { key: "stuff", label: "Stuff", path: "/@$handle/stuff" as const, exact: false },
  { key: "collections", label: "Collections", path: "/@$handle/collections" as const, exact: false },
  { key: "about", label: "About", path: "/@$handle/about" as const, exact: false },
] as const;

export type GallerySectionKey = (typeof GALLERY_SECTIONS)[number]["key"];