import type { Photo } from "@/lib/photo-types";

/**
 * Returns the best display URL for a given role.
 * Falls back to image_url (original) when an optimized variant is missing,
 * so legacy rows still render.
 */
export function displayUrl(
  p: Pick<Photo, "image_url" | "medium_url" | "thumb_url">,
  role: "thumb" | "medium" | "original",
): string {
  if (role === "original") return p.image_url;
  if (role === "medium") return p.medium_url || p.image_url;
  return p.thumb_url || p.medium_url || p.image_url;
}

export function buildSrcSet(p: Pick<Photo, "image_url" | "medium_url" | "thumb_url">) {
  const parts: string[] = [];
  if (p.thumb_url) parts.push(`${p.thumb_url} 400w`);
  if (p.medium_url) parts.push(`${p.medium_url} 2000w`);
  return parts.length > 1 ? parts.join(", ") : undefined;
}