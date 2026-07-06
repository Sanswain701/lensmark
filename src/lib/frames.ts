import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Hard cap per GALLERY_SPEC §4 / §8.2. Enforced client-side (Loop 4). */
export const FRAMES_CAP = 24;

export type FrameVisibility = "draft" | "published";

export type FrameCover = {
  id: string;
  image_url: string;
  medium_url: string | null;
  thumb_url: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
};

export type Frame = {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_photo_id: string;
  display_order: number;
  visibility: FrameVisibility;
  created_at: string;
  updated_at: string;
  cover: FrameCover;
};

const FRAME_SELECT =
  "id,owner_id,title,slug,description,cover_photo_id,display_order,visibility,created_at,updated_at,cover:photos!frames_cover_photo_id_fkey(id,image_url,medium_url,thumb_url,caption,width,height)";

function mapRow(row: any): Frame {
  return { ...row, cover: row.cover } as Frame;
}

/**
 * List frames for a gallery. When `includeDrafts` is true (owner view) RLS lets
 * drafts through; visitors see only published frames.
 */
export function framesListQueryOptions(ownerId: string, opts: { includeDrafts: boolean }) {
  return queryOptions({
    queryKey: ["frames", "list", ownerId, opts.includeDrafts ? "owner" : "public"],
    staleTime: 30_000,
    queryFn: async (): Promise<Frame[]> => {
      let q = supabase.from("frames").select(FRAME_SELECT).eq("owner_id", ownerId);
      if (!opts.includeDrafts) q = q.eq("visibility", "published");
      const { data, error } = await q
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

/** Fetch a single frame by owner + slug (used for detail page). */
export function frameBySlugQueryOptions(ownerId: string, slug: string) {
  return queryOptions({
    queryKey: ["frames", "detail", ownerId, slug],
    staleTime: 30_000,
    queryFn: async (): Promise<Frame | null> => {
      const { data, error } = await supabase
        .from("frames")
        .select(FRAME_SELECT)
        .eq("owner_id", ownerId)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? mapRow(data) : null;
    },
  });
}

/** Owner's uploaded photos, used by the cover picker. */
export function ownerPhotosQueryOptions(ownerId: string) {
  return queryOptions({
    queryKey: ["frames", "owner-photos", ownerId],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("id,image_url,medium_url,thumb_url,caption,width,height,created_at")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

const SLUG_RESERVED = new Set(["new", "edit", "draft"]);

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "frame";
}

/** Ensure the slug is unique for a given owner (and not reserved). */
export async function uniqueSlugForOwner(ownerId: string, desired: string, ignoreId?: string) {
  let base = slugify(desired);
  if (SLUG_RESERVED.has(base)) base = `${base}-frame`;
  let candidate = base;
  let n = 1;
  // Bounded loop; realistic frame counts are ≤24.
  while (n < 100) {
    const q = supabase
      .from("frames")
      .select("id", { head: true, count: "exact" })
      .eq("owner_id", ownerId)
      .eq("slug", candidate);
    const { count, error } = await q;
    if (error) throw error;
    if (!count || count === 0) return candidate;
    // If the sole match is the row we're editing, keep the slug.
    if (count === 1 && ignoreId) {
      const { data } = await supabase
        .from("frames")
        .select("id")
        .eq("owner_id", ownerId)
        .eq("slug", candidate)
        .maybeSingle();
      if (data?.id === ignoreId) return candidate;
    }
    n += 1;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}