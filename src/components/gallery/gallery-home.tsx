import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Frame,
  CalendarDays,
  Hammer,
  Layers,
  BookOpen,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import { Display, Eyebrow, Muted } from "@/components/ui/typography";
import { SectionHeader } from "@/components/ui/section-header";
import type { GalleryData } from "@/lib/gallery";

type Props = {
  data: GalleryData;
  handle: string;
  isOwner: boolean;
};

type Slot = {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  to: "/@$handle/frames" | "/@$handle/daily" | "/@$handle/stuff" | "/@$handle/collections" | "/@$handle/about";
  icon: ReactNode;
  span?: "full" | "half";
};

/**
 * Gallery Home surface. Loop 3 = shell only: real feed slots (Featured Frame,
 * Today from Daily, Workshop, Collections strip, About preview, Guestbook)
 * are represented by placeholder preview cards linking to their sections.
 * Composition follows GALLERY_SPEC §8.1.
 */
export function GalleryHome({ data, handle, isOwner }: Props) {
  const name = data.profile?.display_name ?? data.profile?.username ?? "This photographer";

  const slots: Slot[] = [
    {
      key: "featured",
      eyebrow: "Featured frame",
      title: "The photograph they want you to see first.",
      description:
        "One Frame, chosen by the photographer, sits at the top of every visit. It anchors the gallery.",
      to: "/@$handle/frames",
      icon: <Frame className="h-5 w-5" strokeWidth={1.5} />,
      span: "full",
    },
    {
      key: "today",
      eyebrow: "Today from Daily",
      title: "One picture a day. No streaks.",
      description:
        "The most recent Daily picture appears here — dated, quiet, and singular.",
      to: "/@$handle/daily",
      icon: <CalendarDays className="h-5 w-5" strokeWidth={1.5} />,
    },
    {
      key: "workshop",
      eyebrow: "From the workshop",
      title: "Unpolished, exploratory, in progress.",
      description:
        "A glimpse into Stuff — the low-ceremony space where images live before they earn a Frame.",
      to: "/@$handle/stuff",
      icon: <Hammer className="h-5 w-5" strokeWidth={1.5} />,
    },
    {
      key: "collections",
      eyebrow: "Collections",
      title: "Themed groupings across the gallery.",
      description:
        "Up to twelve curated Collections weave Frames, Daily, and Stuff into new arrangements.",
      to: "/@$handle/collections",
      icon: <Layers className="h-5 w-5" strokeWidth={1.5} />,
    },
    {
      key: "about",
      eyebrow: "About the photographer",
      title: `Why ${name} makes photographs.`,
      description:
        "A short statement, a portrait, and the links they want you to follow — no more, no less.",
      to: "/@$handle/about",
      icon: <BookOpen className="h-5 w-5" strokeWidth={1.5} />,
    },
  ];

  return (
    <div>
      {isOwner && (
        <aside
          role="note"
          aria-label="Owner preview"
          className="mb-8 rounded-2xl border border-dashed border-gold/50 bg-gold-soft/40 px-5 py-4 text-sm text-foreground"
        >
          <p>
            <span className="font-medium">You're viewing your own gallery.</span>{" "}
            <Muted className="inline text-muted-foreground">
              Sections below are placeholders — Frames, Daily, Stuff, Collections and About land in
              upcoming loops. The shell is production-ready.
            </Muted>
          </p>
        </aside>
      )}

      <SectionHeader
        eyebrow="Gallery home"
        title="A quiet entrance."
        aside={<Muted className="hidden sm:block">Assembled, not authored.</Muted>}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {slots.map((slot) => (
          <SlotCard key={slot.key} slot={slot} handle={handle} />
        ))}
      </div>

      {/* Guestbook strip — lives on Home per spec §11, but is not a nav section */}
      <div className="mt-10">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-soft)]">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-soft text-gold"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <Eyebrow className="text-muted-foreground">Guestbook</Eyebrow>
              <p className="truncate text-sm text-foreground/90">
                Signed-in visitors can sign the book. Opens with a later loop.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Soon
          </span>
        </div>
      </div>
    </div>
  );
}

function SlotCard({ slot, handle }: { slot: Slot; handle: string }) {
  return (
    <Link
      to={slot.to}
      params={{ handle }}
      className={
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-[image:var(--gradient-surface)] p-6 shadow-[var(--shadow-soft)] transition-shadow duration-500 ease-[var(--ease-luxury)] hover:shadow-[var(--shadow-elegant)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" +
        (slot.span === "full" ? " md:col-span-2" : "")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow className="text-muted-foreground">{slot.eyebrow}</Eyebrow>
          <Display as="h3" size="sm" className="mt-2 text-balance">
            {slot.title}
          </Display>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {slot.description}
          </p>
        </div>
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-background text-gold"
        >
          {slot.icon}
        </span>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Eyebrow className="text-gold transition-colors group-hover:text-foreground">
          Explore
        </Eyebrow>
        <ArrowUpRight
          className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
          strokeWidth={1.5}
        />
      </div>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px scale-x-0 bg-gold transition-transform duration-500 ease-[var(--ease-luxury)] group-hover:scale-x-100"
      />
    </Link>
  );
}