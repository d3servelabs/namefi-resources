# Namefi Astra — Mobile Compatibility Plan

**Status:** Draft · planning
**Goal:** Make the namefi-astra webapp (`apps/frontend`) fully usable on mainstream
iOS and Android phones — a phone user should be able to *see* everything and
*do* most of what they'd do on desktop.
**Owner:** zzn
**Last updated:** 2026-06-17

---

## 0. TL;DR

- This is a **finish-and-audit** job, not a rewrite. The app already has the
  bones: a `MobileTable` card/table switcher, a `useIsMobile()` hook, a
  collapsible sidebar, correct viewport meta, and **Privy** auth (which handles
  much of the mobile login pain for free).
- Prioritize by **criticality × mobile demand**, not by feature importance
  alone. The biggest trap is polishing the logged-in dashboard while leaving the
  *front door* (shared claim/feed/profile links, opened on phones, logged-out)
  broken.
- The hard technical problem is **mobile wallet connect + transaction signing**
  (no browser extension on mobile → WalletConnect deep-links out to a wallet app
  and back). Privy abstracts a lot, but signing flows need real-device testing.

---

## 1. Data sources for prioritization

| Source | Status | Notes |
|--------|--------|-------|
| **Vercel Web Analytics** | ❌ No data | Enabled then disabled within ~2 min on 2025-08-13; canceled 2025-08-29. Speed Insights `hasData: false`. **Action: re-enable now** to start collecting device/route splits for the *next* iteration. |
| **Google Analytics (GA4)** | ✅ Connected | Service account `google-analytics-readonly@d3serve-labs.iam.gserviceaccount.com` (key at `~/.config/namefi/ga-readonly-key.json`). Property: **Namefi Astra Production = `properties/486742770`** (Dev = `485308476`). |

### 1a. GA findings (last 90 days, prod property)

**Device split — mobile is 1 in 3 sessions and bounces noticeably harder:**

| Device | Sessions | Share | Bounce | Engagement |
|--------|---------:|------:|-------:|-----------:|
| Desktop | 2266 | 66% | 39.2% | 60.8% |
| **Mobile** | **1145** | **33%** | **52.1%** | **47.9%** |
| Tablet | 10 | <1% | 50% | 50% |

→ Mobile bounce is **+13pp worse** than desktop with lower engagement. Real volume,
measurably worse experience. The effort is justified by data, not just intuition.

**Top mobile *entry* pages (the real front doors) and what they confirm:**

| Entry page | Mobile sessions (entry) | Bounce | Read |
|------------|------------------------:|-------:|------|
| `/` | 677 | 51% | Landing — biggest door |
| **`/registration-agreement`** | **163** | **🚨 84.7%** | **Urgent anomaly — see below** |
| `/feed` | 113 | 50% | ✅ Confirms inbound-social P1 hypothesis |
| `/payment-methods` | 34 | 53% | Money path is a deep-link return target on mobile |
| `/mls/feed` | 28 | 57% | Second feed surface |
| `/domains/<name>` (several) | 2–4 each | mostly low | ✅ Shared domain links opened on phones — inbound confirmed |
| `/owner/0x…`, `/cart`, `/my-domains`, `/profile` | low, but low bounce | — | Logged-in management does happen on mobile |

**🚨 Top finding — `/registration-agreement`:** it's the **#2 mobile entry page**
(163 sessions) with an **84.7% bounce**. People land here directly (it's linked
from somewhere in a critical flow) and 5 of 6 leave immediately. This is almost
certainly a broken/scary mobile rendering of a flow step. It was **not** in the
original tiering — it jumps to the front of the audit queue.

**Validated from the draft:** `/feed` is a confirmed top-3 mobile front door, and
individual `/domains/<name>` pages show up as mobile entry points — both confirm
the "shared links land on phones, logged-out" thesis that drives P1.

---

## 2. Framework — two axes, not one

The original idea ("P1 critical / P2 prefer-mobile / P3 desktop-with-fallback")
tangles two distinct axes. Separating them sharpens prioritization:

- **Axis A — Criticality:** if this breaks, does the business break?
- **Axis B — Mobile affinity:** how badly does the *user* want to do this on a phone?

Rank by **A × B**. A task can be business-critical but rarely done on a phone
(DNS editing), or business-trivial but almost always on a phone (tapping a
shared link).

### The insight that drives P1

Most mobile sessions arrive from **shared links** — a tweet, a Namefi feed link,
a "claim your domain" link — opened **on a phone, while logged out**. So the
inbound, social-facing surfaces are mobile-critical *even though* "domain
management" sounds like a desktop activity. **P1 = the first thing a phone-only
stranger touches, plus the money path.**

---

## 3. Draft tiering (to be validated against GA)

### P0 — bleeding now (GA-confirmed)

| Journey | Routes | Why |
|---------|--------|-----|
| **Registration agreement step** | `/registration-agreement` | #2 mobile entry, **84.7% bounce**. Investigate first in the audit. |

### P1 — must be flawless on a 375px phone (inbound + money + identity)

| Journey | Routes | Why P1 |
|---------|--------|--------|
| Auth: Privy email + **wallet connect** | (global) | Gate to everything; wallet connect is the hardest mobile flow |
| Domain detail (shared link target) | `/domains/[domain]` | GA: appears as mobile *entry* pages — shared links opened on phones |
| Domain **search → availability/price** | `/`, search | Top-of-funnel; first interaction |
| **Claim flow** | `/claim/[domain]` | Arrives as shared links, on phones, logged-out |
| **Cart → checkout → pay** | `/cart`, checkout | The money path. Stripe on mobile is a *strength* (Apple/Google Pay) |
| **My Domains** glance | `/domains` | "What do I own / is it expiring?" — already uses `MobileTable` |
| **Feed + public profile** | `/feed`, `/owner/[wallet]`, `/feed/users/...` | Pure inbound social traffic, ~always mobile |

### P2 — users will *prefer* the phone (glanceable, notification-driven)

| Journey | Routes |
|---------|--------|
| **Hunt voting** (up/down — perfect thumb interaction) | `/hunt`, `/hunt/mine`, `/hunt/domains/[id]` |
| Order status check | `/orders`, `/orders/[id]` |
| Renewal / auto-renew toggle | `/domains`, `/manage` |
| Wishlist add/view | `/wishlist` |
| Profile basics, newsletter | `/profile`, `/newsletter` |

### P3 — desktop-primary, but provide a mobile fallback (emergency use)

| Journey | Routes | Note |
|---------|--------|------|
| **DNS record editing** | `/manage` | Data-dense, but "site is down, fix the record from my phone" is real |
| Domain **transfer** | `/manage`, domain detail | Power task |
| **Studio** (AI two-pane editor) | `/studio`, `/studio/[id]` | Hardest to fit; needs stack/tab or bottom-sheet preview redesign |
| Payment-method management | `/payment-methods` | |

### Out of scope

- `/admin/*` (40+ internal pages), `/dev-tools`, `/dns-cache`, `/test-*`,
  `/powered-by-namefi/*`, `/site/[originKey]/*`, `/x402/*` — internal/operator only.

---

## 4. App-specific hard problems

1. **Mobile wallet connect + signing is the boss fight.** No browser extension on
   mobile; WalletConnect deep-links jump out to MetaMask/Rainbow and back.
   Privy abstracts connect, but **transaction signing** (renewal, transfer,
   DNSSEC) is where mobile flows silently die. Needs real-device testing.
2. **Data-dense tables.** Only My Domains uses `MobileTable` today. The pattern
   exists — apply it to orders detail, hunt lists, DNS records.
3. **Two-pane Studio editor.** Form + live preview side-by-side → must become a
   tab/stack or bottom-sheet preview on a phone. Genuine redesign (hence P3).
4. **Modals/dialogs assume width.** Convert action dialogs to **bottom sheets**
   on mobile.

### Current responsive assets (already in the codebase)

- `apps/frontend/src/components/ui/mobile-table.tsx` — card list <375px, table ≥768px
- `useIsMobile()` hook
- Collapsible `SidebarProvider` (`collapsible="icon"`)
- Viewport meta set in root `layout.tsx` (`width=device-width, initialScale=1`)
- Auth: **Privy** (`@privy-io/react-auth`) + **wagmi** (`@privy-io/wagmi`);
  config in `apps/frontend/src/lib/wagmi-config.ts`

---

## 5. Method (how we execute)

1. **Get GA data first.** Rank P1 by evidence: mobile share + top mobile routes +
   bounce on inbound pages.
2. **Pick a device matrix.** Design for the worst case — **375px width**
   (iPhone SE / small Android) + one large phone. Works at 375 → works everywhere.
3. **Audit on a real viewport, screen by screen.** Drive the app at 375px
   (dogfood / agent-browser) → screenshot-backed "what breaks" punch list per P1
   journey: horizontal scroll, tap targets <44px, off-screen buttons, unreadable
   tables.
4. **Fix in journey order, not page order.** Make a *whole* P1 chain work
   end-to-end (open shared claim link → connect wallet → pay) before moving on.
   A journey that's 90% mobile-ready is 0% usable.
5. **Verify on a real phone** for anything touching wallet signing.

### Baseline mobile checklist (per screen)

- [ ] No horizontal scroll at 375px
- [ ] All tap targets ≥ 44×44px
- [ ] Primary action reachable in the thumb zone (bottom half)
- [ ] Tables → cards (use `MobileTable`)
- [ ] Action dialogs → bottom sheets
- [ ] Forms: correct input types / keyboards; no zoom-on-focus (font ≥16px)
- [ ] Wallet connect + signing completes on a real device

---

## 6. Open questions / next steps

- [x] **GA pull** — done (see §1a): mobile 33%, +13pp worse bounce, `/registration-agreement` anomaly
- [ ] **Investigate `/registration-agreement` on a 375px phone first** (P0) (Claude)
- [ ] **Re-enable Vercel Web Analytics** to seed next-iteration data (zzn)
- [ ] **Validate / re-rank the draft tiering** against GA + product judgment (zzn)
- [ ] **Run the 375px audit** of P0+P1 journeys → screenshot punch list (Claude)

### Re-pulling GA (for future sessions)

Key: `~/.config/namefi/ga-readonly-key.json`. No `google-*` Python libs installed
→ helper at `/tmp/ga_helper.py` signs a JWT via `openssl` and calls the GA4 REST
Data API directly. Prod property `486742770`, Dev `485308476`.
