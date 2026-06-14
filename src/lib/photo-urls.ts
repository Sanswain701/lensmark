import type { Photo } from "@/lib/photo-types";

/**
 * Returns the best display URL for a given role.
 * Uses the original image everywhere to guarantee
 * that no processed version changes the look.
 */
export function displayUrl(
  p: Pick<Photo, "image_url" | "medium_url" | "thumb_url">,
  role: "thumb" | "medium" | "original",
): string {
  return p.image_url;
}

export function buildSrcSet(
  p: Pick<Photo, "image_url" | "medium_url" | "thumb_url">
) {
  return undefined;
}
