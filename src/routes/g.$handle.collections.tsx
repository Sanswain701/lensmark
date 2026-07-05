import { createFileRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { GallerySectionPlaceholder } from "@/components/gallery/gallery-section-placeholder";

export const Route = createFileRoute("/g/$handle/collections")({
  head: ({ params }) => ({
    meta: [
      { title: `Collections · @${params.handle} · LensMark` },
      { name: "description", content: `Themed collections curated by @${params.handle}.` },
      { property: "og:title", content: `Collections · @${params.handle}` },
    ],
  }),
  component: CollectionsSectionRoute,
});

function CollectionsSectionRoute() {
  const { handle } = Route.useParams();
  return (
    <GallerySectionPlaceholder
      handle={handle}
      eyebrow="Collections"
      icon={<Layers strokeWidth={1.5} />}
      title="Themed collections open with the next loop."
      description="Up to twelve Collections weave Frames, Daily, and Stuff into new arrangements."
    />
  );
}