/**
 * Shared scope + convention config for the i18n checkers
 * (`check-i18n-coverage.ts` and `check-i18n-convention.ts`).
 *
 * Single-sourced so the "what's in scope" and "codepath → namespace" rules
 * never drift between the two scripts. Mirrors the table in
 * `.rulesync/rules/i18n-translation-keys.md`.
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

// ── What counts as end-user-facing (the rest may stay hardcoded) ─────────────
export const EXCLUDED_DIRS = new Set([
  'admin',
  'dev-tools',
  'stories',
  'test-signed-payload',
  '__tests__',
  '__mocks__',
  'node_modules',
  // Marketing / partner / white-label landing pages — out of scope, like admin:
  'feature-landing',
  'leadgen',
  'powered-by-namefi',
  // x402 payment-protocol pages — out of scope (owner decision 2026-06-20).
  'x402',
]);
// Partner landing variants under `pbns/` (0x-city, aave, uniswap, …) are out of
// scope; only `pbns/astra` (Namefi's own localized landing) stays in.
export const EXCLUDED_PATH_RE = /(^|\/)pbns\/(?!astra(\/|$))[^/]+/;
export const EXCLUDED_FILE_RE =
  /(\.test\.|\.spec\.|\.stories\.|\.d\.ts$|react-query-devtools)/;
export const SOURCE_FILE_RE = /\.(ts|tsx)$/;

// ── The namespace allowlist + codepath → feature map ─────────────────────────
/** Cross-cutting namespaces usable from ANY codepath (the pre-allowlist). */
export const ALLOWLISTED_NAMESPACES = new Set([
  'common',
  'shared',
  'nav',
  'footer',
  'consent',
]);

/** Codepath → feature namespace(s). A file matching no rule is "generic". */
export const FEATURE_RULES: [RegExp, string[]][] = [
  [/(^|[/_-])cart/i, ['cart']], // app/cart, floating-cart, …
  [/app\/orders\b|(^|\/)orders\//, ['orders']],
  [/(^|\/)profile\//, ['profile']],
  [/app\/wishlist\b|(^|\/)wishlist\b/, ['wishlist']],
  [/free-?mint/i, ['freeMints']],
  [/app\/gallery\b/, ['gallery']],
  [/(^|\/)claim\b|domain-claim/, ['claim']],
  [/(^|\/)search\//, ['search']],
  [
    /my-domains|domain-and-dns-managment|previously-owned-domains|app\/domains/,
    ['domains'],
  ],
  [/(^|\/)mart(\/|$)/, ['mart']], // domain marketplace (mart)
  [/domain-and-dns-managment|app\/dns-cache/, ['dnsManagement']], // DNSSEC/DNS panels + DNS cache flush

  [/app\/faucet\b/, ['faucet']],
  [/(^|\/)newsletter\//, ['newsletter']],
  [/app\/tlds\b/, ['tlds']],
  [/(^|\/)manage\.tsx$/, ['manage']],

  [/(^|\/)hunt(\/|$)/, ['hunt']],
  [/(^|\/)gifts?\//, ['gifts']],
  [/(^|\/)notifications?\//, ['notifications']],
  [/nfsc/i, ['nfsc']],
  [/app\/studio|ai-generation|generation-details/, ['aiGeneration']],
  [/(^|\/)mls\/|app\/feed/, ['feed']],
  [/payment-method/, ['payment', 'paymentMethods']],
  [/pbns\/astra/, ['landing', 'landingMarketing']],
  // Next.js error boundaries + the not-found / unauthorized error pages.
  [
    /(^|\/)(global-)?error\.tsx$|(^|\/)not-found\.tsx$|(^|\/)unauthorized\.tsx$/,
    ['error'],
  ],
];

/** Feature namespaces a file's codepath maps to (empty = generic/unmapped). */
export function featuresForPath(rel: string): string[] {
  const out = new Set<string>();
  for (const [re, ns] of FEATURE_RULES) {
    if (re.test(rel)) for (const n of ns) out.add(n);
  }
  return [...out];
}

/** Recursively collect in-scope `.ts`/`.tsx` files under `dir`. */
export function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      const sub = join(dir, entry.name);
      if (EXCLUDED_PATH_RE.test(sub)) continue;
      collectSourceFiles(sub, out);
    } else if (
      SOURCE_FILE_RE.test(entry.name) &&
      !EXCLUDED_FILE_RE.test(entry.name)
    ) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}
