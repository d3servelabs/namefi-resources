<!-- GENERATED FILE — do not edit by hand.
     Source of truth: packages/cuj/src/registry.ts
     Regenerate: bun --cwd packages/cuj gen:doc -->

# Namefi Astra — Critical User Journeys (CUJ)

Canonical catalog of the product's critical user journeys. Each journey has a
stable, hierarchical id (`CUJ-<Area>.<n>`) used as the join key across this doc,
e2e test tags, `data-cuj` markers, and the preview-recording generator.

**Inventory:** 🟢 live 28 · 🟡 partial 4 · 📝 draft 11 · ⚠️ deprecated 3 (total 46)

`Owner` is a shared journey library (the mechanics every owner performs), not a
persona. The Trader, Collector and DAO personas all reference it, so shared
journeys are defined exactly once. Ids are append-only: retired journeys are
marked deprecated, never deleted or renumbered.

## Personas

| Persona | Motivation | Journeys |
| --- | --- | --- |
| Domain Trader | Profit-driven — ruthlessly aims for return, flips for ROI. | `Owner.*` + `Trader.*` |
| Domain Collector | Emotion-driven — collects for association, curates and holds. | `Owner.*` + `Collector.*` |
| DAO / Org Controller | Wants shared, multi-sig control of a domain across an org/DAO. | `Owner.*` + `DAO.*` |
| Powered-by-Namefi Partner | White-label parent-domain owner issuing subdomains. | `PBN.*` |
| Developer / Integrator | Programmatic access to Namefi capabilities. | `Dev.*` |
| Visitor | Top-of-funnel / SEO — not yet a customer. | `Visitor.*` |
| Admin / Operator | Internal operations and support. | `Admin.*` |
| ~~Domain Hunter~~ (deprecated) | Community discovery / upvoting — being retired (unused). | `Hunter.*` |

## Journeys by area

### Owner Core — shared journey library (not a persona)

| ID | Journey | Status | Routes | Routers / API | Workflow | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `CUJ-Owner.1` | Search → see availability/pricing/suggestions → add to cart | 🟢 live | `/` | `search`, `registry` | — | — |
| `CUJ-Owner.2` | Checkout & pay (Stripe/NFSC) → register → NFT mint → confirmation | 🟢 live | `/cart`, `/orders` | `carts`, `payments`, `orders` | `processOrderWorkflow` | — |
| `CUJ-Owner.3` | Instant-buy a single domain (skip cart) | 🟢 live | `/` | `orders` | `processOrderWorkflow` | orders.instantBuy |
| `CUJ-Owner.4` | Claim a free domain via a campaign | 🟢 live | `/free-mints`, `/claim` | `freeClaims`, `search` | — | — |
| `CUJ-Owner.5` | Connect wallet / sign in (Privy) — first-time onboarding | 🟢 live | `/` | `auth`, `users` | — | — |
| `CUJ-Owner.6` | View My Domains with expiration status | 🟢 live | `/my-domains`, `/manage` | `users`, `domainConfig` | — | — |
| `CUJ-Owner.7` | Manage DNS records (records, forwarding, nameservers, DNSSEC) | 🟢 live | `/manage` | `dnsRecords`, `domainConfig` | — | — |
| `CUJ-Owner.8` | Park a domain | 🟢 live | `/manage` | `dnsRecords` | — | dnsRecords.parkDomain |
| `CUJ-Owner.9` | Renew / set up auto-renewal | 🟢 live | `/manage`, `/orders` | `domainConfig`, `orders` | `autoRenewWorkflow` | — |
| `CUJ-Owner.10` | Export / transfer a domain out (auth code, export approval) | 🟢 live | `/manage` | `domainConfig` | — | — |
| `CUJ-Owner.11` | Generate AI branding (logo / poster) for an owned domain | 🟢 live | `/studio`, `/gallery` | `ai` | — | — |
| `CUJ-Owner.12` | Get NFSC tokens from the faucet | 🟢 live | `/faucet` | `users` | — | — |
| `CUJ-Owner.13` | Import one or many domains owned elsewhere (transfer-in via EPP auth code → NFT mint) | 🟢 live | `/` | `search`, `carts` | — | Inverse of CUJ-Owner.10. Search Import mode (SearchMode.IMPORT tab) → enter per-domain EPP auth codes → add a single domain or bulk "Add all" to cart, then checkout via CUJ-Owner.2; the acquire-domain IMPORT path (sld/epp-register-or-import workflows) mints the NFT. Admin EPP transfer-in lives at /admin/epp-testing. |

### Domain Trader — signature journeys (profit-driven)

| ID | Journey | Status | Routes | Routers / API | Workflow | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `CUJ-Trader.1` | Appraise / value a domain or portfolio with comps | 📝 draft | — | — | — | — |
| `CUJ-Trader.2` | Track ROI / P&L across the portfolio | 📝 draft | — | — | — | — |
| `CUJ-Trader.3` | List a domain for sale / set a buy-now price | 🟡 partial | — | — | — | Aligns with the parking-as-sales-channel plan (OpenSea buy-now). |
| `CUJ-Trader.4` | Receive & accept/counter Namefi-brokered offers | 📝 draft | — | — | — | Buyer-restricted private Seaport listing settlement. |
| `CUJ-Trader.5` | Park-to-sell: turn a parked page into a sales channel | 🟡 partial | `/manage` | — | — | Parking is live; sales framing is in progress. |
| `CUJ-Trader.6` | Monitor / bulk-acquire cheap-domain opportunities | 📝 draft | — | — | — | — |

### Domain Collector — signature journeys (emotion-driven)

| ID | Journey | Status | Routes | Routers / API | Workflow | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `CUJ-Collector.1` | Organize domains into themed collections / sentimental tags | 📝 draft | — | — | — | Wishlist (wishlist router) is a live building block. |
| `CUJ-Collector.2` | Build & share a public showcase / gallery | 🟡 partial | `/gallery` | `ai` | — | — |
| `CUJ-Collector.3` | Aggregate domains across multiple wallets into one view | 📝 draft | — | `registry`, `users` | — | registry.getDomainsByOwner is a building block. |

### DAO / Org Controller — signature journeys (multi-sig)

| ID | Journey | Status | Routes | Routers / API | Workflow | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `CUJ-DAO.1` | Place a domain under multi-sig control (assign signers + threshold) | 📝 draft | — | — | — | Realistically a Safe holds the Namefi NFT; backend must recognize it. |
| `CUJ-DAO.2` | Propose a domain action → collect signatures → execute | 📝 draft | — | — | — | DNS change / transfer / renewal gated behind multi-sig approval. |
| `CUJ-DAO.3` | Role-based team access (who can edit DNS vs transfer vs pay) | 📝 draft | — | — | — | — |
| `CUJ-DAO.4` | Org / treasury-funded renewals & billing | 📝 draft | — | — | — | — |
| `CUJ-DAO.5` | Governance audit trail of domain actions | 🟡 partial | — | `bigQueryAudit` | — | — |
| `CUJ-DAO.6` | Rotate / recover signers | 📝 draft | — | — | — | — |

### Powered-by-Namefi Partner

| ID | Journey | Status | Routes | Routers / API | Workflow | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `CUJ-PBN.1` | Onboard a parent domain + run a white-label storefront | 🟢 live | `/powered-by-namefi`, `/owner` | `poweredByNamefiOwner` | — | — |
| `CUJ-PBN.2` | Issue / reserve subdomains to recipients (bulk + email) | 🟢 live | — | `pbnIssuanceReservations` | — | — |
| `CUJ-PBN.3` | Configure reserved words / restrictions for the namespace | 🟢 live | — | `poweredByNamefiOwner` | — | — |
| `CUJ-PBN.4` | View analytics dashboard + revenue by domain | 🟢 live | `/owner` | `poweredByNamefiOwner` | — | — |

### Developer / Integrator

| ID | Journey | Status | Routes | Routers / API | Workflow | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `CUJ-Dev.1` | Create & manage API keys (EIP-712 signed) | 🟢 live | `/profile` | `apiKeys` | — | — |
| `CUJ-Dev.2` | Call the public OpenAPI/REST API (availability/search/orders/DNS) | 🟢 live | — | — | — | Base path /v-next/; OpenAPI doc at /v-next/openapi/doc. |
| `CUJ-Dev.3` | Pay-per-call via the x402 paywall | 🟢 live | `/x402` | — | — | — |
| `CUJ-Dev.4` | Consume the ns-json nameserver API | 🟢 live | — | — | — | apps/ns-json; backend route /v1/ns-json. |

### Visitor (SEO / top-of-funnel)

| ID | Journey | Status | Routes | Routers / API | Workflow | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `CUJ-Visitor.1` | Land on a marketing/feature/education page → convert to search | 🟢 live | `/features`, `/education` | — | — | — |
| `CUJ-Visitor.2` | Hit a parked-domain page → click through to buy/inquire | 🟢 live | — | — | — | apps/park parked-domain landing pages. |
| `CUJ-Visitor.3` | Subscribe to the newsletter | 🟢 live | `/newsletter` | `newsletter` | — | — |

### Admin / Operator (internal)

| ID | Journey | Status | Routes | Routers / API | Workflow | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `CUJ-Admin.1` | NFT expiration / burn management | 🟢 live | `/admin` | `admin` | — | — |
| `CUJ-Admin.2` | User impersonation / support | 🟢 live | `/admin` | `users`, `admin` | — | — |
| `CUJ-Admin.3` | DNS-cache flush | 🟢 live | `/dns-cache` | `dnsCache` | — | — |
| `CUJ-Admin.4` | Audit-log & analytics review | 🟢 live | `/admin` | `bigQueryAudit`, `analytics` | — | — |

### Hunter — DEPRECATED (feature being retired)

| ID | Journey | Status | Routes | Routers / API | Workflow | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `CUJ-Hunter.1` | ~~Browse trending domains → upvote → submit a domain~~ | ⚠️ deprecated | `/hunt` | `hunt` | — | — |
| `CUJ-Hunter.2` | ~~Share a domain socially for a campaign reward~~ | ⚠️ deprecated | — | `share` | — | — |
| `CUJ-Hunter.3` | ~~Browse the marketplace / listings feed (MLS)~~ | ⚠️ deprecated | `/feed`, `/mart` | — | — | — |
