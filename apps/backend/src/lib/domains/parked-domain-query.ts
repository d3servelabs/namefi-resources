/**
 * Shared SQL building blocks for enumerating ACTIVE parked domains, used by the
 * admin router (list / list-all) and the weekly sweep activity so they stay in
 * lockstep.
 *
 * "Active parked" means:
 *  - served by Namefi park infra: auto-park is on (defaults to true) OR a
 *    forward is configured, AND
 *  - the NFT has not expired (`namefiNftView.expirationTime > now()`), AND
 *  - the registrar domain has not expired (`indexedDomainsTable.expirationTime > now()`).
 *
 * NULL/unknown expirations (e.g. a domain with no live `indexed_domains` row, or
 * an unset NFT expiration) are treated as NOT active and excluded — we only keep
 * domains we can positively confirm are still live, so verification isn't run
 * against expired domains (which would fail SSL/serving and create noise).
 *
 * The registrar-expiry check is a correlated `EXISTS` subquery (rather than a
 * join) because `indexed_domains` is unique on `(registrar_key, domain)` — a
 * domain can have multiple registrar rows, so a join would multiply rows and
 * inflate counts. Any query using `ACTIVE_PARKED_CONDITION` MUST still LEFT JOIN
 * `domainConfigTable` (via `parkedDomainConfigJoinOn`) onto `namefiNftView`.
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

/** Parked + NFT-active + registrar-active. See module docstring. */
export const ACTIVE_PARKED_CONDITION: SQL = sql`(
  (COALESCE(${domainConfigTable.autoParkEnabled}, true) = true OR ${domainConfigTable.forwardTo} IS NOT NULL)
  AND ${namefiNftView.expirationTime} > now()
  AND EXISTS (
    SELECT 1 FROM ${indexedDomainsTable}
    WHERE ${indexedDomainsTable.normalizedDomainName} = ${namefiNftView.normalizedDomainName}
      AND ${indexedDomainsTable.expirationTime} > now()
  )
)`;
