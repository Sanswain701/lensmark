import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { GallerySectionPlaceholder } from "@/components/gallery/gallery-section-placeholder";

export const Route = createFileRoute("/g/$handle/about")({
  head: ({ params }) => ({
    meta: [
      { title: `About · @${params.handle} · LensMark` },
      { name: "description", content: `About @${params.handle} — statement and links.` },
      { property: "og:title", content: `About · @${params.handle}` },
    ],
  }),
  component: AboutSectionRoute,
});

function AboutSectionRoute() {
  const { handle } = Route.useParams();
  return (
    <GallerySectionPlaceholder
      handle={handle}
      eyebrow="About"
      icon={<BookOpen strokeWidth={1.5} />}
      title="The photographer's statement opens soon."
      description="A short prose piece, an optional portrait, and the links the photographer wants you to follow."
    />
  );
}