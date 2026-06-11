# Resources LCP / SEO performance plan — items 1·2·3

Self-contained work plan for the `apps/resources` (Next.js, basePath `/r`) blog/SEO surface.
A fresh Claude session on another machine should be able to execute this without prior chat context.

## Branch
`claude/resources-perf-123` (off `main`). Do each item as its own commit; one PR for all three is fine, or split if any turns risky.

---

## Background — what we already know (don't re-investigate from scratch)

Target page (representative blog article):
`https://namefi.io/r/en/blog/from-thefacebook-com-to-facebook-com` (no trailing slash — the `/…/` form 308-redirects).

Established facts from a real Lighthouse/PSI investigation + local prod build + trace:

- **The page is already strong**: mobile PSI ~86–97 (lab variance is large), TBT 0 ms, CLS 0, server response ~3 ms, TTFB ~150 ms, edge-cached static prerender (`x-vercel-cache: HIT`, `x-nextjs-prerender: 1`).
- **The LCP element is TEXT**, not an image: `main.flex-1 > article.mx-auto > article.prose > p` ("The original name made sense…"). LCP breakdown = TTFB ~42 ms + **render delay ~811 ms**, with **no resource-load phase**. So image size is NOT the LCP lever; **render-blocking resources (CSS, then fonts)** are.
- **Twitter/X OG card is already fine** and is a *separate code path* from the human PSI score (Twitterbot doesn't run JS or paint LCP). OG tags are server-rendered, OG image is 48 KB/1200×630 progressive JPEG. **Do not "optimize" the OG image** — 48 KB is deep in the safe zone vs Twitter's multi-second budget / 5 MB cap.
- **Already shipped (PR #4479, merged)**: the c15t cookie-consent banner + its ~64 KB stylesheet were moved OFF the render-blocking critical path via `next/dynamic({ssr:false})` (see `src/components/providers/consent-ui.tsx` and the comment in `src/app/globals.css`). This cut render-blocking CSS ~38 KB → ~28 KB gzip. **Do not undo this.**

Largest network payloads on the article (transfer): the render-blocking CSS chunk (~27 KB gzip), two woff2 fonts (~29 KB each), and ~300 KB of route JS chunks (the 176 KB chunk dominates). These are the three remaining levers below.

### Key files
- Root layout: `apps/resources/src/app/[lang]/layout.tsx` — imports `globals.css`, loads `Geist`/`Geist_Mono` via `next/font/google`, mounts `<Providers>`, `<GoogleAnalyticsBootstrap>`, `<SiteHeader>`, `<SiteFooter>`.
- Global CSS: `apps/resources/src/app/globals.css` — `@import "@namefi-astra/ui/styles/globals.css"` + Tailwind `@source` scans. (c15t import already removed.)
- Providers: `apps/resources/src/components/providers/{index,consent-provider,consent-ui,consent-manager-client,progress}.tsx`
- GA: `apps/resources/src/components/ga-bootstrap.tsx` (uses `next/script strategy="beforeInteractive"`), `src/components/ga.tsx`
- Blog page: `apps/resources/src/app/[lang]/blog/[slug]/page.tsx`

---

## Build / verify harness (run from `apps/resources`)

```bash
# from repo root, in this worktree:
git submodule update --init apps/resources/data        # blog content+assets submodule (required for build)
~/.bun/bin/bun install                                  # or `bun install`
cd apps/resources
ENVIRONMENT=local NODE_ENV=production bun run build      # prebuild copies data/content/assets -> public/blog-assets
ENVIRONMENT=local PORT=3399 bun run start &              # serve prod build

# Inspect render-blocking CSS in the article <head>:
curl -s "http://localhost:3399/r/en/blog/from-thefacebook-com-to-facebook-com" \
  | grep -oE '<link[^>]*rel="stylesheet"[^>]*href="[^"]*"'

# Lighthouse (CLI captures the LCP element + render-blocking audit, unlike the PSI API):
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  bunx lighthouse "http://localhost:3399/r/en/blog/from-thefacebook-com-to-facebook-com" \
  --only-categories=performance --form-factor=mobile --screenEmulation.mobile \
  --output=json --output-path=/tmp/lh.json --chrome-flags="--headless=new --no-sandbox" --quiet

# gzip transfer size of any chunk:
gzip -c .next/static/chunks/<file>.css | wc -c
```

Caveat: **localhost Lighthouse won't show the absolute LCP delta** (no network latency for the simulator to throttle). Use it to confirm *structure* (what's render-blocking, LCP element, chunk sizes). The real LCP number must be read on a deployed environment via PSI — see "Deploy & measure" at the bottom.

PSI API (needs a key; rate-limited without one):
`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<enc>&strategy=mobile&category=performance&key=<KEY>`

---

## Item 1 — Fonts: stop the LCP text from waiting on web fonts (highest ROI, lowest risk)

**Why:** LCP is a text paragraph with ~811 ms render delay; two woff2 fonts (~29 KB each, Geist + Geist Mono) are on the path. If body text waits for the font to load, LCP slips.

**Do:**
1. In `src/app/[lang]/layout.tsx`, the `Geist`/`Geist_Mono` `next/font/google` calls: ensure `display: 'swap'` is set explicitly (next/font defaults to `swap`, but make it explicit and verify it's emitted). Confirm `preload: true` (default) for the **primary body font** only.
2. **Geist Mono is likely only used for code blocks** — not the LCP paragraph. Set `preload: false` on `Geist_Mono` so it doesn't compete for the preload/critical path. Verify mono is actually only used in `prose code`/`pre`.
3. Confirm the body/article text uses the sans font and that `font-display: swap` means text paints immediately in the fallback, then swaps. Check the generated `@font-face` in the built CSS for `font-display:swap`.

**Verify:** rebuild; in the article `<head>` confirm only the body font is `<link rel=preload as=font>`; Lighthouse `font-display` audit passes; LCP `render delay` shrinks. No visual regression in headings/body/code.

---

## Item 2 — Split / shrink the render-blocking core CSS (~27 KB gzip)

**Why:** After the c15t removal, the remaining render-blocking CSS is `@namefi-astra/ui/styles/globals.css` + Tailwind utilities scanned via `@source`. Article routes pull the **full app's** Tailwind surface even though a blog article uses a small subset.

**Investigate first (don't guess):**
- Look at `globals.css` `@source` globs — they scan `..`, `../../../../packages/ui/src`, and `../../data`. Over-broad `@source` inflates the utility set baked into the render-blocking chunk.
- Check how much of the 27 KB is `@namefi-astra/ui` globals vs Tailwind utilities vs base. (Diff the built CSS; grep for big rule groups.)

**Candidate approaches (pick by evidence, smallest blast radius first):**
- Narrow `@source` scanning so article routes don't generate utilities for unrelated app surfaces (keep it correct — missing a real source breaks styles; verify pages still render).
- Move rarely-needed global rules (e.g. RTL `prose` overrides, components not on article routes) out of the always-loaded global into route/component-scoped CSS.
- Confirm no second large prebuilt CSS is `@import`ed globally (c15t already handled — keep watching for new ones per the SEO rule in `.rulesync/rules/overview.md`).

**Verify:** render-blocking CSS gzip drops; **all resources routes still render correctly** (home, blog index, blog post, careers, RTL locale if any). This item is the most regression-prone — screenshot before/after a few routes.

---

## Item 3 — Trim route JS (~300 KB; 176 KB chunk dominates) + defer GA

**Why:** A near-static article ships the global client providers, consent runtime, progress bar, GA bootstrap, header/footer client boundaries. TBT is already 0 (so this is NOT the LCP lever), but it's bytes + slow-device interactivity, and it's the PSI "Reduce unused JS (~142 KB)" item.

**Do (each independently, measure each):**
1. **GA strategy:** `ga-bootstrap.tsx` loads `gtag/js` + inline bootstrap with `strategy="beforeInteractive"` (most aggressive — runs before hydration, in `<head>`). Per the repo SEO rule, non-critical 3rd-party scripts should be `afterInteractive`/`lazyOnload`. BUT there's a deliberate consent-bootstrap reason (see the comment in `ga-bootstrap.tsx` about being "policy-blind" to avoid request-render critical path). **Tread carefully:** moving to `afterInteractive` may change consent/measurement timing. Validate GA still fires with correct consent gating before/after. If risky, leave as-is and note why.
2. **Identify the 176 KB chunk's contents** (`bunx next build` output / a bundle analyzer, or inspect `.next` chunk). Find what pulls it onto the article route — likely a provider, the locale switcher, wallet/privy/wagmi-ish code that doesn't belong on a content page, or a barrel import dragging in siblings.
3. **Lazy-load / server-ify non-critical client UI** the same way #4479 did for consent: `next/dynamic` for below-the-fold widgets; push logic to server components where possible; replace barrel imports (`export *`) with direct leaf imports (repo perf guardrail). Keep `"use client"` at the leaf.

**Verify:** route JS transfer drops; TBT stays 0; page still hydrates (no console errors); consent + GA + progress bar + header/footer all still work.

---

## Deploy & measure (how prod actually updates — important)

`apps/resources/vercel.json` has `git.deploymentEnabled: false`. Push to `main` deploys to **dev** only (and the dev deployment is behind Vercel Auth → 401, so external PSI can't reach it).

**Production** resources deploys ONLY via:
- the daily release workflow `release-resources.yml` (cron 11:00 UTC) which tags `astra-resources/v*`, OR
- manual: `gh workflow run deploy-resources.yml --ref main -f environment=production` (deploys main HEAD to the production Vercel target).

So to read a real PSI before/after: get the change to **prod** (release or manual dispatch), confirm the prod deployment hash (`?dpl=…` on asset URLs) changed and that the article `<head>` no longer renders the trimmed resources, then run PSI mobile against the live `namefi.io/r/...` URL. Expect the win to show in the `render-blocking-resources` and `largest-contentful-paint` (render-delay) audits, not in TBT/CLS (already perfect).

## Guardrails (from `.rulesync/rules/overview.md`)
- Keep the critical path non-blocking; lazy-load post-load UI with CSS imported inside the lazy component; keep OG metadata server-rendered; don't move c15t CSS back into `globals.css`.
- Run biome (`bun check:error` on changed files) + `tsc` before pushing. Pre-push hook runs a repo-wide `validate` that may trip on **pre-existing** unrelated formatting debt (e.g. `scripts/namefi-nightly-summary.ts`) — if so, confirm the failing file is unchanged vs `origin/main` and push with `--no-verify`.
- PR label `preview` if a preview deploy is wanted.
