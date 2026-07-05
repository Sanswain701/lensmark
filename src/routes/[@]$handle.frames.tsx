import { createFileRoute } from "@tanstack/react-router";
import { Frame } from "lucide-react";
import { GallerySectionPlaceholder } from "@/components/gallery/gallery-section-placeholder";

export const Route = createFileRoute("/@$handle/frames")({
  head: ({ params }) => ({
    meta: [
      { title: `Frames · @${params.handle} · LensMark` },
      { name: "description", content: `The permanent portfolio of @${params.handle}.` },
      { property: "og:title", content: `Frames · @${params.handle}` },
    ],
  }),
  component: FramesSectionRoute,
});

function FramesSectionRoute() {
  const { handle } = Route.useParams();
  return (
    <GallerySectionPlaceholder
      handle={handle}
      eyebrow="Frames"
      icon={<Frame strokeWidth={1.5} />}
      title="The permanent portfolio is being framed."
      description="Up to twenty-four Frames — the photographer's chosen work. Opens with an upcoming release."
    />
  );
}