import { useEffect, useRef } from "react";
import { X, Image as ImageIcon, Camera } from "lucide-react";

export type SourceKind = "gallery" | "camera";

type SourceOption = {
  kind: SourceKind;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accept: string;
  capture?: "environment" | "user";
};

const DEFAULT_OPTIONS: SourceOption[] = [
  {
    kind: "gallery",
    label: "Device Gallery",
    description: "Pick from your photo library",
    icon: ImageIcon,
    accept: "image/*",
  },
  {
    kind: "camera",
    label: "Camera",
    description: "Capture right now",
    icon: Camera,
    accept: "image/*",
    capture: "environment",
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (file: File, kind: SourceKind) => void;
  options?: SourceOption[];
};

/**
 * Fullscreen, editorial source-selection sheet.
 * Reusable: pass a custom `options` array to add Files, URL, Drive, etc.
 */
export function SourceSelect({ open, onClose, onPick, options = DEFAULT_OPTIONS }: Props) {
  const inputsRef = useRef<Record<SourceKind, HTMLInputElement | null>>({
    gallery: null,
    camera: null,
  });
  const openingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !openingRef.current) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const trigger = (kind: SourceKind) => {
    openingRef.current = true;
    // Light haptic where supported.
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { (navigator as any).vibrate?.(8); } catch {}
    }
    inputsRef.current[kind]?.click();
    // Re-allow dismiss after the native picker has had time to appear.
    window.setTimeout(() => { openingRef.current = false; }, 800);
  };

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[70] transition-opacity duration-300 ease-[var(--ease-luxury)] ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Choose source"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => { if (!openingRef.current) onClose(); }}
      />

      <div
        className={`absolute inset-x-0 bottom-0 top-0 flex flex-col bg-background transition-transform duration-500 ease-[var(--ease-luxury)] ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 place-items-center rounded-full border border-border/60 bg-card/60 text-foreground/80 transition-colors hover:bg-card"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <span className="text-[0.6875rem] uppercase tracking-[0.24em] text-muted-foreground">
            Place a Photograph
          </span>
          <span className="h-10 w-10" aria-hidden />
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 pb-16">
          <div className="mb-10">
            <h2 className="font-display text-4xl leading-[1.05] md:text-5xl">Choose Source</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Where is your photograph coming from?
            </p>
          </div>

          <ul className="space-y-3">
            {options.map((opt) => {
              const Icon = opt.icon;
              return (
                <li key={opt.kind}>
                  <button
                    type="button"
                    onClick={() => trigger(opt.kind)}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-border/60 bg-card/40 px-5 py-5 text-left transition-all duration-300 ease-[var(--ease-luxury)] hover:border-foreground/25 hover:bg-card active:scale-[0.995]"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border/50 bg-background/60 text-foreground/80 transition-colors group-hover:text-foreground">
                      <Icon className="h-5 w-5" strokeWidth={1.4} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-medium tracking-tight">{opt.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {opt.description}
                      </span>
                    </span>
                    <span className="text-muted-foreground/60 transition-transform duration-300 group-hover:translate-x-0.5">
                      →
                    </span>
                  </button>
                  <input
                    ref={(el) => { inputsRef.current[opt.kind] = el; }}
                    type="file"
                    accept={opt.accept}
                    {...(opt.capture ? { capture: opt.capture } : {})}
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) onPick(f, opt.kind);
                    }}
                  />
                </li>
              );
            })}
          </ul>

          <p className="mt-10 text-center text-[0.6875rem] uppercase tracking-[0.24em] text-muted-foreground/70">
            Originals are preserved · No filters applied
          </p>
        </div>
      </div>
    </div>
  );
}