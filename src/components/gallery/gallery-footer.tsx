import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Share2, Home as HomeIcon, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eyebrow, Meta } from "@/components/ui/typography";
import type { GalleryData } from "@/lib/gallery";

type Props = {
  data: GalleryData;
  handle: string;
};

/**
 * Quiet gallery footer — small stats, return-to-home, share.
 * Public metrics are limited by spec §4 to counts + joined + trust.
 */
export function GalleryFooter({ data, handle }: Props) {
  const [copied, setCopied] = useState(false);
  const profile = data.profile!;

  const share = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/@${handle}`
        : `/@${handle}`;
    const title = `${profile.display_name ?? profile.username} on LensMark`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Gallery link copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // user cancelled — ignore
    }
  };

  return (
    <footer className="mt-16 border-t border-border/60 bg-background">
      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-10 md:grid-cols-[1fr_auto] md:items-center">
        <dl className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <Eyebrow className="text-muted-foreground">Photographs</Eyebrow>
            <Meta className="mt-1 block text-base text-foreground">
              {data.counts.photos.toLocaleString()}
            </Meta>
          </div>
          <div>
            <Eyebrow className="text-muted-foreground">Collections</Eyebrow>
            <Meta className="mt-1 block text-base text-foreground">
              {data.counts.collections.toLocaleString()}
            </Meta>
          </div>
          <div>
            <Eyebrow className="text-muted-foreground">Trust</Eyebrow>
            <Meta className="mt-1 block text-base text-foreground">
              {profile.trust_score}
            </Meta>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="ghost" className="gap-1.5">
            <Link to="/@$handle" params={{ handle }}>
              <HomeIcon className="h-4 w-4" strokeWidth={1.5} />
              <span>Return to Home</span>
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={share}
            aria-label="Share this gallery"
          >
            {copied ? (
              <Check className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Share2 className="h-4 w-4" strokeWidth={1.5} />
            )}
            <span>{copied ? "Copied" : "Share gallery"}</span>
          </Button>
        </div>
      </div>
    </footer>
  );
}