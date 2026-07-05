import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { GalleryHome } from "@/components/gallery/gallery-home";
import { galleryQueryOptions } from "@/lib/gallery";

export const Route = createFileRoute("/@$handle/")({
  component: GalleryHomeRoute,
});

function GalleryHomeRoute() {
  const { handle } = Route.useParams();
  const { user } = useAuth();
  const { data } = useSuspenseQuery(galleryQueryOptions(handle));
  const isOwner = Boolean(user && data.profile && user.id === data.profile.id);
  return <GalleryHome data={data} handle={handle} isOwner={isOwner} />;
}