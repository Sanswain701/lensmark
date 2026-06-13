## Goal

Elevate LensMark to feel more premium and refined — without touching layout, navigation, terminology, tabs, screens, flows, or component structure. Pure aesthetic pass driven primarily by design tokens so the change propagates everywhere consistently.

## Scope

Touched files (visual only):
- `src/styles.css` — luxury palette, refined type scale, premium shadows, gradient + surface tokens, ease curve
- `src/components/ui/button.tsx` — refine default/outline styling (shadow, tracking, hover)
- `src/components/ui/card.tsx` — softer radius, layered shadow, softer border
- `src/components/progressive-image.tsx` — softer placeholder + longer eased fade
- `src/components/site-header.tsx` — refine header surface (no structure change)
- `src/routes/index.tsx` — hero typography spacing, photo card chrome (same layout)
- `src/routes/u.$username.tsx`, `src/routes/c.$id.tsx`, `src/routes/p.$id.tsx` — token-level polish only (chips, dividers, meta type, cover vignette)

Not touched: routes, route tree, navigation items, tabs, section names (Mosaic / Vaults / Creators / Imprint / Account), upload flow, trust system, data, server functions, schema, copy.

## 1. Color System

Replace tokens in `src/styles.css` with the requested palette, converted to `oklch`.

Light (Warm Ivory base):
- `--background` Warm Ivory `#F5F1EA`
- `--foreground` Rich Charcoal `#111214`
- `--card` `#FBF8F2` (slightly lifted ivory)
- `--muted` `#ECE6DA`
- `--muted-foreground` Muted Stone `#8C857C`
- `--primary` Rich Charcoal
- `--accent` Champagne Gold `#B89A5D` (used sparingly: chips, focus, hover accents)
- `--ring` Champagne Gold, lower chroma
- `--border` warm stone at ~12% opacity

Dark (Rich Charcoal base):
- `--background` `#111214`
- `--card` Soft Graphite `#1A1B1F`
- `--popover` `#1A1B1F`
- `--foreground` Warm Ivory `#F5F1EA`
- `--muted` `#1F2024`
- `--muted-foreground` Muted Stone `#8C857C`
- `--primary` Warm Ivory
- `--accent` Antique Brass `#8D734A` (deeper gold to avoid yellow brightness in dark)
- `--ring` Antique Brass
- `--border` ivory at ~9% opacity

Add gold-aware tokens (for small accents only, never large fills):
- `--gold` (Champagne light / Antique Brass dark)
- `--gold-foreground`
- `--gold-soft` (gold at ~14% alpha for subtle washes)

Registered in `@theme inline` so `bg-gold`, `text-gold`, `ring-gold`, `bg-gold-soft` are available.

## 2. Materials

Add to `:root` / `.dark`:
- `--shadow-elegant`: layered low-opacity shadow (`0 1px 0 …, 0 12px 32px -16px rgba(0,0,0,.18)`)
- `--shadow-soft`: `0 1px 2px rgba(0,0,0,.04), 0 8px 24px -12px rgba(0,0,0,.10)`
- `--gradient-surface`: very subtle top-to-bottom ivory/graphite gradient (hero + header)
- `--gradient-gold`: champagne → antique brass (hairline dividers, focus glow only)
- `--radius` raised from `0.5rem` to `0.75rem`

Used inline via `shadow-[var(--shadow-elegant)]` / `bg-[image:var(--gradient-surface)]`.

## 3. Typography

Keep Fraunces (display) + Inter (body). No font swap.
- Tighten display tracking to `-0.025em` at sizes ≥ `text-5xl`
- Body line-height bumped to `1.65`
- Add `@utility meta` — small-caps numerics + tracking for meta rows (handles, dates, counts)
- Add `@utility eyebrow` — centralizes the existing "uppercase tracking-widest text-xs muted" pattern
- Scale unchanged — only property-level refinement, no layout shifts

## 4. Components (visual only)

`button.tsx`:
- Default: add `shadow-[var(--shadow-soft)]`, `tracking-[0.01em]`, refined hover (brightness lift, same color)
- Outline: border becomes `border-foreground/15` hairline
- No new variants, no API change

`card.tsx`:
- `rounded-xl` → `rounded-2xl`
- Replace `shadow` with `shadow-[var(--shadow-elegant)]`
- Border `border-border/70`

`progressive-image.tsx`:
- Placeholder uses `bg-[image:var(--gradient-surface)]` instead of flat muted
- Fade extended to ~900ms with luxury ease

`site-header.tsx`:
- Background `bg-background/70` + `backdrop-blur-2xl`, hairline gold-tinted border-bottom — same height, same items

`index.tsx`:
- Hero chip uses `bg-gold-soft text-gold` (champagne wash, not yellow)
- Photo card border softened, hover lifts `shadow-elegant`, caption row uses `.meta`
- Empty state + skeleton use surface gradient
- No grid, columns, or copy changes

`u.$username.tsx` / `c.$id.tsx` / `p.$id.tsx`:
- Existing chips/badges use `.eyebrow` + `bg-gold-soft` where appropriate
- Cover image gets a subtle bottom vignette via gradient overlay (className only)
- Social icons: `text-muted-foreground hover:text-gold`

## 5. Photography

- Card chrome lightened so image edge dominates
- Hover scale `1.02` → `1.015` (more restrained)
- Caption row is a thin hairline strip — removes the "placeholder card" feel
- Progressive blur-in slightly longer and softer

## 6. Motion

Add to `src/styles.css`:
- `--ease-luxury: cubic-bezier(0.22, 1, 0.36, 1)`
- Standardize button/card/link transitions on `duration-300 ease-[var(--ease-luxury)]`
- No new animations, no entrance choreography

## Out of scope (explicitly)

- No new routes, screens, sections, or tabs
- No renames (Mosaic / Vaults / Creators / Imprint / Account stay)
- No layout, grid, or nav changes
- No new dependencies, components, or shadcn additions
- No data / RLS / server-function / schema changes
- No copy rewrites

## Verification

- Build passes (token + className changes only)
- Visual check on `/`, `/u/:username`, `/c/:id`, `/p/:id`, `/settings`, `/upload`, `/auth` in both themes — confirm no layout shift, only surface/typography/shadow refinement
- Confirm gold never appears as a large background fill — only hairlines, chips, focus rings, hover accents

Ready to switch to build mode and apply.
