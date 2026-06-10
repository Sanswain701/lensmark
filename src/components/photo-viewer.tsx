import { useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

type Props = {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
};

/**
 * Fullscreen immersive viewer: pinch-to-zoom (touch), wheel zoom, double-tap,
 * pan, ESC to close. Preserves original aspect ratio.
 */
export function PhotoViewer({ src, alt, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/97 backdrop-blur-sm" role="dialog" aria-modal="true">
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={6}
        doubleClick={{ mode: "toggle", step: 2 }}
        wheel={{ step: 0.15 }}
        pinch={{ step: 5 }}
        panning={{ velocityDisabled: true }}
        centerOnInit
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur">
              <button onClick={() => zoomOut()} aria-label="Zoom out" className="grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10">
                <ZoomOut className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button onClick={() => zoomIn()} aria-label="Zoom in" className="grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10">
                <ZoomIn className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button onClick={() => resetTransform()} aria-label="Reset" className="grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10">
                <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10">
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <TransformComponent
              wrapperStyle={{ width: "100vw", height: "100vh" }}
              contentStyle={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <img
                src={src}
                alt={alt ?? ""}
                draggable={false}
                className="max-h-screen max-w-[100vw] select-none object-contain"
              />
            </TransformComponent>
            <p className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-white/40">
              Pinch · scroll · double-tap to zoom · esc to close
            </p>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}