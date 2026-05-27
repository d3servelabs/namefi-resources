# Google SEO Audit & Fix Status (2026-05-20)

Living checklist of the Google Search Console (GSC) issues identified during
the May 21–26 SEO investigation sessions for `namefi.io`, the code-level
fixes applied, and live-deployment verification. Update the checkboxes
as items are completed or as Google's index catches up.

**Last verified live:** 2026-05-26 (deployment `dpl_EjYvRS4mo6dCAf8uQt6L5J383EQk`)

Legend: `[x]` shipped + verified live · `[~]` shipped in code, indexing lag
expected · `[ ]` open / not yet shipped · `[!]` regression or follow-up
needed.

---

## Shipped and verified live

- [x] **"Crawled – currently not indexed" (1,371 URLs)** on
  `/r/{locale}/{blog,glossary,partners,tld}/*` — English-only sitemap +
  canonical → English on locale variants.
  - Sitemap shrunk from ~2,900 to ~500 URLs (`apps/resources/src/lib/sitemap.ts`,
    PR #4207, commits `61038230`, `aba3a7b4`).
  - Live: `https://namefi.io/r/sitemap-pages.xml` = 107/107 URLs under
    `/r/en/*`.
  - Live: `https://namefi.io/r/zh/blog/what-are-tokenized-domains` carries
    `<link rel="canonical" href="https://namefi.io/r/en/blog/what-are-tokenized-domains">`.
  - [~] GSC bucket still draining — re-check 4–6 weeks after merge.

- [x] **Cross-subdomain crawl-budget waste** (~15K crawl requests against
  `astra.namefi.io`, `app.namefi.io`, `backend.astra.namefi.io`,
  `r.namefi.io`, `*.cv.*.namefi.io`, `*.today.*.namefi.io`,
  `*.poweredby.*.namefi.io`) — host allowlist (`namefi.io`, `namefi.dev`)
  with 308 to canonical for duplicate hosts and `X-Robots-Tag: noindex,nofollow`
  + `Disallow: /` everywhere else.
  - `packages/common/src/host-policy.ts` (new), middleware in
    `apps/frontend`, `apps/resources`, `apps/park`, Hono in `apps/backend`
    (commit `90da856c` + follow-ups `25405c5a`, `a62b0751`, `c0f773d2`,
    `327f1891`).
  - Live: `astra.namefi.io/` → 308 → `namefi.io/`.
  - Live: `www.namefi.io/` → 308 → `namefi.io/`.
  - Live: `r.namefi.io/robots.txt` → `User-Agent: *\nDisallow: /`.
  - Live: `backend.astra.namefi.io` → `x-robots-tag: noindex, nofollow`.
  - Live: `api.namefi.io/robots.txt` → `Disallow: /` + header.

- [x] **Missing Google sitelinks / wrong targets** (Flush DNS, Domain Hunt,
  Newsletter being auto-picked) — retargeted sitemap priorities + new
  `/gallery` page (commit `45efb212`, PR #4241).
  - Live: `/sitemap/sitemap.xml` carries `/gallery 0.9`, `/manage 0.9`,
    `/customer-support 0.85`, `/newsletter 0.8`, `/tlds 0.8`; `/hunt`
    dropped from the static list.
  - Live: `https://namefi.io/gallery` returns 200.

- [x] **Sitemap-index-of-sitemap-indexes** (spec violation Google does not
  support) — flatten root index (commit `ef01a148`).
  - Live: `https://namefi.io/sitemap.xml` references 3 leaf urlsets directly
    (`/sitemap/sitemap.xml`, `/r/sitemap-pages.xml`, `/r/sitemap-videos.xml`).

- [x] **Low-value pages in sitemap** (`/abuse`, `/registration-agreement`,
  `/tos`) — pruned from `PUBLIC_STATIC_ROUTES` in
  `apps/frontend/src/lib/sitemap.ts` (commit `ef01a148`).
  - Live: absent from `/sitemap/sitemap.xml`.

- [x] **Thin Organization JSON-LD** — enriched with `legalName`, `founder`,
  `knowsAbout`, `sameAs` (+ Wikidata Q139894560 + Crunchbase + Medium),
  12-entry `funder` array, 2 new FAQ entries (ICANN accreditation +
  supported blockchains) (commit `327f1891`).
  - Live: `<script type="application/ld+json">` on `/` contains all fields;
    `FAQPage` has 9 questions.

- [x] **Tagline / footer / hero copy out of sync** — new tagline
  "ICANN Accredited Registrar tokenizing internet domain names for trading,
  DeFi and future of Internet" applied to meta, OG, Twitter card, JSON-LD,
  FAQ, hero badge, both footers (commits `bb117a5a`, `d5315350`).
  - Live: `<meta name="description">` matches.

- [x] **Homepage sitemap freshness** — `lastModified = new Date()` on `/`
  only + `revalidate = 86400` (commit `b9a02384`).
  - Live: `/sitemap/sitemap.xml` `<lastmod>` for `/` shows today's date
    (refreshed daily).

- [x] **Blog OG images 404 / static-asset-not-bundled** — moved assets to
  `apps/resources/public/blog-assets/`, switched `og:image` URL and in-body
  `<img>` to `/r/blog-assets/<slug>-og.<ext>`, dropped the dead
  `opengraph-image.tsx` static-fallback branch (PRs #4218/#4219/#4224).
  - Live: `og:image: https://namefi.io/r/blog-assets/what-are-tokenized-domains-og.png`
    (200, preload link present in HTML head).

- [x] **No Video / Watch collection for Google Video tab** — new
  `/r/{lang}/watch` collection sourced from YouTube playlists, dedicated
  `/r/sitemap-videos.xml` with `<video:video>` schema, per-page
  `VideoObject` + `Clip` JSON-LD (commit `48843535`).
  - Live: `/r/sitemap-videos.xml` returns the video urlset; first entry is
    the Namefi Song with full VideoObject + thumbnail + description.

- [x] **`llms.txt` outdated** (EIP-712 references) — rewritten for API-key
  DNS workflows with curl recipes for AI agents (`apps/backend/src/routers/llms-txt.ts`).
  - Live: `https://api.namefi.io/llms.txt` ships curl examples for
    `/v-next/dns/records` with `x-api-key`.

- [x] **AI bot indexing implicit** — explicit `Allow` for `GPTBot`,
  `ClaudeBot`, `Google-Extended`, `PerplexityBot`, `CCBot` on indexable
  hosts so GEO indexability is reviewable rather than implicit via `*`
  (commit `327f1891`).
  - Live: `https://namefi.io/robots.txt` enumerates each user-agent.

- [x] **Non-English locale duplication** ("Page with redirect" 64,
  "Duplicate, Google chose different canonical" 53, "Duplicate, no user
  canonical" 25) — every non-English page declares its English equivalent
  as `canonical` (commit `aba3a7b4`).
  - Live spot-checks: `/r/zh`, `/r/zh/blog`, `/r/zh/blog/what-are-tokenized-domains`
    all canonical to `/r/en/...`.

- [x] **Hash-driven homepage nav races** (`#import`, `#newsletter`) —
  `useSearchModeFromHash` re-runs on `hashchange` and `useScrollToHash`
  retries via `MutationObserver` after hydration (commits `3ef5b100`,
  `cfebcf4b`).

- [x] **Untrusted-only `rel="noreferrer"`** — first-party + standards-body
  external links no longer suppress the Referer header (commit `5cebe804`).

- [x] **Sitemap priority hierarchy expressed** (Bing/Yandex still honor
  `priority`) — blog detail `0.6 → 0.8`, TLD detail `0.6 → 0.2` (commit
  `ea58df2d`).

- [x] **Glossary + partner detail pages out of sitemap** — kept index
  pages only; details remain discoverable via internal links (commit
  `75d05a90`).

---

## Identified but NOT yet fixed in production

- [ ] **`r.namefi.io/{legacy-path}` returns 404** (~160 GSC "Not found"
  pages) — the 308 redirect attempted in `c5144634` was reverted in
  `d673e82c` because Vercel's `modifyConfig` crashed on
  `:path*` + `basePath: '/r'`. Plan was a **Vercel Dashboard Domain
  Redirect** at the platform layer.
  - Live: `https://r.namefi.io/en/blog/what-are-tokenized-domains` → 404
    (no `Location` header).
  - **Action:** configure the redirect in Vercel's Domain settings
    (`r.namefi.io` → `https://namefi.io/r`).

- [ ] **`/newsletter` returns 200 with full homepage HTML instead of a
  308 redirect** — `permanentRedirect('/#newsletter')` in
  `apps/frontend/src/app/newsletter/page.tsx` doesn't issue a 308 because
  URL fragments aren't preserved in `Location` headers; Next.js renders
  the destination inline. The response carries **no
  `<link rel="canonical">`**, so Google will see `/newsletter` and `/` as
  duplicates with no consolidation signal.
  - Live: `GET /newsletter` → HTTP 200, `x-matched-path: /newsletter`,
    `<title>Tokenized domains for the future internet - Namefi</title>`,
    no canonical.
  - **Action:** either issue a true 308 to `/` (drop the fragment
    server-side and let `useSearchModeFromHash` handle the in-app deep
    link) or render a thin `/newsletter` page with
    `canonical=https://namefi.io/`.

- [ ] **`/hunt/campaigns/cta-2025-07-16` still in sitemap** — only
  `cv-2025-07-16` is in `SITEMAP_EXCLUDED_CAMPAIGN_KEYS`
  (`apps/frontend/src/lib/sitemap.ts`). If the `cta-` campaign is equally
  expired, it needs the same treatment.
  - Live: `/sitemap/sitemap.xml` still emits the entry.
  - **Action:** add `cta-2025-07-16` to `SITEMAP_EXCLUDED_CAMPAIGN_KEYS`,
    or drop from `HUNT_CAMPAIGN_KEYS` in
    `apps/frontend/src/lib/env/configs/production.ts`.

---

## Merged in branch but NOT merged to main

- [ ] **`Disallow: /dashboard` and `Disallow: /my-domains`** — commit
  `5be7475a` sits on branch `seo/analysis-followup-from-crawled-not-indexed`
  in **open PR #4215**. Until merged, GSC will continue to report these
  auth-gated shells in "Crawled – currently not indexed".
  - Live: `https://namefi.io/robots.txt` carries no `Disallow` rules.
  - **Action:** review and merge PR #4215.

---

## Couldn't verify

- [ ] **`app.namefi.io` redirect + headers** — TLS connection reset during
  audit (`SSL_ERROR_SYSCALL`, including with `-k` bypass), so the 308 →
  `namefi.io` redirect and `X-Robots-Tag` header could not be confirmed
  end-to-end. DNS resolves to Vercel anycast IPs normally; may be a
  transient client/network issue or a host-specific deployment problem.
  - **Action:** re-verify from a different network or via
    `vercel inspect`.

---

## Deferred / out of scope (intentional)

- [ ] **`r.namefi.io` → `namefi.io` 301 (full subdomain decommission)** —
  structurally risky (would loop the frontend's internal `/r/*` proxy
  fetch). Robots `Disallow` + canonical from PR #4207 captures ~80% of the
  SEO benefit without the loop risk. Revisit only if existing indexed
  `r.namefi.io` URLs persist in "Indexed, blocked by robots" 6+ months out.

- [ ] **Decommission `r.namefi.io` to a non-`namefi.io` apex** — not viable
  per platform trust requirements (other subdomains like `md.namefi.io`,
  `api.namefi.io` must stay on the same apex).

- [ ] **Substack content silo (`blog.namefi.io`, ~400 crawl requests)** —
  proposed: bulk export → MD conversion → import into
  `apps/resources/data/content/blog` with identical slugs + add "moved to
  namefi.io/r/..." banner on Substack posts (Substack can't 301). Not
  scheduled.

---

## Tracking issues

- Umbrella: SEO/GEO audit of `/` — issue #4223.
- "Crawled – not indexed" GSC follow-ups — PR #4215 (open).
- Sitelinks retargeting + `/gallery` — PR #4241 (merged).
- English-only sitemap — PR #4207 (merged).
- Sitemap flatten + prune — PR #4240 (merged).
- Blog OG images — PRs #4218 / #4219 / #4224 (merged).

---

## Re-verification recipe

To re-run the live checks captured above:

    # Robots
    curl -s https://namefi.io/robots.txt
    curl -sI https://www.namefi.io/        # expect 308 → namefi.io
    curl -sI https://astra.namefi.io/      # expect 308 → namefi.io
    curl -s https://r.namefi.io/robots.txt # expect Disallow: /
    curl -sI https://backend.astra.namefi.io/ | grep x-robots-tag
    curl -sI https://api.namefi.io/        | grep x-robots-tag

    # Sitemap (flat index + English-only resources)
    curl -s https://namefi.io/sitemap.xml
    curl -s https://namefi.io/r/sitemap-pages.xml \
      | grep -oE '<loc>https://namefi.io/r/[a-z]+' | sort -u
    curl -s https://namefi.io/r/sitemap-videos.xml | head -c 1000

    # Canonical consolidation
    curl -s https://namefi.io/r/zh/blog/what-are-tokenized-domains \
      | grep -oE '<link rel="canonical"[^>]+>'

    # Open regressions
    curl -sI https://r.namefi.io/en/blog/what-are-tokenized-domains  # 404 today
    curl -sI https://namefi.io/newsletter                            # 200 today (want 308)
    curl -s  https://namefi.io/sitemap/sitemap.xml | grep cta-2025   # still present today
