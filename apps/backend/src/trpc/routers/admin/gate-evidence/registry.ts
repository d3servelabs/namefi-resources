import { db, namefiNftOwnersCte, namefiNftOwnersView } from '@namefi-astra/db';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { RDAP } from '@namefi-astra/registrars/lib/rdap-whois/rdap_client';
import { WhoisClient } from '@namefi-astra/registrars/lib/rdap-whois/whois_client';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { eq } from 'drizzle-orm';
import { sldRegistrar } from '#lib/namefi-registry';

/**
 * Admin-side decision-support evidence gatherers, keyed by a gate's `gateKind`
 * (see `apps/backend/src/temporal/shared/workflow-helpers/known-gates.ts`).
 *
 * These run in the API process when an admin opens a gate — NOT inside a
 * Temporal workflow — so they call plain services/clients (registrar, RDAP/
 * WHOIS, db) directly. There is no replay determinism to preserve, a slow or
 * failing lookup can never affect the workflow, and RDAP/WHOIS (which are plain
 * lib functions, not activities) fit naturally here. Each sub-lookup is isolated
 * so partial evidence still surfaces.
 */
export type GateEvidenceGatherer = (
  params: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** RDAP first, WHOIS fallback — both read-only registration-data lookups. */
async function gatherLockState(
  domain: string,
): Promise<Record<string, unknown>> {
  try {
    return { source: 'rdap', ...(await RDAP.getLockState(domain)) };
  } catch (rdapError) {
    try {
      return { source: 'whois', ...(await WhoisClient.getLockState(domain)) };
    } catch (whoisError) {
      return {
        error: 'RDAP and WHOIS lookups both failed',
        rdapError: errorMessage(rdapError),
        whoisError: errorMessage(whoisError),
      };
    }
  }
}

/**
 * Evidence for a domain-bound gate: the registrar's view, whether the domain is
 * minted/owned in our system, and its RDAP/WHOIS registration data.
 */
async function gatherDomainEvidence(
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const normalizedDomainName = params.normalizedDomainName as
    | NamefiNormalizedDomain
    | undefined;
  if (!normalizedDomainName) {
    return { error: 'missing normalizedDomainName in evidenceParams' };
  }

  // The registrar and RDAP/WHOIS must query the SAME (punycoded) domain string —
  // for IDNs the raw normalized form and the punycode form differ, so using the
  // raw form for RDAP/WHOIS would report the wrong domain's state.
  const punycodeDomainName = toPunycodeDomainName(normalizedDomainName);
  const evidence: Record<string, unknown> = {};

  // Registrar view (read-only).
  try {
    evidence.registrar =
      await sldRegistrar.getDomainDetails(punycodeDomainName);
  } catch (error) {
    evidence.registrar = { error: errorMessage(error) };
  }

  // Is the domain minted/owned in our system? (same query as the getDomainChain
  // activity, but tolerant of an absent row instead of throwing.)
  try {
    const rows = await db
      .with(namefiNftOwnersCte)
      .select()
      .from(namefiNftOwnersView)
      .where(eq(namefiNftOwnersView.normalizedDomainName, normalizedDomainName))
      .limit(1);
    const row = rows[0];
    evidence.inSystem = row
      ? { inSystem: true, chainId: row.chainId, ownerAddress: row.ownerAddress }
      : { inSystem: false };
  } catch (error) {
    evidence.inSystem = { error: errorMessage(error) };
  }

  // Registration data (RDAP → WHOIS), read-only.
  evidence.rdapWhois = await gatherLockState(punycodeDomainName);

  return evidence;
}

/** GateKind → gatherer. Add an entry when a new known gate needs evidence. */
export const GATE_EVIDENCE_GATHERERS: Record<string, GateEvidenceGatherer> = {
  'register-or-import-poll': gatherDomainEvidence,
  // Same domain evidence helps an admin decide whether to re-submit (e.g. is the
  // domain already registered / already in our system?).
  'register-or-import-submit': gatherDomainEvidence,
};
