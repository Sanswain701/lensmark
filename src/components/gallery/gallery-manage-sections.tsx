import { useState } from "react";
import { Settings2, GripVertical, Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Muted } from "@/components/ui/typography";
import { GALLERY_SECTIONS, type GallerySectionKey } from "@/lib/gallery";

type Props = {
  order: GallerySectionKey[];
  onOrderChange: (next: GallerySectionKey[]) => void;
  hidden: Set<GallerySectionKey>;
  onHiddenChange: (next: Set<GallerySectionKey>) => void;
};

const labelFor = (key: GallerySectionKey) =>
  GALLERY_SECTIONS.find((s) => s.key === key)?.label ?? key;

/**
 * Owner-only sheet to reorder and hide sections. UI-only in Loop 3 —
 * state persists in memory for the session (no DB writes).
 * "Home" is fixed as the first section and cannot be hidden.
 */
export function GalleryManageSections({ order, onOrderChange, hidden, onHiddenChange }: Props) {
  const [open, setOpen] = useState(false);

  const move = (key: GallerySectionKey, delta: -1 | 1) => {
    const idx = order.indexOf(key);
    if (idx <= 0 && delta === -1) return;
    if (idx === -1) return;
    const target = idx + delta;
    // Home is pinned to index 0
    if (order[target] === "home" || target <= 0) return;
    if (target >= order.length) return;
    const next = order.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    onOrderChange(next);
  };

  const toggleHide = (key: GallerySectionKey) => {
    if (key === "home") return;
    const next = new Set(hidden);
    next.has(key) ? next.delete(key) : next.add(key);
    onHiddenChange(next);
  };

  const reset = () => {
    onOrderChange(GALLERY_SECTIONS.map((s) => s.key));
    onHiddenChange(new Set());
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          aria-label="Manage gallery sections"
        >
          <Settings2 className="h-4 w-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">Manage sections</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">Manage sections</SheetTitle>
          <SheetDescription>
            Rearrange or hide sections. Home stays first. Changes are a preview only in this
            release — persistence lands in a later loop.
          </SheetDescription>
        </SheetHeader>

        <ul className="mt-6 space-y-2" aria-label="Section order">
          {order.map((key, idx) => {
            const isHome = key === "home";
            const isHidden = hidden.has(key);
            return (
              <li
                key={key}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <GripVertical
                  className="h-4 w-4 text-muted-foreground"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate font-display text-[15px]">
                  {labelFor(key)}
                  {isHome && (
                    <span className="ml-2 text-xs text-muted-foreground">(pinned)</span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label={`Move ${labelFor(key)} up`}
                    disabled={idx <= 1 || isHome}
                    onClick={() => move(key, -1)}
                  >
                    <ArrowUp className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label={`Move ${labelFor(key)} down`}
                    disabled={idx === 0 || idx === order.length - 1 || isHome}
                    onClick={() => move(key, 1)}
                  >
                    <ArrowDown className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label={isHidden ? `Show ${labelFor(key)}` : `Hide ${labelFor(key)}`}
                    aria-pressed={isHidden}
                    disabled={isHome}
                    onClick={() => toggleHide(key)}
                  >
                    {isHidden ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex items-center justify-between">
          <Muted>Preview only · session-scoped</Muted>
          <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={reset}>
            <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
            <span>Reset</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}