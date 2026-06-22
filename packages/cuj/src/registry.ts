/**
 * Critical User Journeys (CUJ) — single source of truth.
 *
 * Each journey has a stable, human-readable, hierarchical id of the form
 * `CUJ-<Area>.<n>` (e.g. `CUJ-Trader.3`). The id is the join key used across:
 *   - the generated catalog doc (`docs/product/critical-user-journeys.md`)
 *   - e2e test tags / `describe` names (e.g. `@CUJ-Trader.3`)
 *   - `data-cuj="Trader.3"` markers on journey entry-point components
 *   - the preview / screen-recording generator (driven by `routes`)
 *
 * STABILITY RULE: ids are append-only handles. Never renumber on reword and
 * never reuse a retired number — set `status: 'deprecated'` instead (see Hunter).
 *
 * `Owner` is a shared journey LIBRARY, not a persona: the mechanics every domain
 * owner performs. The Trader, Collector and DAO personas all reference it (see
 * PERSONAS[*].includes) so the shared journeys are defined exactly once.
 */

export type CujArea =
  | 'Owner'
  | 'Trader'
  | 'Collector'
  | 'DAO'
  | 'Hunter'
  | 'PBN'
  | 'Dev'
  | 'Visitor'
  | 'Admin';

/**
 * live       — shipped and working today
 * partial    — building blocks exist, journey not fully assembled
 * draft      — net-new capability, not built yet
 * deprecated — being retired; kept for id stability, excluded from coverage
 */
export type CujStatus = 'live' | 'partial' | 'draft' | 'deprecated';

export type PersonaKey =
  | 'Trader'
  | 'Collector'
  | 'DAO'
  | 'PBN'
  | 'Dev'
  | 'Visitor'
  | 'Admin'
  | 'Hunter';

export interface Persona {
  readonly key: PersonaKey;
  readonly label: string;
  /** Why this persona shows up — their driving motivation. */
  readonly motivation: string;
  /** Journey areas this persona performs (shared `Owner` + their signature area). */
  readonly includes: readonly CujArea[];
  readonly deprecated?: boolean;
}

export interface Cuj {
  /** Stable id, e.g. `CUJ-Trader.3`. */
  readonly id: string;
  readonly area: CujArea;
  readonly title: string;
  readonly status: CujStatus;
  /** Frontend routes the journey touches (input for the recording generator). */
  readonly routes?: readonly string[];
  /** Backend tRPC routers the journey exercises. */
  readonly routers?: readonly string[];
  /** Primary Temporal workflow, if any. */
  readonly workflow?: string;
  readonly notes?: string;
}

export const PERSONAS: readonly Persona[] = [
  {
    key: 'Trader',
    label: 'Domain Trader',
    motivation: 'Profit-driven — ruthlessly aims for return, flips for ROI.',
    includes: ['Owner', 'Trader'],
  },
  {
    key: 'Collector',
    label: 'Domain Collector',
    motivation: 'Emotion-driven — collects for association, curates and holds.',
    includes: ['Owner', 'Collector'],
  },
  {
    key: 'DAO',
    label: 'DAO / Org Controller',
    motivation:
      'Wants shared, multi-sig control of a domain across an org/DAO.',
    includes: ['Owner', 'DAO'],
  },
  {
    key: 'PBN',
    label: 'Powered-by-Namefi Partner',
    motivation: 'White-label parent-domain owner issuing subdomains.',
    includes: ['PBN'],
  },
  {
    key: 'Dev',
    label: 'Developer / Integrator',
    motivation: 'Programmatic access to Namefi capabilities.',
    includes: ['Dev'],
  },
  {
    key: 'Visitor',
    label: 'Visitor',
    motivation: 'Top-of-funnel / SEO — not yet a customer.',
    includes: ['Visitor'],
  },
  {
    key: 'Admin',
    label: 'Admin / Operator',
    motivation: 'Internal operations and support.',
    includes: ['Admin'],
  },
  {
    key: 'Hunter',
    label: 'Domain Hunter',
    motivation: 'Community discovery / upvoting — being retired (unused).',
    includes: ['Hunter'],
    deprecated: true,
  },
];

export const CUJS: readonly Cuj[] = [
  // ── Owner core (shared by Trader, Collector, DAO) ─────────────────────────
  {
    id: 'CUJ-Owner.1',
    area: 'Owner',
    title: 'Search → see availability/pricing/suggestions → add to cart',
    status: 'live',
    routes: ['/'],
    routers: ['search', 'registry'],
  },
  {
    id: 'CUJ-Owner.2',
    area: 'Owner',
    title: 'Checkout & pay (Stripe/NFSC) → register → NFT mint → confirmation',
    status: 'live',
    routes: ['/cart', '/orders'],
    routers: ['carts', 'payments', 'orders'],
    workflow: 'processOrderWorkflow',
  },
  {
    id: 'CUJ-Owner.3',
    area: 'Owner',
    title: 'Instant-buy a single domain (skip cart)',
    status: 'live',
    routes: ['/'],
    routers: ['orders'],
    workflow: 'processOrderWorkflow',
    notes: 'orders.instantBuy',
  },
  {
    id: 'CUJ-Owner.4',
    area: 'Owner',
    title: 'Claim a free domain via a campaign',
    status: 'live',
    routes: ['/free-mints', '/claim'],
    routers: ['freeClaims', 'search'],
  },
  {
    id: 'CUJ-Owner.5',
    area: 'Owner',
    title: 'Connect wallet / sign in (Privy) — first-time onboarding',
    status: 'live',
    routes: ['/'],
    routers: ['auth', 'users'],
  },
  {
    id: 'CUJ-Owner.6',
    area: 'Owner',
    title: 'View My Domains with expiration status',
    status: 'live',
    routes: ['/my-domains', '/manage'],
    routers: ['users', 'domainConfig'],
  },
  {
    id: 'CUJ-Owner.7',
    area: 'Owner',
    title: 'Manage DNS records (records, forwarding, nameservers, DNSSEC)',
    status: 'live',
    routes: ['/manage'],
    routers: ['dnsRecords', 'domainConfig'],
  },
  {
    id: 'CUJ-Owner.8',
    area: 'Owner',
    title: 'Park a domain',
    status: 'live',
    routes: ['/manage'],
    routers: ['dnsRecords'],
    notes: 'dnsRecords.parkDomain',
  },
  {
    id: 'CUJ-Owner.9',
    area: 'Owner',
    title: 'Renew / set up auto-renewal',
    status: 'live',
    routes: ['/manage', '/orders'],
    routers: ['domainConfig', 'orders'],
    workflow: 'autoRenewWorkflow',
  },
  {
    id: 'CUJ-Owner.10',
    area: 'Owner',
    title: 'Export / transfer a domain out (auth code, export approval)',
    status: 'live',
    routes: ['/manage'],
    routers: ['domainConfig'],
  },
  {
    id: 'CUJ-Owner.11',
    area: 'Owner',
    title: 'Generate AI branding (logo / poster) for an owned domain',
    status: 'live',
    routes: ['/studio', '/gallery'],
    routers: ['ai'],
  },
  {
    id: 'CUJ-Owner.12',
    area: 'Owner',
    title: 'Get NFSC tokens from the faucet',
    status: 'live',
    routes: ['/faucet'],
    routers: ['users'],
  },

  // ── Trader (profit-driven) ────────────────────────────────────────────────
  {
    id: 'CUJ-Trader.1',
    area: 'Trader',
    title: 'Appraise / value a domain or portfolio with comps',
    status: 'draft',
  },
  {
    id: 'CUJ-Trader.2',
    area: 'Trader',
    title: 'Track ROI / P&L across the portfolio',
    status: 'draft',
  },
  {
    id: 'CUJ-Trader.3',
    area: 'Trader',
    title: 'List a domain for sale / set a buy-now price',
    status: 'partial',
    notes: 'Aligns with the parking-as-sales-channel plan (OpenSea buy-now).',
  },
  {
    id: 'CUJ-Trader.4',
    area: 'Trader',
    title: 'Receive & accept/counter Namefi-brokered offers',
    status: 'draft',
    notes: 'Buyer-restricted private Seaport listing settlement.',
  },
  {
    id: 'CUJ-Trader.5',
    area: 'Trader',
    title: 'Park-to-sell: turn a parked page into a sales channel',
    status: 'partial',
    routes: ['/manage'],
    notes: 'Parking is live; sales framing is in progress.',
  },
  {
    id: 'CUJ-Trader.6',
    area: 'Trader',
    title: 'Monitor / bulk-acquire cheap-domain opportunities',
    status: 'draft',
  },

  // ── Collector (emotion-driven) ────────────────────────────────────────────
  {
    id: 'CUJ-Collector.1',
    area: 'Collector',
    title: 'Organize domains into themed collections / sentimental tags',
    status: 'draft',
    notes: 'Wishlist (wishlist router) is a live building block.',
  },
  {
    id: 'CUJ-Collector.2',
    area: 'Collector',
    title: 'Build & share a public showcase / gallery',
    status: 'partial',
    routes: ['/gallery'],
    routers: ['ai'],
  },
  {
    id: 'CUJ-Collector.3',
    area: 'Collector',
    title: 'Aggregate domains across multiple wallets into one view',
    status: 'draft',
    routers: ['registry', 'users'],
    notes: 'registry.getDomainsByOwner is a building block.',
  },

  // ── DAO / Org Controller (multi-sig) — mostly net-new ─────────────────────
  {
    id: 'CUJ-DAO.1',
    area: 'DAO',
    title:
      'Place a domain under multi-sig control (assign signers + threshold)',
    status: 'draft',
    notes:
      'Realistically a Safe holds the Namefi NFT; backend must recognize it.',
  },
  {
    id: 'CUJ-DAO.2',
    area: 'DAO',
    title: 'Propose a domain action → collect signatures → execute',
    status: 'draft',
    notes: 'DNS change / transfer / renewal gated behind multi-sig approval.',
  },
  {
    id: 'CUJ-DAO.3',
    area: 'DAO',
    title: 'Role-based team access (who can edit DNS vs transfer vs pay)',
    status: 'draft',
  },
  {
    id: 'CUJ-DAO.4',
    area: 'DAO',
    title: 'Org / treasury-funded renewals & billing',
    status: 'draft',
  },
  {
    id: 'CUJ-DAO.5',
    area: 'DAO',
    title: 'Governance audit trail of domain actions',
    status: 'partial',
    routers: ['bigQueryAudit'],
  },
  {
    id: 'CUJ-DAO.6',
    area: 'DAO',
    title: 'Rotate / recover signers',
    status: 'draft',
  },

  // ── Hunter — DEPRECATED (kept for id stability; feature being retired) ─────
  {
    id: 'CUJ-Hunter.1',
    area: 'Hunter',
    title: 'Browse trending domains → upvote → submit a domain',
    status: 'deprecated',
    routes: ['/hunt'],
    routers: ['hunt'],
  },
  {
    id: 'CUJ-Hunter.2',
    area: 'Hunter',
    title: 'Share a domain socially for a campaign reward',
    status: 'deprecated',
    routers: ['share'],
  },
  {
    id: 'CUJ-Hunter.3',
    area: 'Hunter',
    title: 'Browse the marketplace / listings feed (MLS)',
    status: 'deprecated',
    routes: ['/feed', '/mart'],
  },

  // ── PBN partner / white-label ─────────────────────────────────────────────
  {
    id: 'CUJ-PBN.1',
    area: 'PBN',
    title: 'Onboard a parent domain + run a white-label storefront',
    status: 'live',
    routes: ['/powered-by-namefi', '/owner'],
    routers: ['poweredByNamefiOwner'],
  },
  {
    id: 'CUJ-PBN.2',
    area: 'PBN',
    title: 'Issue / reserve subdomains to recipients (bulk + email)',
    status: 'live',
    routers: ['pbnIssuanceReservations'],
  },
  {
    id: 'CUJ-PBN.3',
    area: 'PBN',
    title: 'Configure reserved words / restrictions for the namespace',
    status: 'live',
    routers: ['poweredByNamefiOwner'],
  },
  {
    id: 'CUJ-PBN.4',
    area: 'PBN',
    title: 'View analytics dashboard + revenue by domain',
    status: 'live',
    routes: ['/owner'],
    routers: ['poweredByNamefiOwner'],
  },

  // ── Developer / integrator ────────────────────────────────────────────────
  {
    id: 'CUJ-Dev.1',
    area: 'Dev',
    title: 'Create & manage API keys (EIP-712 signed)',
    status: 'live',
    routes: ['/profile'],
    routers: ['apiKeys'],
  },
  {
    id: 'CUJ-Dev.2',
    area: 'Dev',
    title: 'Call the public OpenAPI/REST API (availability/search/orders/DNS)',
    status: 'live',
    notes: 'Base path /v-next/; OpenAPI doc at /v-next/openapi/doc.',
  },
  {
    id: 'CUJ-Dev.3',
    area: 'Dev',
    title: 'Pay-per-call via the x402 paywall',
    status: 'live',
    routes: ['/x402'],
  },
  {
    id: 'CUJ-Dev.4',
    area: 'Dev',
    title: 'Consume the ns-json nameserver API',
    status: 'live',
    notes: 'apps/ns-json; backend route /v1/ns-json.',
  },

  // ── Visitor (SEO / top-of-funnel) ─────────────────────────────────────────
  {
    id: 'CUJ-Visitor.1',
    area: 'Visitor',
    title: 'Land on a marketing/feature/education page → convert to search',
    status: 'live',
    routes: ['/features', '/education'],
  },
  {
    id: 'CUJ-Visitor.2',
    area: 'Visitor',
    title: 'Hit a parked-domain page → click through to buy/inquire',
    status: 'live',
    notes: 'apps/park parked-domain landing pages.',
  },
  {
    id: 'CUJ-Visitor.3',
    area: 'Visitor',
    title: 'Subscribe to the newsletter',
    status: 'live',
    routes: ['/newsletter'],
    routers: ['newsletter'],
  },

  // ── Admin / operator (internal) ───────────────────────────────────────────
  {
    id: 'CUJ-Admin.1',
    area: 'Admin',
    title: 'NFT expiration / burn management',
    status: 'live',
    routes: ['/admin'],
    routers: ['admin'],
  },
  {
    id: 'CUJ-Admin.2',
    area: 'Admin',
    title: 'User impersonation / support',
    status: 'live',
    routes: ['/admin'],
    routers: ['users', 'admin'],
  },
  {
    id: 'CUJ-Admin.3',
    area: 'Admin',
    title: 'DNS-cache flush',
    status: 'live',
    routes: ['/dns-cache'],
    routers: ['dnsCache'],
  },
  {
    id: 'CUJ-Admin.4',
    area: 'Admin',
    title: 'Audit-log & analytics review',
    status: 'live',
    routes: ['/admin'],
    routers: ['bigQueryAudit', 'analytics'],
  },
];

/** Ordered list of areas as they should appear in generated output. */
export const AREA_ORDER: readonly CujArea[] = [
  'Owner',
  'Trader',
  'Collector',
  'DAO',
  'PBN',
  'Dev',
  'Visitor',
  'Admin',
  'Hunter',
];

export const getCuj = (id: string): Cuj | undefined =>
  CUJS.find((c) => c.id === id);

export const cujsByArea = (area: CujArea): readonly Cuj[] =>
  CUJS.filter((c) => c.area === area);

/** All journeys a persona performs: its included areas, in area order. */
export const cujsForPersona = (key: PersonaKey): readonly Cuj[] => {
  const persona = PERSONAS.find((p) => p.key === key);
  if (!persona) return [];
  return CUJS.filter((c) => persona.includes.includes(c.area));
};

/** Active journeys (everything that isn't deprecated) — the coverage target. */
export const activeCujs = (): readonly Cuj[] =>
  CUJS.filter((c) => c.status !== 'deprecated');
