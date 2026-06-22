/**
 * Shared SQL building blocks for enumerating ACTIVE parked domains, used by the
 * admin router (list / list-all) and the weekly sweep activity so they stay in
 * lockstep.
 *
 * "Active parked" means ALL of:
 *  1. served by Namefi park infra: auto-park is explicitly enabled OR a
 *     non-empty forward is configured. (A missing `domain_config` row — NULL
 *     `autoParkEnabled` via the LEFT JOIN — is NOT parked; we don't default it
 *     to true. An empty/whitespace `forwardTo` is NOT a forward, matching the
 *     DNS service's `normalizeForwardTo`.);
 *  2. active: the NFT has not expired (`namefiNftView.expirationTime > now()`)
 *     AND the registrar domain has not expired
 *     (`indexedDomainsTable.expirationTime > now()`);
 *  3. on Namefi nameservers (`indexedDomainsTable.isUsingNamefiNameservers`).
 *
 * NULL/unknown expirations (e.g. a domain with no live `indexed_domains` row, or
 * an unset NFT expiration) are treated as NOT active and excluded — we only keep
 * domains we can positively confirm are still live + Namefi-served, so
 * verification isn't run against expired or off-Namefi domains (which would fail
 * SSL/serving and create noise).
 *
 * The registrar-side checks (expiry + nameservers) are a single correlated
 * `EXISTS` subquery (rather than a join) because `indexed_domains` is unique on
 * `(registrar_key, domain)` — a domain can have multiple registrar rows, so a
 * join would multiply rows and inflate counts. Both registrar predicates are on
 * the SAME row (the active registrar record must itself be on Namefi NS). Any
 * query using `ACTIVE_PARKED_CONDITION` MUST still LEFT JOIN `domainConfigTable`
 * (via `parkedDomainConfigJoinOn`) onto `namefiNftView`.
 */

import {
  domainConfigTable,
  indexedDomainsTable,
  namefiNftView,
} from '@namefi-astra/db';
import { eq, sql, type SQL } from 'drizzle-orm';

/** LEFT JOIN predicate for a domain's `domain_config` row. */
export const parkedDomainConfigJoinOn = eq(
  domainConfigTable.normalizedDomainName,
  namefiNftView.normalizedDomainName,
);

/** Parked + active (NFT & registrar) + on Namefi NS. See module docstring. */
export const ACTIVE_PARKED_CONDITION: SQL = sql`(
  (${domainConfigTable.autoParkEnabled} IS TRUE OR COALESCE(TRIM(${domainConfigTable.forwardTo}), '') <> '')
  AND ${namefiNftView.expirationTime} > now()
  AND EXISTS (
    SELECT 1 FROM ${indexedDomainsTable}
    WHERE ${indexedDomainsTable.normalizedDomainName} = ${namefiNftView.normalizedDomainName}
      AND ${indexedDomainsTable.expirationTime} > now()
      AND ${indexedDomainsTable.isUsingNamefiNameservers} = true
  )
)`;
