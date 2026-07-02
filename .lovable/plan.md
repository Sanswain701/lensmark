## Phase 0 — LensMark Foundation Sprint

Strengthen the existing app without touching visual design, typography, spacing, colors, or feature surface.

---

### 1. Dead code & duplication

- **Fix `src/lib/photo-urls.ts`**: make `displayUrl(p, role)` return `thumb_url ?? medium_url ?? image_url` for `"thumb"`, `medium_url ?? image_url` for `"medium"`, and `image_url` for `"original"`. Implement `buildSrcSet` returning a real `thumb 400w, medium 2000w` string when available.
- **Extract `src/components/photo-card.tsx`** (single tile: image + optional caption/meta overlay used by feed/profile/collection).
- **Extract `src/components/photo-grid.tsx`** (masonry/grid wrapper reused by `/`, `/u/$username`, `/c/$id`).
- Update `src/routes/index.tsx`, `src/routes/u.$username.tsx`, `src/routes/c.$id.tsx` to consume the shared components and helper — visual output identical.

### 2. Upload stability (`src/lib/image-pipeline.ts`, `src/routes/_authenticated/upload.tsx`)

- Bounded decode: pass `resizeWidth`/`resizeHeight` to `createImageBitmap` capped at ~4096px longest edge before canvas work (saves 5–10× memory on low-RAM Android).
- Upload progress: switch storage upload to `XMLHttpRequest`-based signed upload (Supabase `createSignedUploadUrl` + `uploadToSignedUrl`) so we can wire `onprogress` and `AbortSignal`.
- Retry: exponential backoff (3 attempts) on network-class errors per part.
- Cancel: `AbortController` wired to a Cancel button that replaces the disabled state during upload.
- Duplicate-submit guard: ref-based `inFlight` + disable submit while a photo is in flight; also compute a quick content hash (file size + name + lastModified) and refuse re-submitting the same source in the same session.
- Preview UI: minimal progress bar under the dropzone (uses existing `Progress` primitive, no design change).

### 3. Routing robustness

- Add `defaultErrorComponent` + `defaultNotFoundComponent` to `getRouter` in `src/router.tsx`.
- Add `notFoundComponent` on `__root.tsx`.
- Add `errorComponent` + `notFoundComponent` to routes with loaders: `p.$id.tsx`, `u.$username.tsx`, `c.$id.tsx`, `index.tsx`. Each renders a small in-shell message using existing typography — no new visual language.

### 4. Authentication — Google Sign-In

- Call `supabase--configure_social_auth` with `providers: ["google"]` (keep email enabled).
- Add a "Continue with Google" button to `src/routes/auth.tsx` (sign-in and sign-up tabs) using existing `Button` + `social-icons`. Uses `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.
- Preserve email flow, onboarding, and username auto-provisioning (`handle_new_user` trigger already handles OAuth users).

### 5. Performance

- New `src/hooks/use-profile.ts` — `useQuery(['profile', userId])` for the current user's profile (username, avatar). Replace ad-hoc `.then()` in `site-header.tsx`.
- `<link rel="preconnect">` for the Supabase storage origin in `__root.tsx` head links.
- `PhotoCard`: `loading="lazy"`, `decoding="async"`, `sizes` attribute + real `srcset` from `buildSrcSet`. First feed row gets `fetchpriority="high"` and `loading="eager"`.
- `defaultPreloadStaleTime` already `0` — leave as-is; add `staleTime: 30_000` on the feed query to prevent thrash.

### 6. Accessibility

- Skip-to-content anchor in `__root.tsx` (`<a href="#main">`), `<main id="main">` in routes.
- `aria-current="page"` on active nav `Link`s in `site-header.tsx` (via `activeProps`).
- `aria-invalid` + `aria-describedby` on auth inputs when the field has an error.
- Focus-visible ring already tokenised — ensure `PhotoCard` link has visible focus ring.
- Icon-only buttons already have `aria-label`; audit and add where missing (theme toggle, avatar menu trigger).

### 7. Responsive — mobile-only bottom nav

- New `src/components/mobile-bottom-nav.tsx`: fixed bottom bar (`md:hidden`) with Discover / Upload / Profile. Uses existing tokens and icons; adds `pb-[env(safe-area-inset-bottom)]`.
- Add bottom padding to `<main>` on mobile only (`pb-20 md:pb-0`) so content isn't hidden. Desktop layout unchanged.

---

### Technical details

- Files created: `src/components/photo-card.tsx`, `src/components/photo-grid.tsx`, `src/components/mobile-bottom-nav.tsx`, `src/hooks/use-profile.ts`.
- Files modified: `src/lib/photo-urls.ts`, `src/lib/image-pipeline.ts`, `src/routes/_authenticated/upload.tsx`, `src/routes/index.tsx`, `src/routes/u.$username.tsx`, `src/routes/c.$id.tsx`, `src/routes/p.$id.tsx`, `src/routes/__root.tsx`, `src/routes/auth.tsx`, `src/router.tsx`, `src/components/site-header.tsx`.
- Backend: `supabase--configure_social_auth` for Google. No schema/migration changes.
- No changes to `image-pipeline` tonal processing (still resize + WebP encode only).
- No changes to design tokens, fonts, or colors.

### Verification (before handoff)

1. Self-review diff.
2. Build passes (auto).
3. Playwright smoke: `/`, `/auth`, `/p/$id`, `/u/$username`, upload flow with progress + cancel; 360×812 mobile viewport screenshot to confirm identical visuals + bottom nav.
4. Accessibility spot-check: skip link visible on Tab, `aria-current` on active nav, focus rings on grid tiles.
5. Report: files modified with rationale, perf/a11y wins, remaining debt, risks. Stop and wait for approval before Phase 1.
