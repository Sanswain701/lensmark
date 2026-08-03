import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { GalleryHome } from "@/components/gallery/gallery-home";
import { galleryQueryOptions } from "@/lib/gallery";

export const Route = createFileRoute("/g/$handle/")({
  head: ({ params }) => {
    const url = `https://lensmark.lovable.app/g/${params.handle}`;
    const title = `@${params.handle} · Gallery · LensMark`;
    const description = `The photography gallery of @${params.handle} — frames, daily pictures, and collections.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: GalleryHomeRoute,
});

function GalleryHomeRoute() {
  const { handle } = Route.useParams();
  const { user } = useAuth();
  const { data } = useSuspenseQuery(galleryQueryOptions(handle));
  const isOwner = Boolean(user && data.profile && user.id === data.profile.id);
  return <GalleryHome data={data} handle={handle} isOwner={isOwner} />;
}