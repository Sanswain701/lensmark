import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { displayUrl } from "@/lib/photo-urls";
import {
  ownerPhotosQueryOptions,
  slugify,
  uniqueSlugForOwner,
  type Frame,
} from "@/lib/frames";
import { Check, ImagePlus } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  ownerId: string;
  handle: string;
  /** Existing frame (edit) or undefined (create). */
  frame?: Frame;
  /** Optional preset cover photo id (e.g. opened from PhotoViewer). */
  presetCoverId?: string;
  onSaved?: (frame: { id: string; slug: string }) => void;
};

const TITLE_MAX = 120;
const DESC_MAX = 2000;

export function FrameEditor({
  open,
  onClose,
  ownerId,
  handle: _handle,
  frame,
  presetCoverId,
  onSaved,
}: Props) {
  const qc = useQueryClient();
  const isEdit = Boolean(frame);

  const [title, setTitle] = useState(frame?.title ?? "");
  const [description, setDescription] = useState(frame?.description ?? "");
  const [coverId, setCoverId] = useState<string | null>(
    frame?.cover_photo_id ?? presetCoverId ?? null,
  );
  const [published, setPublished] = useState<boolean>(
    frame ? frame.visibility === "published" : true,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(frame?.title ?? "");
    setDescription(frame?.description ?? "");
    setCoverId(frame?.cover_photo_id ?? presetCoverId ?? null);
    setPublished(frame ? frame.visibility === "published" : true);
  }, [open, frame, presetCoverId]);

  const photosQ = useQuery({ ...ownerPhotosQueryOptions(ownerId), enabled: open });

  const selectedPhoto = useMemo(
    () => photosQ.data?.find((p) => p.id === coverId) ?? null,
    [photosQ.data, coverId],
  );

  const save = useMutation({
    mutationFn: async () => {
      const trimmed = title.trim();
      if (!trimmed) throw new Error("Give this Frame a title.");
      if (!coverId) throw new Error("Choose a cover photograph.");
      const slug = await uniqueSlugForOwner(ownerId, slugify(trimmed), frame?.id);
      const payload = {
        owner_id: ownerId,
        title: trimmed.slice(0, TITLE_MAX),
        slug,
        description: description.trim() ? description.trim().slice(0, DESC_MAX) : null,
        cover_photo_id: coverId,
        visibility: published ? "published" : "draft",
      };
      if (frame) {
        const { data, error } = await supabase
          .from("frames")
          .update(payload)
          .eq("id", frame.id)
          .select("id,slug")
          .single();
        if (error) throw error;
        return data;
      }
      // Assign a display_order = max + 1 (owner-scope).
      const { data: maxRow } = await supabase
        .from("frames")
        .select("display_order")
        .eq("owner_id", ownerId)
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextOrder = (maxRow?.display_order ?? 0) + 1;
      const { data, error } = await supabase
        .from("frames")
        .insert({ ...payload, display_order: nextOrder })
        .select("id,slug")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["frames", "list", ownerId] });
      qc.invalidateQueries({ queryKey: ["frames", "detail", ownerId] });
      toast.success(isEdit ? "Frame updated." : "Frame added.");
      onSaved?.(data as { id: string; slug: string });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Frame" : "New Frame"}</DialogTitle>
          <DialogDescription>
            A Frame is a single, deliberate photograph. Choose your best.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[minmax(0,220px)_1fr]">
          <div className="space-y-2">
            <Label>Cover</Label>
            <div className="aspect-[4/5] overflow-hidden rounded-lg border border-border bg-[image:var(--gradient-surface)]">
              {selectedPhoto ? (
                <img
                  src={displayUrl(selectedPhoto, "medium")}
                  alt={selectedPhoto.caption ?? "Selected cover"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">
                  <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <p className="meta text-xs text-muted-foreground">
              {photosQ.data?.length ?? 0} photographs available
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="frame-title">Title</Label>
              <Input
                id="frame-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_MAX}
                placeholder="Monsoon window"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="frame-desc">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="frame-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={DESC_MAX}
                placeholder="A short note about this photograph."
              />
              <p className="text-right text-xs text-muted-foreground">
                {description.length}/{DESC_MAX}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-xs text-muted-foreground">
                  Off keeps this Frame private (visible only to you).
                </p>
              </div>
              <Switch checked={published} onCheckedChange={setPublished} />
            </div>
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Choose a photograph</Label>
          {photosQ.isLoading ? (
            <div className="h-40 animate-pulse rounded-md bg-muted" />
          ) : (photosQ.data?.length ?? 0) === 0 ? (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              You haven't uploaded any photographs yet. Upload one first, then come back.
            </p>
          ) : (
            <div
              role="radiogroup"
              aria-label="Choose cover photograph"
              className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-6"
            >
              {photosQ.data!.map((p) => {
                const selected = p.id === coverId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setCoverId(p.id)}
                    className={
                      "group relative aspect-square overflow-hidden rounded-md border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                      (selected ? "border-gold" : "border-transparent hover:border-border")
                    }
                  >
                    <img
                      src={displayUrl(p, "thumb")}
                      alt={p.caption ?? "Photograph"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    {selected && (
                      <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-gold text-background">
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setSaving(true);
              save.mutate(undefined, { onSettled: () => setSaving(false) });
            }}
            disabled={saving || save.isPending || !title.trim() || !coverId}
          >
            {isEdit ? "Save changes" : "Add Frame"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}