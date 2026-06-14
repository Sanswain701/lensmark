
# Premium image processing pipeline for LensMark

Goal: photos look like Sony Alpha JPEG / iPhone Smart HDR — controlled highlights, rich detail, natural color. Originals are preserved untouched and shown on the detail page; optimized WebP variants power every feed/grid surface.

## Architecture choice

All processing happens **client-side in the browser** before upload, using `<canvas>` + `createImageBitmap`:

- The Worker SSR runtime cannot run `sharp` / native image libs, and a pure-JS server pipeline would be slow and double the upload bandwidth.
- Browsers already decode the file for preview, so we reuse that decode.
- `imageOrientation: "from-image"` on `createImageBitmap` preserves EXIF orientation natively (no exif-js dependency).
- Canvas `toBlob("image/webp", q)` is supported in all current browsers we target (PWA).

A small graceful fallback path: if WebP encoding fails (very old browser), we fall back to JPEG q=0.9 for the optimized variants — the original is always uploaded as-is regardless.

## Storage layout (no schema migration needed beyond two nullable columns)

Bucket `photos` (private, already exists). For each upload:

```
{uid}/{photoId}/original.{ext}   ← untouched bytes from the user's file
{uid}/{photoId}/medium.webp      ← max 2000px long edge, WebP q=0.90
{uid}/{photoId}/thumb.webp       ← 400px long edge,      WebP q=0.85
```

Signed URLs (1 year) are generated for all three and stored on the row.

### `photos` table additions (one migration)

```sql
ALTER TABLE public.photos
  ADD COLUMN medium_url   text,
  ADD COLUMN thumb_url    text,
  ADD COLUMN medium_path  text,
  ADD COLUMN thumb_path   text,
  ADD COLUMN width        int,
  ADD COLUMN height       int;
```

`image_url` / `storage_path` keep their existing meaning = **original**. Old rows without the new columns fall back to `image_url` in the UI, so nothing breaks.

## Processing pipeline (`src/lib/image-pipeline.ts`, new)

Pure client module, no new deps. Pipeline per variant:

1. Decode source via `createImageBitmap(file, { imageOrientation: "from-image" })`. EXIF rotation baked in, never upscale (`Math.min(1, target/longEdge)`).
2. Draw to an offscreen canvas at target size, `imageSmoothingQuality = "high"`.
3. Single-pass pixel adjustment over `ImageData` applying, in this order:
   - **Auto-exposure**: compute luminance histogram, find 0.5% / 99.5% percentiles, gentle linear stretch capped at ±8% so well-exposed images barely change.
   - **Highlight recovery**: for pixels with L > 0.75, compress with `L' = 0.75 + (L-0.75) * 0.72` (≈28% rolloff). Prevents blown whites, preserves cloud/sky gradient.
   - **Shadow lift**: for L < 0.25, `L' = L + (0.25-L) * 0.18`. Mild.
   - **Contrast +10%** around mid-gray: `c = (c-0.5) * 1.10 + 0.5`, applied in linear-ish space to avoid crushing.
   - **Vibrance +5% / Saturation +2%**: HSL-style boost that scales inversely with current saturation (vibrance), then a flat 2% sat. Skin-tone guard: hues in [10°, 50°] get 60% of the boost so faces stay natural.
   - **Mild sharpen**: 3×3 unsharp mask (amount 0.35, radius 1px) applied only to the luminance channel.
4. Encode: `canvas.toBlob("image/webp", q)` (0.90 medium / 0.85 thumb). JPEG fallback if `null`.

Performance: medium variant ≈ 80–200 ms on a mid-range phone for a 12 MP photo. Thumb is fast. We run them sequentially after the upload of the original has *started* (parallel network + CPU), with a toast that reflects progress: "Uploading… Optimizing… Done."

## Upload flow changes (`src/routes/_authenticated/upload.tsx`)

Replace the single-upload block with:

```
1. const photoId = crypto.randomUUID()
2. parallel:
     a. supabase.storage.upload(`${uid}/${photoId}/original.${ext}`, file)   // untouched
     b. const { medium, thumb, width, height } = await processImage(file)
        await upload medium.webp + thumb.webp
3. createSignedUrl x3 (1 year)
4. insert photos row with image_url=original, medium_url, thumb_url, *_path, width, height
```

Validation/limits unchanged (12 MB, JPG/PNG/WebP/AVIF). HEIC stays out of scope (already not in the allow-list).

## Display rules

- **Feed / profile / collections / discovery** → use `medium_url` (with `thumb_url` as the `ProgressiveImage` placeholder for instant paint), srcset `thumb_url 400w, medium_url 2000w`, `sizes` per grid breakpoint, `loading="lazy"`, `decoding="async"`.
- **Photo detail `/p/$id`** → use `image_url` (original), preloaded via route `head().links` `rel="preload" as="image"`.
- **Photo card hover/zoom** → still medium; only the detail page pays the original-size bandwidth.

`ProgressiveImage` gets two new optional props (`srcSet`, `sizes`, `placeholderSrc`) — existing callers keep working.

## Backward compatibility

A tiny helper `displayUrl(photo, "medium" | "thumb" | "original")` returns the right URL, falling back to `image_url` when the optimized columns are null (old rows). No backfill required; old photos simply render from the original until re-uploaded.

## Files touched

- **New**: `src/lib/image-pipeline.ts`, `supabase/migrations/<ts>_photos_variants.sql`
- **Edit**: `src/routes/_authenticated/upload.tsx` (pipeline + multi-upload), `src/components/progressive-image.tsx` (srcset/sizes/placeholder props), `src/routes/index.tsx` / `u.$username.tsx` / `c.$id.tsx` (use medium + srcset), `src/routes/p.$id.tsx` (preload original, keep using `image_url`).

## Out of scope

No redesign, no layout changes, no new routes, no new deps, no server-side processing, no HEIC support, no re-processing of historical photos.
