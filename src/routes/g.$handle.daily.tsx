import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { GallerySectionPlaceholder } from "@/components/gallery/gallery-section-placeholder";

export const Route = createFileRoute("/g/$handle/daily")({
  head: ({ params }) => ({
    meta: [
      { title: `Daily · @${params.handle} · LensMark` },
      { name: "description", content: `A picture a day from @${params.handle}.` },
      { property: "og:title", content: `Daily · @${params.handle}` },
    ],
  }),
  component: DailySectionRoute,
});

function DailySectionRoute() {
  const { handle } = Route.useParams();
  return (
    <GallerySectionPlaceholder
      handle={handle}
      eyebrow="Daily"
      icon={<CalendarDays strokeWidth={1.5} />}
      title="One picture a day, dated and quiet."
      description="A month calendar of Daily pictures. No streaks. Opens with an upcoming release."
    />
  );
}