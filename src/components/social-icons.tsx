import { Instagram, Twitter, Globe } from "lucide-react";

type Props = {
  instagram?: string | null;
  twitter?: string | null;
  website?: string | null;
  className?: string;
};

function igUrl(h: string) { return `https://instagram.com/${h.replace(/^@/, "")}`; }
function xUrl(h: string)  { return `https://x.com/${h.replace(/^@/, "")}`; }
function webUrl(u: string) { return /^https?:\/\//i.test(u) ? u : `https://${u}`; }

export function SocialIcons({ instagram, twitter, website, className = "" }: Props) {
  if (!instagram && !twitter && !website) return null;
  return (
    <div className={`flex items-center gap-3 text-muted-foreground ${className}`}>
      {instagram && (
        <a href={igUrl(instagram)} target="_blank" rel="noreferrer noopener" aria-label="Instagram" className="transition-colors hover:text-foreground">
          <Instagram className="h-4 w-4" strokeWidth={1.5} />
        </a>
      )}
      {twitter && (
        <a href={xUrl(twitter)} target="_blank" rel="noreferrer noopener" aria-label="X (Twitter)" className="transition-colors hover:text-foreground">
          <Twitter className="h-4 w-4" strokeWidth={1.5} />
        </a>
      )}
      {website && (
        <a href={webUrl(website)} target="_blank" rel="noreferrer noopener" aria-label="Website" className="transition-colors hover:text-foreground">
          <Globe className="h-4 w-4" strokeWidth={1.5} />
        </a>
      )}
    </div>
  );
}