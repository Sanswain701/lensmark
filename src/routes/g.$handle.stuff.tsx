import { createFileRoute } from "@tanstack/react-router";
import { Hammer } from "lucide-react";
import { GallerySectionPlaceholder } from "@/components/gallery/gallery-section-placeholder";

export const Route = createFileRoute("/g/$handle/stuff")({
  head: ({ params }) => ({
    meta: [
      { title: `Stuff · @${params.handle} · LensMark` },
      { name: "description", content: `Workshop images from @${params.handle}.` },
      { property: "og:title", content: `Stuff · @${params.handle}` },
    ],
  }),
  component: StuffSectionRoute,
});

function StuffSectionRoute() {
  const { handle } = Route.useParams();
  return (
    <GallerySectionPlaceholder
      handle={handle}
      eyebrow="Stuff"
      icon={<Hammer strokeWidth={1.5} />}
      title="The workshop opens soon."
      description="Unpolished, exploratory, uncapped. A place for images that haven't earned a Frame."
    />
  );
}