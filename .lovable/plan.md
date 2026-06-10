
## Plan: LensMark PWA Conversion

The footer and theme requirements (#7, #8) are already done from the previous turn — I'll verify them and skip if matching. The bulk of this work is wiring up installability + offline support safely so it never breaks the Lovable preview.

### 1. PWA infrastructure (vite-plugin-pwa, controlled)

- Install `vite-plugin-pwa`.
- Configure in `vite.config.ts` with:
  - `registerType: "autoUpdate"`
  - `injectRegister: null` (we register manually from a guarded wrapper)
  - `devOptions: { enabled: false }`
  - `manifest`: name "LensMark", short_name "LensMark", theme_color `#ffffff`, background_color `#ffffff`, display `standalone`, orientation `portrait`, start_url `/`, scope `/`, icons (192, 512, 512 maskable, apple-touch).
  - `workbox`:
    - `navigateFallback: "/"` with `navigateFallbackDenylist: [/^\/~oauth/]`
    - HTML/navigations → `NetworkFirst`
    - Same-origin hashed JS/CSS → `CacheFirst`
    - Images (incl. Supabase storage origin) → `CacheFirst` with expiration (so viewed photos persist offline)
    - Document/profile route responses → `NetworkFirst` with short cache (homepage, /p/*, /u/*)

### 2. Guarded SW registration

Create `src/lib/register-sw.ts` that registers `/sw.js` only when ALL of:
- `import.meta.env.PROD`
- not inside iframe
- hostname is not a Lovable preview/dev/beta host
- URL has no `?sw=off`

In any refused context, unregister any existing `/sw.js`. Call this from `src/router.tsx` or `src/start.ts` client entry.

### 3. Icons & favicons

Generate brand assets with `imagegen` (LensMark camera mark, editorial monochrome on white):
- `public/icon-192.png` (192×512 — solid bg per manifest theme)
- `public/icon-512.png`
- `public/icon-512-maskable.png` (safe-zone padded)
- `public/apple-touch-icon.png` (180×180)
- `public/favicon.svg` + `public/favicon-32.png`

Wire all `<link rel="icon">`, `apple-touch-icon`, `manifest`, and `theme-color` meta in `src/routes/__root.tsx` head().

### 4. Install prompt

Add `src/components/install-prompt.tsx`:
- Listens for `beforeinstallprompt`, stashes the event, shows a subtle bottom-sheet "Install LensMark" pill (dismissable, remembers dismissal in localStorage).
- iOS Safari fallback: small one-time hint "Add to Home Screen via Share → Add to Home Screen" (only on iOS standalone-not-active).
- Mount in `__root.tsx`.

### 5. Offline screen

Add `public/offline.html` — editorial-styled "You're offline" page (warm ivory or light, LensMark wordmark, short copy). Configure Workbox to fall back to it for navigations when both network and cache miss.

### 6. Mobile experience polish

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` in root.
- `overscroll-behavior-y: none` on `html, body` in `src/styles.css` to disable pull-to-refresh.
- Photo viewer already supports pinch-zoom (Phase 1). Add **swipe left/right between photos** in `src/components/photo-viewer.tsx` by accepting `onPrev`/`onNext` props and wiring touch swipe + keyboard arrows. Update `src/routes/p.$id.tsx` and the feed to pass neighbors when available (single-photo route: no neighbors, swipe disabled).

### 7. Footer & theme (verify)

- Confirm `src/routes/index.tsx` footer already reads `LensMark · Made by @sanfrfr._` linking to Instagram in a new tab. (Done last turn — re-check only.)
- Confirm `theme-provider.tsx` defaults to light and ignores system. (Done last turn — re-check only.)

### 8. Deployment / build

- Ensure `vite-plugin-pwa` plays nicely with the TanStack Start Vite plugin (PWA plugin runs after, emits `sw.js` + `manifest.webmanifest` into the client build output).
- No `ssr.external` changes.
- Vercel compatibility: Lovable's TanStack Start template already produces a standard static + SSR output; PWA emits to the client public dir, which Vercel serves at the origin root. No special config needed.
- Build runs automatically; fix any TS errors that surface.

### Technical notes

- `vite-plugin-pwa` `generateSW` strategy — never hand-written SW.
- Cache Storage is origin-scoped, so image cache uses a named bucket with `maxEntries: 200, maxAgeSeconds: 30 days`.
- Supabase storage URLs are cross-origin → add their origin to `runtimeCaching` urlPattern.
- Preview safety: the registration wrapper guarantees no SW ever installs in `id-preview--*.lovable.app` / iframe, so the editor preview won't get stuck on cached HTML.
- Skip `og:image` until brand artwork lands (per head-meta guidance).

### Files

**New:** `src/lib/register-sw.ts`, `src/components/install-prompt.tsx`, `public/offline.html`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-512-maskable.png`, `public/apple-touch-icon.png`, `public/favicon.svg`.

**Edited:** `vite.config.ts`, `src/routes/__root.tsx`, `src/router.tsx` (or `src/start.ts` client side), `src/styles.css`, `src/components/photo-viewer.tsx`, `src/routes/p.$id.tsx`, `package.json`.

### Out of scope (call out)

- "Lighthouse PWA score above 95" — I'll set up everything required to pass (installable manifest, valid SW, offline fallback, themed colors, proper icons). I can't run Lighthouse from here; you'd verify after deploy.
- "Cache profile pages" — handled generically via NetworkFirst on navigations + image cache; per-page data caching beyond that would need TanStack Query persistence, which is a larger phase and not included unless you want it.
