import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { GalleryProfile } from "@/lib/gallery";

type Props = {
  profile: GalleryProfile;
  isOwner: boolean;
};

/**
 * Gallery cover band. 28vh mobile, 40vh desktop (per GALLERY_SPEC §5).
 * Renders the profile cover image or a warm empty gradient when absent.
 * Owners see a "Change cover" affordance in the top-right.
 */
export function GalleryCover({ profile, isOwner }: Props) {
  const hasCover = Boolean(profile.cover_url);

  return (
    <div
      className="relative w-full overflow-hidden bg-[image:var(--gradient-surface)]"
      style={{ minHeight: "28dvh" }}
      aria-hidden={hasCover ? undefined : true}
    >
      <div className="relative h-[28dvh] w-full md:h-[40dvh]">
        {hasCover ? (
          <img
            src={profile.cover_url!}
            alt=""
            className="h-full w-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-muted via-background to-background" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px hairline-gold" />

        {isOwner && (
          <div className="absolute right-4 top-4 md:right-6 md:top-6">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-1.5 shadow-[var(--shadow-soft)] backdrop-blur"
              onClick={() =>
                toast("Cover editing opens in the next release.", {
                  description: "Loop 3 shell — full cover editor lands with Loop 4.",
                })
              }
            >
              <Camera className="h-4 w-4" strokeWidth={1.5} />
              <span>{hasCover ? "Change cover" : "Add a cover"}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}