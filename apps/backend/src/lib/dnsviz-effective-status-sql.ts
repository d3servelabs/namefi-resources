import { dnsvizAnalysesTable, indexedDomainsTable } from '@namefi-astra/db';
import { sql } from 'drizzle-orm';

/**
 * SQL `CASE` overlay that reclassifies the raw `dnsviz_analyses.status`
 * (`SECURE | INSECURE | BOGUS | ERROR`) into the wider effective enum
 * surfaced on the admin UI and email digest:
 *
 *   - `EXPECTED_ERROR`: `delegation.status` was missing AND the
 *     domain's indexed DNSSEC state explains why
 *     (`!supportsDnssec`, or Namefi NS with consistent
 *     hasDS/hasZoneSigning, or custom NS with no DS).
 *   - `WARN`: a `BOGUS`/`ERROR` row where the TLD supports DNSSEC but
 *     the domain is on custom (non-Namefi) nameservers — heads-up not
 *     actionable, since we don't control the NS.
 *
 * Expects the consumer to LEFT JOIN `indexed_domains` on
 * `(normalized_domain_name, registrar_key)` (or the analogue used by
 * the consumer) so this expression resolves. Returns text (the enum
 * values), not the pg enum type, since the `CASE` mixes static
 * literals with the enum-typed column.
 *
 * Shared between `adminDnsvizRouter` (powers `/admin/dnsviz`) and
 * `sendDnsvizDigestEmail` (daily + on-demand digest emails) so the two
 * surfaces never disagree about a row's effective status.
 */
export const dnsvizEffectiveStatusSql = sql<string>`
  CASE
    WHEN ${dnsvizAnalysesTable.summary} ->> 'delegationStatus' IS NULL
     AND (
       COALESCE((${indexedDomainsTable.dnssecStatus} ->> 'supportsDnssec')::boolean, false) = false
       OR (
         COALESCE(${indexedDomainsTable.isUsingNamefiNameservers}, false) = true
         AND COALESCE((${indexedDomainsTable.dnssecStatus} ->> 'hasDelegationSigner')::boolean, false)
           = COALESCE((${indexedDomainsTable.dnssecStatus} ->> 'zoneHasActiveDnssec')::boolean, false)
       )
       OR (
         COALESCE(${indexedDomainsTable.isUsingNamefiNameservers}, true) = false
         AND COALESCE((${indexedDomainsTable.dnssecStatus} ->> 'hasDelegationSigner')::boolean, false) = false
       )
     )
    THEN 'EXPECTED_ERROR'
    WHEN ${dnsvizAnalysesTable.status} IN ('BOGUS', 'ERROR')
     AND COALESCE((${indexedDomainsTable.dnssecStatus} ->> 'supportsDnssec')::boolean, false) = true
     AND COALESCE(${indexedDomainsTable.isUsingNamefiNameservers}, true) = false
    THEN 'WARN'
    ELSE ${dnsvizAnalysesTable.status}::text
  END
`;
