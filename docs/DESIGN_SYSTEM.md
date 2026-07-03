# LensMark Design System — Loop 1

> Locked reference. Every new feature (Gallery, Frames, Daily, Stuff, Journal,
> Search, etc.) must consume these tokens and components without modification.
> If a screen needs something new, add it to the system first, then use it.

## 1. Tokens

All tokens are declared in `src/styles.css`. Consume them via Tailwind classes
or CSS variables — never hard-code hex, rgb, or px sizes.

### 1.1 Colors (oklch, semantic)

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `background` | Warm Ivory `#F5F1EA` | Rich Charcoal `#111214` | Page canvas |
| `foreground` | Rich Charcoal | Warm Ivory | Body copy |
| `card` | `#FBF8F2` | `#1A1B1F` | Elevated surfaces |
| `muted` / `muted-foreground` | — | — | Subdued blocks + secondary text |
| `primary` | Rich Charcoal | Warm Ivory | Primary buttons, brand ink |
| `border` | 8–9% ink | 9% ivory | Hairlines |
| `gold` | Champagne `#B89A5D` | Antique Brass | Accents ONLY |
| `gold-soft` | 14–16% gold | 16% gold | Chips, hover washes |
| `destructive` | — | — | Errors, destructive actions |

**Gold rules:** gold is reserved for eyebrows, brand chip, single accent
glyphs, and hover reveals. Never fill large surfaces or body copy with gold.

### 1.2 Gradients & Shadows

- `--gradient-surface` — subtle vertical wash for empty states / placeholders.
- `--gradient-gold` — hairline accents (`@utility hairline-gold`).
- `--shadow-soft` — resting elevation (cards, stats).
- `--shadow-elegant` — hover elevation (photo tiles, feature cards).

### 1.3 Radius

`--radius: 0.75rem` is the base; Tailwind exposes `rounded-sm|md|lg|xl|2xl|3xl|4xl`
off of it. Rules: inputs/buttons `rounded-md`, cards `rounded-xl`, hero panels
`rounded-2xl`, pills `rounded-full`.

### 1.4 Typography

- Display: **Fraunces** (`font-display`). Tight tracking, ligatures on.
- Body: **Inter** (`font-sans`). `line-height: 1.65`, features `cv11 ss01`.

Scale (use `<Display size="…">`):

| Size | Tailwind | When |
| --- | --- | --- |
| `hero` | `text-5xl md:text-7xl` | Home hero only |
| `xl` | `text-5xl md:text-6xl` | Collection title, profile name |
| `lg` | `text-4xl` | Route H1 (auth, upload, settings) |
| `md` | `text-3xl` | Section H2 |
| `sm` | `text-2xl` | Card/empty-state title |
| `xs` | `text-xl` | Compact title |

Utilities: `.eyebrow` (uppercase micro-label, 0.6875rem, 0.22em tracking),
`.meta` (tabular numerals + subtle tracking for timestamps, handles, EXIF).

### 1.5 Spacing & Layout

- Page horizontal padding: `px-5` mobile, `px-6` ≥md.
- Page vertical rhythm: sections `py-16 md:py-24` for hero; `pt-14` after a
  divider; `mb-5` between section header and grid.
- Content max-widths: `max-w-6xl` feed, `max-w-3xl` profile, `max-w-md` status.
- Grid gutters: `gap-3` tight tiles, `gap-6` masonry, `gap-8` cards.
- Mobile safe-bottom: pages that render `MobileBottomNav` MUST add
  `pb-28 md:pb-24` to their `main`.

### 1.6 Motion

- Easing: `--ease-luxury` (defined in tokens) for image hovers and reveals.
- Durations: `150ms` micro (buttons), `300ms` UI transitions, `500ms` elevation,
  `900ms` image scale.
- Never animate layout on hover. Only opacity, transform, shadow, color.
- Respect `prefers-reduced-motion`; all keyframe animations must be optional.

### 1.7 Focus & Hover

- Focus: default shadcn ring (`--ring`, 2px offset on `--background`). Never
  remove outlines.
- Hover on links: `hover:text-foreground` on muted links; underline via
  `underline-offset-4 hover:underline`.
- Hover on tiles: `shadow-[var(--shadow-elegant)]` + `scale-[1.025]`.

---

## 2. Components

All primitives live under `src/components/ui/`. Composed patterns live under
`src/components/`.

### 2.1 Primitives (shadcn-based)

`button`, `input`, `textarea`, `label`, `select`, `dialog`, `drawer`, `sheet`,
`alert-dialog`, `progress`, `slider`, `sonner` (toasts), `skeleton`.

**Button variants** (locked): `default | outline | ghost | secondary | destructive | link`.
Sizes: `default | sm | lg | icon`. Always use `asChild` to wrap `<Link>`.

### 2.2 Typography (`ui/typography.tsx`)

`Display`, `Eyebrow`, `Meta`, `Muted`. Prefer these over ad-hoc
`font-display text-…` combinations.

### 2.3 Section header (`ui/section-header.tsx`)

`<SectionHeader eyebrow title aside size />` — one canonical section title
layout used by feed, profile, collection.

### 2.4 Empty state (`ui/empty-state.tsx`)

`<EmptyState variant="panel|quiet" icon title description action />`

- `panel`: dashed border + surface gradient + soft shadow. Primary empties.
- `quiet`: dashed border only. In-section empties.

### 2.5 Status view (`ui/status-view.tsx`)

`<StatusView title description action />` — every route's `errorComponent`
and `notFoundComponent` MUST use this. Ships with `<BackHomeLink />` and
`<RetryButton onClick />`.

### 2.6 Stat (`ui/stat.tsx`)

`<Stat icon label value />` — compact metric card. Used in profile header.

### 2.7 Skeleton (`ui/skeleton.tsx`)

`<Skeleton />`, `<SkeletonLine />`, `<SkeletonBlock />`. Use pulse only,
never shimmer.

### 2.8 Composed

- `PhotoCard`, `PhotoGrid` — feed/masonry tiles.
- `PhotoViewer` — fullscreen viewer (swipe, arrows, pinch).
- `ProgressiveImage` — blur-to-sharp loading (no filters on final).
- `SiteHeader`, `MobileBottomNav` — global navigation.
- `ImageCropper`, `AddToCollectionDialog`, `SourceSelect` — flows.
- `InstallPrompt` — PWA install nudge.
- `SocialIcons` — profile socials.

---

## 3. Responsive Rules

- Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280` (Tailwind defaults).
- Mobile-first: write base classes for phone, upgrade at `md:` / `lg:`.
- Grid: 2 columns mobile, 3 columns `md`, masonry for feed (`columns-1 sm:columns-2 lg:columns-3`).
- Bottom nav is mobile-only (`md:hidden`). Header collapses at `md`.

## 4. Accessibility Rules

- Every route must render one `<main id="main">` landmark; skip-link targets it.
- Interactive elements need discernible text. Icon-only buttons require
  `aria-label` (see `SiteHeader` theme toggle).
- Contrast: gold on ivory is decorative-only. Body text uses `foreground` /
  `muted-foreground` which meet AA at all documented sizes.
- Focus never removed. Rings are visible on ivory and charcoal.
- All images have `alt` (empty string for decorative).
- Motion respects `prefers-reduced-motion` (Tailwind `motion-safe:`).
- Forms: every `<input>` has a `<label>`, `name`, and `autocomplete` where
  meaningful.

## 5. Component Rules

1. Do not import from `@/routes/*` inside `@/components/*`.
2. Do not duplicate a pattern used on more than one screen — promote it to
   `src/components/ui/`.
3. Never hard-code color, font-family, radius, or shadow. Use tokens.
4. Never use `text-white` / `text-black`. Use `foreground` / `background`.
5. Prefer `<Button asChild><Link>…</Link></Button>` over hand-rolled anchors
   that mimic buttons.
6. Route status/error UI must go through `<StatusView>`.
7. Route empty state UI must go through `<EmptyState>`.

---

## 6. Loop 1 — Change log

### Components created

- `ui/typography.tsx` — `Display`, `Eyebrow`, `Meta`, `Muted`.
- `ui/section-header.tsx` — `SectionHeader`.
- `ui/empty-state.tsx` — `EmptyState` (panel + quiet).
- `ui/status-view.tsx` — `StatusView`, `BackHomeLink`, `RetryButton`.
- `ui/stat.tsx` — `Stat`.
- `ui/skeleton.tsx` — `Skeleton`, `SkeletonLine`, `SkeletonBlock`.

### Components refactored

- `routes/index.tsx` — feed section uses `SectionHeader`; empty state uses
  `EmptyState` + `Button asChild`.
- `routes/p.$id.tsx` — `errorComponent` + `notFoundComponent` → `StatusView`.
- `routes/c.$id.tsx` — `errorComponent` + `notFoundComponent` → `StatusView`;
  in-collection empty → `EmptyState variant="quiet"`.
- `routes/u.$username.tsx` — error view → `StatusView`; empty archive →
  `EmptyState`; inline `Stat` promoted to `ui/stat`; ad-hoc
  `font-display text-…` replaced with `Display` / `Eyebrow` / `Meta`.

### Remaining technical debt (for Loop 2)

- `routes/auth.tsx`, `routes/_authenticated/upload.tsx`,
  `routes/_authenticated/settings.tsx`, `routes/reset-password.tsx` still use
  ad-hoc `font-display text-4xl` for page H1. Should adopt `<Display size="lg" as="h1">`.
- `routes/p.$id.tsx` metadata block still hard-codes `font-display text-base`
  for EXIF values; could accept a smaller `Display` size or a dedicated
  `<DataPoint>` primitive.
- `SourceSelect` has its own `font-display text-4xl` heading; safe to migrate
  when we touch that sheet next.
- `PhotoViewer` shell styles are bespoke; consider a `ViewerChrome` primitive
  when the immersive viewer gets its Loop 2 pass.
- No visual regression tests yet — recommend Playwright snapshots as part of
  Loop 2 QA.