import { useState, type ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { GalleryCover } from "./gallery-cover";
import { GalleryHeader } from "./gallery-header";
import { GalleryNavigation } from "./gallery-navigation";
import { GalleryFooter } from "./gallery-footer";
import { GalleryManageSections } from "./gallery-manage-sections";
import { GALLERY_SECTIONS, type GalleryData, type GallerySectionKey } from "@/lib/gallery";

type Props = {
  handle: string;
  data: GalleryData;
  isOwner: boolean;
  children: ReactNode;
};

/**
 * Shared layout for every Gallery page. Composes:
 *   SiteHeader · Cover · IdentityHeader · SectionNav · <children> · Footer
 *
 * Section reorder + hide is UI-only, session-scoped (Loop 3 owner-mode preview).
 */
export function GalleryShell({ handle, data, isOwner, children }: Props) {
  const [order, setOrder] = useState<GallerySectionKey[]>(() =>
    GALLERY_SECTIONS.map((s) => s.key),
  );
  const [hidden, setHidden] = useState<Set<GallerySectionKey>>(new Set());

  const profile = data.profile!;

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <GalleryCover profile={profile} isOwner={isOwner} />

      <div className="mx-auto max-w-5xl px-5">
        <GalleryHeader profile={profile} isOwner={isOwner} />
      </div>

      <div className="mt-8">
        <GalleryNavigation handle={handle} hiddenSections={hidden} />
        {isOwner && (
          <div className="mx-auto flex max-w-5xl justify-end px-5 py-2">
            <GalleryManageSections
              order={order}
              onOrderChange={setOrder}
              hidden={hidden}
              onHiddenChange={setHidden}
            />
          </div>
        )}
      </div>

      <main id="main" className="mx-auto max-w-5xl px-5 py-10 pb-24 md:pb-16">
        {children}
      </main>

      <GalleryFooter data={data} handle={handle} />
      <MobileBottomNav />
    </div>
  );
}