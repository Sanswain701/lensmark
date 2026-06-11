import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type Props = {
  open: boolean;
  onClose: () => void;
  src: string | null;
  aspect: number; // e.g. 1 for avatar, 3 for cover
  title?: string;
  shape?: "rect" | "round";
  outputSize?: number; // longest edge in px
  onCropped: (blob: Blob) => void;
};

async function cropToBlob(src: string, area: Area, outputSize: number, aspect: number): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
  const outW = aspect >= 1 ? outputSize : Math.round(outputSize * aspect);
  const outH = aspect >= 1 ? Math.round(outputSize / aspect) : outputSize;
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outW, outH);
  return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.9));
}

export function ImageCropper({ open, onClose, src, aspect, title = "Adjust image", shape = "rect", outputSize = 1600, onCropped }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  const apply = async () => {
    if (!src || !area) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(src, area, outputSize, aspect);
      onCropped(blob);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="relative h-[360px] w-full overflow-hidden rounded-md bg-black">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={shape}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onComplete}
              showGrid={false}
              objectFit="contain"
            />
          )}
        </div>
        <div className="px-1">
          <Slider min={1} max={4} step={0.01} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={apply} disabled={busy || !area}>{busy ? "Saving…" : "Apply"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}