import type { Photo } from "@/lib/photo-types";

/**
 * URL helpers for photo display. The original file is preserved at
 * `image_url`; `medium_url` and `thumb_url` are pure resize + WebP encode
 * variants (no tonal work). See src/lib/image-pipeline.ts.
 */
type PhotoUrls = Pick<Photo, "image_url" | "medium_url" | "thumb_url">;

export function displayUrl(
  p: PhotoUrls,
  role: "thumb" | "medium" | "original",
): string {
  if (role === "original") return p.image_url;
  if (role === "medium") return p.medium_url || p.image_url;
  return p.thumb_url || p.medium_url || p.image_url;
}

export function buildSrcSet(p: PhotoUrls): string | undefined {
  if (p.thumb_url && p.medium_url) {
    return `${p.thumb_url} 400w, ${p.medium_url} 2000w`;
  }
  return undefined;
}

export const DEFAULT_SIZES =
  "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";
