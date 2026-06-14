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

/* ----- color math helpers ----- */

function luma(r: number, g: number, b: number) {
  // Rec. 709 luminance, 0..1 inputs
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function applyToneAndColor(img: ImageData) {
  const d = img.data;
  const N = d.length;

  // ---- 1. Build luminance histogram for gentle auto-exposure ----
  const hist = new Uint32Array(256);
  for (let i = 0; i < N; i += 4) {
    const y = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) | 0;
    hist[y]++;
  }
  const total = N >> 2;
  const loCut = total * 0.005;
  const hiCut = total * 0.995;
  let acc = 0;
  let lo = 0;
  let hi = 255;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc >= loCut) { lo = i; break; }
  }
  acc = 0;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc >= hiCut) { hi = i; break; }
  }
  // Clamp the stretch so well-exposed photos barely change (±8%).
  const maxShift = 20; // ~8% of 255
  lo = Math.max(0, Math.min(lo, maxShift));
  hi = Math.min(255, Math.max(hi, 255 - maxShift));
  const stretch = 255 / Math.max(1, hi - lo);

  // ---- 2. Per-pixel pipeline ----
  const VIB = 0.05;     // vibrance +5%
  const SAT = 0.02;     // global saturation +2%
  const CONTRAST = 0.10;

  for (let i = 0; i < N; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];

    // auto-exposure linear stretch
    r = (r - lo) * stretch;
    g = (g - lo) * stretch;
    b = (b - lo) * stretch;

    // normalize to 0..1
    let rf = r / 255, gf = g / 255, bf = b / 255;

    // Highlight recovery (soft knee above 0.75 ~ -28%)
    rf = rf > 0.75 ? 0.75 + (rf - 0.75) * 0.72 : rf;
    gf = gf > 0.75 ? 0.75 + (gf - 0.75) * 0.72 : gf;
    bf = bf > 0.75 ? 0.75 + (bf - 0.75) * 0.72 : bf;

    // Mild shadow lift
    rf = rf < 0.25 ? rf + (0.25 - rf) * 0.18 : rf;
    gf = gf < 0.25 ? gf + (0.25 - gf) * 0.18 : gf;
    bf = bf < 0.25 ? bf + (0.25 - bf) * 0.18 : bf;

    // Contrast around mid-gray
    rf = (rf - 0.5) * (1 + CONTRAST) + 0.5;
    gf = (gf - 0.5) * (1 + CONTRAST) + 0.5;
    bf = (bf - 0.5) * (1 + CONTRAST) + 0.5;

    // Vibrance + Saturation around luma
    const y = luma(rf, gf, bf);
    const maxC = Math.max(rf, gf, bf);
    const minC = Math.min(rf, gf, bf);
    const curSat = maxC === 0 ? 0 : (maxC - minC) / maxC;

    // Skin-tone guard: detect warm hues, reduce boost on them.
    // Skin lies roughly where R > G > B and red dominates.
    const isSkinish = rf > gf && gf > bf && rf - bf < 0.35 && rf > 0.25;
    const skinFactor = isSkinish ? 0.6 : 1;

    const vibBoost = VIB * (1 - curSat) * skinFactor;
    const totalBoost = 1 + vibBoost + SAT;

    rf = y + (rf - y) * totalBoost;
    gf = y + (gf - y) * totalBoost;
    bf = y + (bf - y) * totalBoost;

    // clamp & write
    d[i]     = rf < 0 ? 0 : rf > 1 ? 255 : (rf * 255 + 0.5) | 0;
    d[i + 1] = gf < 0 ? 0 : gf > 1 ? 255 : (gf * 255 + 0.5) | 0;
    d[i + 2] = bf < 0 ? 0 : bf > 1 ? 255 : (bf * 255 + 0.5) | 0;
    // alpha untouched
  }
}

/** Mild luma-only 3x3 unsharp mask. amount ~0.35 */
function applySharpen(img: ImageData, amount = 0.35) {
  const { data: src, width: w, height: h } = img;
  // Compute blurred luma with 3x3 box blur, then unsharp on each channel weighted by mask.
  const lumaArr = new Float32Array(w * h);
  for (let i = 0, p = 0; i < src.length; i += 4, p++) {
    lumaArr[p] = 0.2126 * src[i] + 0.7152 * src[i + 1] + 0.0722 * src[i + 2];
  }
  const blur = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const o = y * w + x;
      blur[o] =
        (lumaArr[o - w - 1] + lumaArr[o - w] + lumaArr[o - w + 1] +
         lumaArr[o - 1]     + lumaArr[o]     + lumaArr[o + 1] +
         lumaArr[o + w - 1] + lumaArr[o + w] + lumaArr[o + w + 1]) / 9;
    }
  }
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const o = y * w + x;
      const i = o * 4;
      const diff = (lumaArr[o] - blur[o]) * amount;
      const r = src[i]     + diff;
      const g = src[i + 1] + diff;
      const b = src[i + 2] + diff;
      src[i]     = r < 0 ? 0 : r > 255 ? 255 : r;
      src[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      src[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
    }
  }
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
  sharpen: boolean,
): Promise<ProcessedImage> {
  const { w, h } = targetSize(bitmap.width, bitmap.height, maxEdge);
  const { canvas, ctx } = drawToCanvas(bitmap, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  applyToneAndColor(img);
  if (sharpen) applySharpen(img, 0.35);
  ctx.putImageData(img, 0, 0);
  const { blob, ext, contentType } = await encode(canvas, quality);
  return { blob, ext, contentType, width: w, height: h };
}

export async function processImage(file: File): Promise<ProcessedSet> {
  const bitmap = await decode(file);
  try {
    const medium = await buildVariant(bitmap, MEDIUM_MAX, 0.90, true);
    const thumb = await buildVariant(bitmap, THUMB_MAX, 0.85, false);
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
