import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { SocialIcons } from "@/components/social-icons";
import { Display, Eyebrow, Meta } from "@/components/ui/typography";
import type { GalleryProfile } from "@/lib/gallery";

type Props = {
  profile: GalleryProfile;
  isOwner: boolean;
};

/**
 * Identity band that sits over the cover fade. Contains avatar, gallery title
 * (display_name || username), handle, short statement, socials, joined date,
 * and — for the owner — an "Edit gallery" affordance linking to Settings.
 */
export function GalleryHeader({ profile, isOwner }: Props) {
  const title = profile.display_name ?? profile.username;

  return (
    <section
      aria-labelledby="gallery-title"
      className="relative z-10 -mt-16 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 md:-mt-20 md:flex md:flex-wrap md:items-end md:justify-between"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-background bg-secondary shadow-[var(--shadow-elegant)] ring-1 ring-foreground/10 md:h-32 md:w-32">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-full w-full object-cover"
              decoding="async"
            />
          ) : (
            <div className="grid h-full place-items-center font-display text-2xl">
              {profile.username.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <Eyebrow className="mb-1.5 text-muted-foreground">Gallery</Eyebrow>
          <Display id="gallery-title" as="h1" size="xl" className="truncate">
            {title}
          </Display>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Meta className="text-sm text-muted-foreground">@{profile.username}</Meta>
            <span aria-hidden className="text-muted-foreground/50">·</span>
            <Meta className="text-sm text-muted-foreground">
              Curating since {format(new Date(profile.created_at), "MMM yyyy")}
            </Meta>
            <SocialIcons
              instagram={profile.instagram}
              twitter={profile.twitter}
              website={profile.website}
            />
          </div>
          {profile.bio && (
            <p className="mt-5 max-w-2xl whitespace-pre-line text-[15px] leading-[1.7] text-foreground/90">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="flex shrink-0 items-center gap-2 self-start md:self-end">
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to="/settings">
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
              <span>Edit gallery</span>
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}