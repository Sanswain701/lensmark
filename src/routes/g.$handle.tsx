import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StatusView, BackHomeLink } from "@/components/ui/status-view";
import { GalleryShell } from "@/components/gallery/gallery-shell";
import { galleryQueryOptions } from "@/lib/gallery";

export const Route = createFileRoute("/g/$handle")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      galleryQueryOptions(params.handle),
    );
    if (!data.profile) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    const title = loaderData?.profile
      ? `${loaderData.profile.display_name ?? loaderData.profile.username} · Gallery · LensMark`
      : `@${params.handle} · Gallery · LensMark`;
    const description = loaderData?.profile?.bio?.slice(0, 160) ??
      `The photography gallery of @${params.handle} on LensMark.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
      ],
    };
  },
  component: GalleryLayout,
  errorComponent: GalleryErrorView,
  notFoundComponent: GalleryNotFoundView,
});

function GalleryLayout() {
  const { handle } = Route.useParams();
  const { user } = useAuth();
  const { data } = useSuspenseQuery(galleryQueryOptions(handle));
  const isOwner = Boolean(user && data.profile && user.id === data.profile.id);

  return (
    <GalleryShell handle={handle} data={data} isOwner={isOwner}>
      <Outlet />
    </GalleryShell>
  );
}

function GalleryNotFoundView() {
  return (
    <StatusView
      title="No gallery at that handle."
      description="The photographer you're looking for hasn't opened their doors — or the handle has changed."
      action={<BackHomeLink />}
    />
  );
}

function GalleryErrorView() {
  return (
    <StatusView
      title="This gallery didn't open."
      description="Something went quiet on our end. Try again in a moment."
      action={<BackHomeLink />}
    />
  );
}