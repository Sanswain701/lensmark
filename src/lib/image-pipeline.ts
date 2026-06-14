/**
 * Client-side premium image processing pipeline.
 * Generates Sony-Alpha-JPEG-like medium and thumbnail variants from a source File.
 * Original file is uploaded untouched; this module never mutates it.
 */

export type ProcessedImage = {
  blob: Blob;
  ext: "webp" | "jpeg";
  contentType: string;
  width: number;
  height: number;
};

export type ProcessedSet = {
  medium: ProcessedImage;
  thumb: ProcessedImage;
  sourceWidth: number;
  sourceHeight: number;
};

const MEDIUM_MAX = 2000;
const THUMB_MAX = 400;

async function decode(file: File): Promise<ImageBitmap> {
  // imageOrientation "from-image" bakes EXIF rotation into the bitmap.
  return await createImageBitmap(file, { imageOrientation: "from-image" });
}

function targetSize(srcW: number, srcH: number, maxEdge: number) {
  const longest = Math.max(srcW, srcH);
  const scale = Math.min(1, maxEdge / longest); // never upscale
  return { w: Math.round(srcW * scale), h: Math.round(srcH * scale) };
}

function drawToCanvas(bitmap: ImageBitmap, w: number, h: number) {
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement("canvas"), { width: w, height: h });
  const ctx = (canvas as any).getContext("2d", { willReadFrequently: true }) as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D;
  (ctx as any).imageSmoothingEnabled = true;
  (ctx as any).imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  return { canvas: canvas as any, ctx: ctx as CanvasRenderingContext2D };
}

async function encode(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  quality: number,
): Promise<{ blob: Blob; ext: "webp" | "jpeg"; contentType: string }> {
  // Prefer WebP, fall back to JPEG.
  const toBlob = async (type: string, q: number): Promise<Blob | null> => {
    if ("convertToBlob" in canvas) {
      try {
        return await (canvas as OffscreenCanvas).convertToBlob({ type, quality: q });
      } catch {
        return null;
      }
    }
    return await new Promise<Blob | null>((res) =>
      (canvas as HTMLCanvasElement).toBlob((b) => res(b), type, q),
    );
  };
  const webp = await toBlob("image/webp", quality);
  if (webp && webp.size > 0) return { blob: webp, ext: "webp", contentType: "image/webp" };
  const jpg = await toBlob("image/jpeg", 0.9);
  if (jpg && jpg.size > 0) return { blob: jpg, ext: "jpeg", contentType: "image/jpeg" };
  throw new Error("Image encoding failed.");
}

async function buildVariant(
  bitmap: ImageBitmap,
  maxEdge: number,
  quality: number,
): Promise<ProcessedImage> {
  const { w, h } = targetSize(bitmap.width, bitmap.height, maxEdge);
  const { canvas, ctx } = drawToCanvas(bitmap, w, h);
  const { blob, ext, contentType } = await encode(canvas, quality);
  return { blob, ext, contentType, width: w, height: h };
}

export async function processImage(file: File): Promise<ProcessedSet> {
  const bitmap = await decode(file);
  try {
    // No tonal/color processing. Preserve the original look exactly;
    // only downsample and re-encode for web delivery. The full-quality
    // original remains available on the photo detail page.
    const medium = await buildVariant(bitmap, MEDIUM_MAX, 0.92);
    const thumb = await buildVariant(bitmap, THUMB_MAX, 0.85);
    return {
      medium,
      thumb,
      sourceWidth: bitmap.width,
      sourceHeight: bitmap.height,
    };
  } finally {
    bitmap.close?.();
  }
}
