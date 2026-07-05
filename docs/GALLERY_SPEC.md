# LensMark Gallery — Official Product Specification (Loop 2.5)

Status: **Locked**. This document is the source of truth for every future Gallery feature. Blueprint from Loop 2 has been reviewed, challenged, refined, and frozen here. Any deviation in implementation requires an explicit spec amendment first.

Scope note: this spec defines *what* the Gallery is and how it behaves. It does not prescribe database schema, route file paths, or component file locations — those are Loop 3 decisions bound by these rules.

---

## 1. Gallery Philosophy

A Gallery is **a photographer's private museum, opened to the world on their terms**.

- The photograph is the subject. The person is the curator, not the exhibit.
- Attention over engagement. No likes, no follower counts, no streaks, no algorithmic reach.
- Finite by design. Every surface has a cap or an end. Infinite feeds are forbidden.
- Slow and quiet. Motion is subtle, typography is serif-led, silence is a feature.
- Owned URLs. Every artifact has a human-readable permalink: `/@handle`, `/@handle/f/<frame-slug>`, `/@handle/c/<collection-slug>`.
- Equipment invisibility. EXIF is available on request; gear is never a badge.
- One Gallery per user. There are no alt accounts, no themed sub-galleries. A photographer is one person.

**Non-goals (explicit):** social graph, virality mechanics, gamified profiles, reels, stories, DMs, comments-as-feed, ad surfaces, discovery driven by popularity metrics.

---

## 2. Gallery Navigation

A Gallery has exactly **six** sections, in this fixed order:

1. **Home** — the curated entrance.
2. **Frames** — the permanent portfolio.
3. **Daily** — the dated cadence.
4. **Stuff** — the workshop / unpolished.
5. **Collections** — themed groupings.
6. **About** — the photographer's statement.

Guestbook is not a nav item; it lives at the bottom of Home and About (see §11).

Rules:

- Order is invariant across all Galleries. Users cannot reorder, rename, or hide sections from the nav. Empty sections still appear but render an empty state (see §14).
- Nav is sticky on desktop (left rail or top strip — chosen in Loop 3 layout pass), collapses into the mobile bottom nav's Gallery scope on mobile.
- Active section has `aria-current="page"`. No badge counts, no "new" dots.
- Section switching preserves scroll per section for the session.

---

## 3. Gallery Hierarchy

```text
Gallery (1 per user)
├── Home            (assembled view; no owned entities)
├── Frames          → Frame (finite set, capped)
├── Daily           → Daily Picture (one per calendar day, owner-local)
├── Stuff           → Stuff Item (unbounded, low-ceremony)
├── Collections     → Collection → Photo (many-to-many with Frames/Stuff)
└── About           (single document; no children)
```

A **Photo** is the atomic unit. A Photo is *placed into* Frames, Daily, or Stuff — it is not free-floating. Collections reference existing Photos; they do not own them.

---

## 4. Gallery Rules (global)

- **One Gallery per account.** Handle == Gallery URL.
- **Photos live in exactly one primary surface** (Frame OR Daily OR Stuff). Collections are references, not moves.
- **Frames are capped** at a fixed number per Gallery (default: **24**). Cap is enforced client and server side.
- **Daily is one-per-day**, owner's local timezone at time of publish. Backdating is allowed within the last 14 days; future-dating is not.
- **Stuff is uncapped** but paginated at 60 per page and never surfaced in Explore.
- **Collections cap:** 12 per Gallery, up to 200 photos each.
- **About is a single document**, max ~1,200 words, plain prose + optional pull-quote + optional portrait.
- **No metric is public** except Frame count, Collection count, joined date, and trust score.
- **Draft vs Published** applies to Frames, Daily, Stuff, Collections, About. Drafts are owner-only.
- **Deletion is soft** for 30 days (owner-recoverable), then hard.

---

## 5. Gallery Layout

Layout targets three breakpoints: mobile (`<640px`), tablet (`640–1024`), desktop (`>1024`).

- **Cover band**: full-bleed cover image or gradient, ~28vh mobile / ~40vh desktop. Contains photographer name (Display/xl serif), handle, one-line tagline, socials.
- **Section rail**: below cover on mobile, left-aligned sticky on desktop.
- **Section body**: max content width `min(100%, 1200px)`, generous side gutters. Grids use existing tokens; no new spacing scale.
- **Footer**: quiet — joined date, trust score, guestbook link, report link.

No sidebars other than the section rail. No floating action buttons except the owner's "Add" affordance (see §6).

---

## 6. Owner View

When `viewer.id === gallery.owner_id`:

- A single **Add** affordance appears per section, contextual: "Add Frame", "Post Today's Picture", "Add to Stuff", "New Collection", "Edit About". Never a global "+" that spans sections.
- **Edit-in-place** on About, Frame captions, Collection titles, and Daily notes. No modal editors for text under 400 chars.
- **Draft badge** (small, neutral) on unpublished items. Drafts are inline in the owner view, hidden from visitors.
- **Reorder** is allowed only in Frames (drag) and Collections (drag). Daily is chronological, Stuff is chronological.
- **Analytics are private.** The owner sees per-Frame view counts and Guestbook entries. No visitor sees these numbers.
- **Danger actions** (delete Gallery, transfer handle) live in Settings, never in the Gallery UI.

---

## 7. Visitor View

When `viewer.id !== gallery.owner_id` (including signed-out):

- No Add / Edit / Draft affordances. Ever.
- No counts beyond those in §4.
- Guestbook entry form is available to signed-in visitors; signed-out visitors see a "Sign in to sign the book" quiet prompt.
- Reporting is available on any Photo, Frame, or About via an unobtrusive overflow menu.
- Follow / subscribe: **not in v1.** A "Get notified when new Frames are added" opt-in email is the only subscription surface, and only if the owner has enabled it in About settings.

---

## 8. Gallery Sections — Detailed Rules

### 8.1 Home

Purpose: the entrance. Assembled, not authored.

Composition (top to bottom):

1. Cover + identity band.
2. **Featured Frame** (owner-chosen, one). Full-bleed hero card.
3. **Today from Daily** (if a Daily exists for today in owner tz). Otherwise most recent Daily, dated.
4. **From the workshop** — three most recent Stuff items, small grid.
5. **Collections strip** — up to 6, horizontally scrollable on mobile.
6. **About preview** — first paragraph + "Read more".
7. **Guestbook** — last 3 entries + sign form.

Rules:

- Home never shows *all* content. Every section on Home links out to its full section.
- Home has no infinite scroll and no pagination.
- If a section has zero content, its Home slot is omitted entirely (not shown as empty). Home never renders more than 7 slots.

### 8.2 Frames

Purpose: the permanent portfolio. This is what the photographer wants to be remembered by.

- Cap: **24 per Gallery**. Attempting to exceed prompts the owner to remove or replace.
- Each Frame contains 1–12 Photos, one primary Photo (cover).
- Metadata: title (required), year (required), place (optional), 1–3 paragraph statement (optional), EXIF (auto, hidden by default, togglable per Frame).
- Ordering: owner-defined, drag to reorder. Default order: most recently added first.
- Layout: masonry grid on desktop, 2-up on mobile. Cover art is the Photo, never a text card.
- Permalink: `/@handle/f/<slug>`.
- Frame detail page: cover image, title/year/place, statement, then the 1–12 Photos in sequence with the existing `PhotoViewer`.
- Deletion: soft delete 30 days; removing a Frame does not delete its Photos from Collections that reference them.

### 8.3 Daily Pictures

Purpose: cadence. A quiet, dated diary.

- Exactly **one Photo per calendar day** in owner's local timezone at publish time.
- Optional note, max 240 characters, plain text.
- Backdate window: 14 days. No future-dating.
- Layout: calendar grid (month view) as default; list view as toggle. Each cell is the Photo thumbnail; empty days are visibly empty (no placeholder art).
- No streaks. No "you missed a day" nudges. Ever.
- Permalink: `/@handle/d/YYYY-MM-DD`.
- Deletion allowed; the day becomes empty. No tombstone.

### 8.4 Stuff

Purpose: the workshop. Unpolished, exploratory, low-ceremony.

- Uncapped. Paginated at 60 per page, oldest-first descending pages.
- No titles required. Optional one-line caption.
- Grid: dense 3-up mobile / 5-up desktop, uniform squares.
- Not shown in Explore. Not shown in search results outside the Gallery.
- Bulk upload allowed (up to 20 at once). Bulk delete allowed.
- Permalink: `/@handle/s/<id>` (short id, not slug).

### 8.5 Collections

Purpose: themed groupings across Frames, Daily, and Stuff.

- Cap: **12 per Gallery**, **200 Photos per Collection**.
- A Collection references existing Photos; it does not own or duplicate them.
- Metadata: name (required), description (optional, ~200 words), cover Photo (owner-chosen or auto = first).
- Ordering within Collection: owner-defined drag; default = date added descending.
- If a referenced Photo is deleted from its primary surface, it is removed from all Collections automatically.
- Permalink: `/@handle/c/<slug>`.

### 8.6 About

Purpose: the photographer's statement.

- Single document, ~1,200 words max.
- Optional portrait (one Photo, square crop enforced).
- Optional pull-quote (max 180 chars) rendered in serif Display.
- Optional links: personal site, Instagram, print shop. No affiliate links.
- Optional "Notify me on new Frames" toggle (owner-controlled). When on, visitors see a quiet email input.
- Permalink: `/@handle/about`.

### 8.7 Guestbook

Not a nav section. Appears on Home (last 3) and About (full log, paginated at 25).

- Signed-in visitors only. One entry per visitor per 24h per Gallery.
- Entry: 280 chars, plain text. No images, no links (auto-stripped).
- Owner can hide (not delete) any entry. Hidden entries show "Hidden by curator" placeholder to the author only.
- No replies. No threading. Not a comment system.
- Rate-limited; abuse triggers a cooldown, not a public error.

---

## 9. Component Inventory (future, reusable)

All components consume tokens from `docs/DESIGN_SYSTEM.md`. No new color, spacing, or motion tokens are introduced by the Gallery.

Existing (already built, to reuse as-is):

- `Display`, `Eyebrow`, `Meta`, `Muted` (typography)
- `EmptyState`, `StatusView`, `SectionHeader`, `Stat`, `Skeleton`
- `PhotoCard`, `PhotoGrid`, `PhotoViewer`, `ProgressiveImage`
- `SiteHeader`, `MobileBottomNav`, `SocialIcons`

New, to be built in Loop 3+ (names indicative, not paths):

- `GalleryShell` — cover band + identity + section rail + `<Outlet />`.
- `GallerySectionNav` — the six-item rail; sticky desktop, horizontal mobile.
- `FrameCard`, `FrameGrid`, `FrameDetailHeader`, `FrameStatement`.
- `DailyCalendar`, `DailyListView`, `DailyCell`, `DailyDetail`.
- `StuffGrid`, `StuffUploader` (bulk).
- `CollectionCard`, `CollectionStrip`, `CollectionDetailHeader`, `AddToCollectionSheet` (evolve existing dialog).
- `AboutDocument`, `AboutEditor`, `PullQuote`, `PortraitFrame`.
- `GuestbookEntry`, `GuestbookList`, `GuestbookForm`.
- `OwnerAddButton` (contextual per section), `DraftBadge`, `ExifPanel`.
- `SoftDeleteBanner` (owner-only), `RecoverButton`.

Every new component: `aria-*` complete, focus-visible ring, respects reduced-motion, uses `Display`/`Meta` for text.

---

## 10. Expected APIs (contract, not implementation)

Read APIs (available to visitors, RLS-scoped):

- `getGalleryByHandle(handle)` → cover, identity, section counts, featured frame id.
- `listFrames(handle, { limit, cursor })` → published frames only for visitors.
- `getFrame(handle, slug)` → frame + ordered photos.
- `listDaily(handle, { month })` → month grid.
- `getDaily(handle, date)` → single daily.
- `listStuff(handle, { page })` → paginated.
- `listCollections(handle)` → all published collections.
- `getCollection(handle, slug)` → collection + ordered photos.
- `getAbout(handle)` → about doc.
- `listGuestbook(handle, { cursor })` → visible entries.

Write APIs (owner-only, `requireSupabaseAuth` + ownership check):

- Frames: `createFrame`, `updateFrame`, `reorderFrames`, `deleteFrame`, `addPhotoToFrame`, `removePhotoFromFrame`.
- Daily: `publishDaily(date, photoId, note?)`, `updateDailyNote`, `deleteDaily(date)`.
- Stuff: `addStuffBatch(files)`, `updateStuffCaption`, `deleteStuff(ids)`.
- Collections: `createCollection`, `updateCollection`, `addToCollection`, `removeFromCollection`, `reorderCollection`, `deleteCollection`.
- About: `updateAbout(patch)`.
- Guestbook: `signGuestbook(entry)` (visitor), `hideGuestbookEntry(id)` (owner).

All write APIs return the updated entity, not just `{ ok: true }`, so React Query caches update without a refetch.

---

## 11. Expected States

Every section renders one of: **loading**, **empty**, **partial**, **loaded**, **error**, **offline**, **owner-editing**.

- **Loading**: `Skeleton` primitives matching the final layout's silhouette. No spinners.
- **Empty (visitor)**: `EmptyState` variant `quiet`, gently phrased, no CTA.
- **Empty (owner)**: `EmptyState` variant `panel`, with the section's Add affordance as the action.
- **Partial**: some data loaded (e.g. cover but not frames) — render what we have, skeleton the rest.
- **Loaded**: the real thing.
- **Error**: `StatusView` with a single retry action; never a raw error message.
- **Offline**: read cached data if available; show a quiet inline "offline" chip; disable write affordances.
- **Owner-editing**: inline editors, `DraftBadge` where relevant.

---

## 12. User Flows

### 12.1 Visitor lands on `/@handle`

1. Route resolves handle → Gallery.
2. Cover + identity render first (SSR/loader).
3. Home sections stream in (Featured Frame, Today's Daily, Workshop, Collections, About preview, Guestbook).
4. Any section without content is omitted.
5. Clicking any section rail item navigates to that section; scroll resets to top.

### 12.2 Owner publishes today's Daily

1. Owner opens Daily section, sees empty cell for today.
2. Taps "Post Today's Picture".
3. Uploads via existing image pipeline (bounded decode, progress, cancel).
4. Optional 240-char note.
5. Publish → cell fills, Home's "Today from Daily" slot updates optimistically.
6. No confetti, no toast beyond a single `sonner` line: "Posted."

### 12.3 Visitor signs the Guestbook

1. Signed-in visitor scrolls to Guestbook on Home or About.
2. Types up to 280 chars.
3. Submits → entry appears at top of list, rate-limit clock starts.
4. If rate-limited, form disables with quiet "You've already signed today."

### 12.4 Owner creates a Frame

1. Owner on Frames section, taps "Add Frame".
2. Selects 1–12 Photos (from device or existing library).
3. Chooses cover (default = first).
4. Enters title (required), year (required), place, statement.
5. Save as Draft (owner-only) or Publish.
6. Frame appears in owner's grid; drag to reorder.

### 12.5 Owner curates a Collection

1. From any Photo, "Add to Collection" → sheet lists existing Collections + "New Collection".
2. New Collection: name + optional description; Photo becomes cover by default.
3. From Collection page, owner drags to reorder or removes photos (does not delete originals).

---

## 13. Responsive Behaviour

- **Mobile (`<640`)**: cover 28vh, section rail becomes horizontal scroll strip below cover, single-column body except Stuff (3-up) and Frames (2-up). Owner Add affordance sits above the mobile bottom nav with safe-area padding.
- **Tablet (`640–1024`)**: section rail horizontal at top of body; grids 2–3 up.
- **Desktop (`>1024`)**: section rail sticky left; body max 1200px centered; Frames masonry, Stuff 5-up.
- No layout depends on hover. All hover affordances have tap/focus equivalents.
- All grids reflow with CSS grid + `minmax`; no JS-driven resize handlers.

---

## 14. Empty States (per section)

Visitor phrasing is descriptive, not apologetic. Owner phrasing is inviting, not gamified.

| Section | Visitor | Owner |
| --- | --- | --- |
| Home | *(not shown; slot omitted)* | "Your Gallery is quiet. Start with a Frame or today's picture." + two Add buttons. |
| Frames | "No Frames yet." | "Frames are your permanent portfolio. Up to 24." + Add Frame. |
| Daily | "No Daily pictures yet." | "One picture a day. No streaks, no pressure." + Post Today. |
| Stuff | "The workshop is empty." | "Stuff is unpolished by design. Drop images here." + bulk upload zone. |
| Collections | "No Collections yet." | "Group photos by theme. Up to 12." + New Collection. |
| About | "The photographer hasn't written yet." | "Tell visitors why you photograph." + Edit About. |
| Guestbook | "No entries yet." + sign form (if signed in). | Same, plus owner note: "Visitors can sign here." |

---

## 15. Error States

- **404 on handle**: `StatusView` — "No Gallery at that handle." + `BackHomeLink`.
- **404 on Frame/Collection/Daily slug**: `StatusView` scoped inside the Gallery shell so the rail stays visible.
- **403 on draft resource**: treat as 404 to visitors. Owners never see 403 on their own content.
- **Network error on write**: inline error under the affordance, retry button, form state preserved.
- **Rate limit**: quiet inline message, no modal, no toast.
- **Image decode failure on upload**: pipeline surfaces a specific message ("This image couldn't be read. Try a JPEG or PNG under 40MB."), keeps other queued uploads intact.

---

## 16. Accessibility Expectations

- Every interactive element reachable by keyboard in DOM order; focus ring visible (existing token).
- Section rail: `role="navigation"` + `aria-label="Gallery sections"`, active item `aria-current="page"`.
- Cover image: `alt=""` (decorative) when there's a text overlay of the same name.
- Photo images: `alt` from caption; empty `alt` if no caption and image is purely decorative in context.
- `PhotoViewer` traps focus, restores on close, `Esc` closes.
- Drag-to-reorder has a keyboard alternative (arrow keys with `aria-grabbed`).
- Color contrast: all text ≥ 4.5:1 on its background in both themes.
- Reduced motion: honor `prefers-reduced-motion` — disable parallax on cover, shorten transitions to <100ms, no auto-advancing carousels (there are none anyway).
- Screen-reader announces section changes via `aria-live="polite"` on the section body wrapper.

---

## 17. Performance Expectations

Budgets (target on mid-tier Android, 4G):

- Gallery Home LCP: **< 2.0s**.
- Section switch (client nav): **< 200ms** to first paint.
- Feed / grid initial paint: cover + first row within LCP budget; rest lazy.

Rules:

- All grid images: `loading="lazy"`, `decoding="async"`, `sizes` set, `srcset` from `buildSrcSet`.
- First above-the-fold image per section: `fetchpriority="high"`, `loading="eager"`.
- Loaders prefetch only the current section; adjacent sections prefetch on `Link` hover/focus (existing router preload).
- Query cache: `staleTime: 30_000` on read queries; writes update caches directly (no blanket invalidate).
- No third-party scripts on Gallery routes.
- `preconnect` to Supabase storage origin already in `__root.tsx`; keep.
- Guestbook and Stuff paginate; no unbounded lists reach the DOM.

---

## 18. Permissions Matrix

| Action | Signed-out visitor | Signed-in visitor | Owner |
| --- | --- | --- | --- |
| View published Home / Frames / Daily / Stuff / Collections / About | ✓ | ✓ | ✓ |
| View drafts | ✗ | ✗ | ✓ |
| See owner analytics | ✗ | ✗ | ✓ |
| Sign Guestbook | ✗ (prompt to sign in) | ✓ (rate-limited) | ✓ |
| Hide Guestbook entry | ✗ | ✗ | ✓ |
| Report content | ✓ | ✓ | ✓ (own content: no-op) |
| Add / Edit / Delete any Gallery content | ✗ | ✗ | ✓ |
| Reorder Frames / Collections | ✗ | ✗ | ✓ |
| Change handle / delete Gallery | ✗ | ✗ | ✓ (via Settings only) |

RLS is the enforcement layer; UI hides affordances but never trusts the UI.

---

## 19. Loading Behaviour

- Route loaders fetch: identity + section index + the current section's first page. Nothing else.
- Skeletons match final layout silhouette (aspect ratios preserved) to prevent CLS.
- Streaming order: cover → identity → section body first row → remainder.
- No spinners anywhere in the Gallery. Skeletons only.
- Optimistic updates on owner writes; rollback with inline error on failure.

---

## 20. Open Questions (deferred, not blocking Loop 3)

These were challenged during refinement and consciously deferred. Loop 3 does **not** address them; a future spec amendment will.

1. **Print / export**: PDF export of a Frame or the whole Gallery — desirable, not v1.
2. **Custom domains**: `photographername.com` → Gallery. Requires DNS + cert work.
3. **Private Frames**: unlisted-link sharing without publish. Adds a third visibility state; deferred to keep the mental model binary (draft/published).
4. **Guestbook moderation queue**: pre-publish approval. Deferred; hide-after-post is sufficient for v1.
5. **Cross-Gallery Collections** (curated by non-owners): explicitly rejected for v1 — Collections belong to the Gallery owner.
6. **Notifications**: only the About email opt-in exists. No in-app notifications.

---

## 21. Amendment Process

To change any rule in this document:

1. Open a spec amendment note referencing the section number.
2. State the change, the reason, and the rules it invalidates.
3. Get explicit approval before any implementation loop consumes the change.

Silent drift between spec and implementation is a bug in the implementation, not the spec.

---

**Specification locked.** Ready for Loop 3 implementation planning on your approval.