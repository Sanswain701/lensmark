import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Camera, Upload as UploadIcon } from "lucide-react";
import { processImage } from "@/lib/image-pipeline";
import { SourceSelect } from "@/components/source-select";

export const Route = createFileRoute("/_authenticated/upload")({
head: () => ({ meta: [{ title: "Upload · LensMark" }] }),
component: UploadPage,
});

const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_RETRIES = 3;

async function withRetry<T>(fn: () => Promise<T>, signal: AbortSignal): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (signal.aborted) throw err;
      // Exponential backoff: 300ms, 900ms, 2700ms.
      const delay = 300 * Math.pow(3, attempt);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw lastErr;
}

function fingerprint(f: File) {
  return `${f.name}::${f.size}::${f.lastModified}`;
}

function UploadPage() {
const navigate = useNavigate();

const [file, setFile] = useState<File | null>(null);
const [preview, setPreview] = useState<string | null>(null);
const [caption, setCaption] = useState("");
const [busy, setBusy] = useState(false);
const [sourceOpen, setSourceOpen] = useState(false);
const [progress, setProgress] = useState(0);
const abortRef = useRef<AbortController | null>(null);
const inflightRef = useRef(false);
const uploadedFingerprints = useRef<Set<string>>(new Set());

const onFile = (f: File | null) => {
if (!f) return;

if (!ALLOWED.includes(f.type)) {
  return toast.error("Use JPG, PNG, WebP, or AVIF.");
}

if (f.size > MAX_BYTES) {
  return toast.error("Image must be under 12MB.");
}

setFile(f);
setPreview(URL.createObjectURL(f));

};

const cancel = () => {
  abortRef.current?.abort();
};

const submit = async (e: React.FormEvent) => {
e.preventDefault();

if (busy || inflightRef.current) return;

if (!file) {
  return toast.error("Pick an image first.");
}

if (caption.length > 500) {
  return toast.error("Caption is too long.");
}

const fp = fingerprint(file);
if (uploadedFingerprints.current.has(fp)) {
  return toast.error("This image was already uploaded in this session.");
}

inflightRef.current = true;
const controller = new AbortController();
abortRef.current = controller;
const signal = controller.signal;

setBusy(true);
setProgress(2);

const loadingToast = toast.loading("Uploading image...");

try {
  const { data: u } = await supabase.auth.getUser();

  if (!u.user) {
    throw new Error("Please sign in first.");
  }

  const uid = u.user.id;

  const photoId = crypto.randomUUID();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const originalPath = `${uid}/${photoId}/original.${ext}`;

  // Process variants in parallel with the original upload.
  toast.message("Optimizing image…", { id: loadingToast });
  const processingPromise = processImage(file).catch((err) => {
    console.warn("[upload] processing failed, will fall back to original only", err);
    return null;
  });

  // Upload the untouched original with retry + cancel.
  setProgress(10);
  await withRetry(async () => {
    const { error } = await supabase.storage
      .from("photos")
      .upload(originalPath, file, { contentType: file.type, upsert: false });
    if (error) throw error;
  }, signal);
  setProgress(45);

  const processed = await processingPromise;
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");

  let mediumPath: string | null = null;
  let thumbPath: string | null = null;
  let mediumUrl: string | null = null;
  let thumbUrl: string | null = null;
  let width: number | null = null;
  let height: number | null = null;

  if (processed) {
    mediumPath = `${uid}/${photoId}/medium.${processed.medium.ext}`;
    thumbPath = `${uid}/${photoId}/thumb.${processed.thumb.ext}`;
    width = processed.sourceWidth;
    height = processed.sourceHeight;

    await Promise.all([
      withRetry(async () => {
        const { error } = await supabase.storage.from("photos").upload(mediumPath!, processed.medium.blob, {
          contentType: processed.medium.contentType,
          upsert: false,
        });
        if (error) throw error;
      }, signal),
      withRetry(async () => {
        const { error } = await supabase.storage.from("photos").upload(thumbPath!, processed.thumb.blob, {
          contentType: processed.thumb.contentType,
          upsert: false,
        });
        if (error) throw error;
      }, signal),
    ]);
  }
  setProgress(80);
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");

  const YEAR = 60 * 60 * 24 * 365;
  const signedOriginal = await supabase.storage
    .from("photos")
    .createSignedUrl(originalPath, YEAR);
  if (signedOriginal.error) throw signedOriginal.error;

  if (mediumPath && thumbPath) {
    const [sm, st] = await Promise.all([
      supabase.storage.from("photos").createSignedUrl(mediumPath, YEAR),
      supabase.storage.from("photos").createSignedUrl(thumbPath, YEAR),
    ]);
    if (sm.error) throw sm.error;
    if (st.error) throw st.error;
    mediumUrl = sm.data.signedUrl;
    thumbUrl = st.data.signedUrl;
  }
  setProgress(92);

  const ins = await supabase
    .from("photos")
    .insert({
      id: photoId,
      owner_id: uid,
      image_url: signedOriginal.data.signedUrl,
      storage_path: originalPath,
      medium_url: mediumUrl,
      thumb_url: thumbUrl,
      medium_path: mediumPath,
      thumb_path: thumbPath,
      width,
      height,
      caption: caption.trim() || null,
    })
    .select("id")
    .single();

  if (ins.error) throw ins.error;

  setProgress(100);
  uploadedFingerprints.current.add(fp);
  toast.dismiss(loadingToast);
  toast.success("Image uploaded successfully.");

  navigate({
    to: "/p/$id",
    params: {
      id: ins.data.id,
    },
  });
} catch (err: any) {
  toast.dismiss(loadingToast);
  if (err?.name === "AbortError") {
    toast.message("Upload cancelled.");
    // Best-effort cleanup of anything already written.
  } else {
    toast.error(err?.message ?? "Upload failed.");
  }
} finally {
  inflightRef.current = false;
  abortRef.current = null;
  setBusy(false);
  setProgress(0);
}

};

return (
<div className="min-h-screen">
<SiteHeader />

  <main className="mx-auto max-w-3xl px-5 py-12">
    <h1 className="font-display text-4xl">
      Place an image.
    </h1>

    <p className="mt-2 text-sm text-muted-foreground">
      One photograph at a time. Choose well.
    </p>

    <form
      onSubmit={submit}
      className="mt-10 space-y-6"
    >
      <button
        type="button"
        onClick={() => setSourceOpen(true)}
        className="block w-full text-left"
      >
        <div className="grid aspect-[4/3] cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-card/40 transition-colors hover:border-foreground/30">
          {preview ? (
            <img
              src={preview}
              alt=""
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="text-center">
              <UploadIcon
                className="mx-auto h-7 w-7 text-muted-foreground"
                strokeWidth={1.5}
              />

              <p className="mt-3 text-sm">
                Choose source
              </p>

              <p className="text-xs text-muted-foreground">
                Gallery or camera · JPG, PNG, WebP, AVIF · up to 12MB
              </p>
            </div>
          )}
        </div>
      </button>

      <div className="space-y-1.5">
        <Label htmlFor="caption">
          Caption{" "}
          <span className="text-muted-foreground">
            (optional)
          </span>
        </Label>

        <Textarea
          id="caption"
          value={caption}
          onChange={(e) =>
            setCaption(e.target.value)
          }
          rows={3}
          maxLength={500}
          placeholder="What is this image about?"
        />

        <p className="text-right text-xs text-muted-foreground">
          {caption.length}/500
        </p>
      </div>

      {busy && (
        <div className="space-y-1.5" aria-live="polite">
          <Progress value={progress} aria-label="Upload progress" />
          <p className="text-xs text-muted-foreground">{progress}% uploaded</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={busy || !file}
          className="flex-1"
        >
          <Camera className="mr-2 h-4 w-4" />
          {busy
            ? "Uploading... Please wait"
            : "Place image"}
        </Button>

        {busy ? (
          <Button type="button" variant="outline" onClick={cancel}>
            Cancel upload
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/" })}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  </main>

  <SourceSelect
    open={sourceOpen}
    onClose={() => setSourceOpen(false)}
    onPick={(f) => {
      setSourceOpen(false);
      onFile(f);
    }}
  />
</div>

);
}
