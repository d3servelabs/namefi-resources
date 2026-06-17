import {
  db,
  indexedDomainsTable,
  namefiNftOwnersCte,
  namefiNftOwnersView,
  paymentsTable,
} from '@namefi-astra/db';
import { toPunycodeDomainName } from '@namefi-astra/registrars/data/validations';
import { RDAP } from '@namefi-astra/registrars/rdap-whois/rdap_client';
import { WhoisClient } from '@namefi-astra/registrars/rdap-whois/whois_client';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { addYears, differenceInCalendarDays } from 'date-fns';
import { eq } from 'drizzle-orm';
import { sldRegistrar } from '#lib/namefi-registry';
import { getViemPublicClient } from '#lib/crypto/viem-clients';
// Plain in-process on-chain reader (viem `getExpiration` read) — not a Temporal
// activity dependency, safe to call directly from the API process.
import { getNftExpirationTimeInSeconds } from '../../../../temporal/activities/mint/namefi-nft';

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

  // Is the domain in one of OUR 3rd-party registrar accounts? `indexedDomainsTable`
  // is the source of truth for which registrar a domain belongs to (it backs the
  // registrar routing — see getRegistrarKeyForExistingDomain).
  try {
    const row = await db.query.indexedDomainsTable.findFirst({
      where: eq(indexedDomainsTable.normalizedDomainName, normalizedDomainName),
    });
    evidence.registrarAccount = row
      ? {
          found: true,
          registrarKey: row.registrarKey,
          isMissingFromRegistrar: row.isMissingFromRegistrar,
        }
      : { found: false };
  } catch (error) {
    evidence.registrarAccount = { error: errorMessage(error) };
  }

  // Owned as a Namefi NFT on-chain? (same query as the getDomainChain activity,
  // but tolerant of an absent row.) NOTE: this is NFT ownership, NOT registrar
  // account presence — the two are distinct.
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

/**
 * Evidence for an NFSC-charge gate: the payment record — whether it already
 * shows a tx reference / SUCCEEDED status tells the admin if the charge actually
 * landed (RESPOND) or not (CANCEL).
 */
async function gatherNfscChargeEvidence(
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const paymentId = params.paymentId as string | undefined;
  if (!paymentId) {
    return { error: 'missing paymentId in evidenceParams' };
  }

  const evidence: Record<string, unknown> = {};
  try {
    const payment = await db.query.paymentsTable.findFirst({
      where: eq(paymentsTable.id, paymentId),
    });
    evidence.payment = payment
      ? {
          found: true,
          status: payment.status,
          paymentProvider: payment.paymentProvider,
          paymentProviderReferenceId: payment.paymentProviderReferenceId,
          amountInUSDCents: payment.amountInUSDCents,
          nfscPaymentDetails: payment.nfscPaymentDetails,
        }
      : { found: false };
  } catch (error) {
    evidence.payment = { error: errorMessage(error) };
  }
  return evidence;
}

/**
 * Evidence for a mint double-commit gate: the on-chain receipt status of each
 * candidate hash tells the admin which transaction(s) actually mined, so they
 * can RESPOND with the hash to keep (or CANCEL).
 */
async function gatherMintDoubleCommitEvidence(
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const chainId = Number(params.chainId);
  const winners = Array.isArray(params.winners)
    ? (params.winners as string[])
    : [];

  const evidence: Record<string, unknown> = {
    chainId,
    canonical: params.canonical,
    account: params.account ?? params.chargee,
    amountInUsd: params.amountInUsd,
    reason: params.reason,
  };

  if (!Number.isFinite(chainId) || winners.length === 0) {
    evidence.error = 'missing chainId or winners in evidenceParams';
    return evidence;
  }

  try {
    const publicClient = getViemPublicClient(chainId);
    evidence.receipts = await Promise.all(
      winners.map(async (hash) => {
        try {
          const receipt = await publicClient.getTransactionReceipt({
            hash: hash as `0x${string}`,
          });
          return {
            hash,
            status: receipt.status,
            blockNumber: receipt.blockNumber.toString(),
          };
        } catch (error) {
          return {
            hash,
            status: 'not-found-or-pending',
            error: errorMessage(error),
          };
        }
      }),
    );
  } catch (error) {
    evidence.receipts = { error: errorMessage(error) };
  }

  return evidence;
}

/**
 * Tx-already-sent gate: the pinned nonce was consumed by a transaction matching
 * our exact calldata. Surface the landed tx's on-chain receipt so the admin can
 * confirm it succeeded before accepting it.
 */
async function gatherTxAlreadySentEvidence(
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const chainId = Number(params.chainId);
  const landedTxHash =
    typeof params.landedTxHash === 'string' ? params.landedTxHash : undefined;

  const evidence: Record<string, unknown> = {
    chainId,
    landedTxHash,
    account: params.account ?? params.chargee,
    amountInUsd: params.amountInUsd,
    reason: params.reason,
  };

  if (!Number.isFinite(chainId) || !landedTxHash) {
    evidence.error = 'missing chainId or landedTxHash in evidenceParams';
    return evidence;
  }

  try {
    const publicClient = getViemPublicClient(chainId);
    const receipt = await publicClient.getTransactionReceipt({
      hash: landedTxHash as `0x${string}`,
    });
    evidence.receipt = {
      status: receipt.status,
      blockNumber: receipt.blockNumber.toString(),
    };
  } catch (error) {
    evidence.receipt = {
      status: 'not-found-or-pending',
      error: errorMessage(error),
    };
  }

  return evidence;
}

/**
 * A renewal-status gate compares the domain's expiration BEFORE the renewal
 * against the value at each source. A successful renewal is the only thing that
 * pushes the expiration later, so a source whose expiration moved past
 * `previous` is strong evidence the renewal landed there. The bump should also
 * be ~`durationInYears`; registrar/registry expiration math can differ from a
 * naive `addYears` by a day or two, so `matchesExpected` allows a small slop.
 */
const EXPIRATION_MATCH_TOLERANCE_DAYS = 2;

type ExpirationComparison = {
  expiration: string;
  /** Later than the pre-renewal expiration → the renewal landed at this source. */
  reflectsRenewal: boolean | null;
  /** Within tolerance of `previous + durationInYears` → the bump is the expected size. */
  matchesExpected: boolean | null;
};

function compareExpiration(
  current: Date,
  previous: Date | null,
  expected: Date | null,
): ExpirationComparison {
  return {
    expiration: current.toISOString(),
    reflectsRenewal: previous ? current.getTime() > previous.getTime() : null,
    matchesExpected: expected
      ? Math.abs(differenceInCalendarDays(current, expected)) <=
        EXPIRATION_MATCH_TOLERANCE_DAYS
      : null,
  };
}

/** RDAP first, WHOIS fallback — the registration expiration + its comparison. */
async function gatherExpirationFromRdapWhois(
  domain: string,
  previous: Date | null,
  expected: Date | null,
): Promise<Record<string, unknown>> {
  try {
    const expiry = RDAP.getExpiryDateFromRdapResponse(
      await RDAP.queryDomain(domain),
    );
    if (expiry && !Number.isNaN(expiry.getTime())) {
      return {
        source: 'rdap',
        ...compareExpiration(expiry, previous, expected),
      };
    }
  } catch {
    // Fall through to WHOIS.
  }
  try {
    const expiry = WhoisClient.getExpiryDateFromWhoisResponse(
      await WhoisClient.queryDomain(domain),
    );
    if (!Number.isNaN(expiry.getTime())) {
      return {
        source: 'whois',
        ...compareExpiration(expiry, previous, expected),
      };
    }
    return { error: 'WHOIS returned no valid expiration' };
  } catch (error) {
    return {
      error: 'RDAP and WHOIS expiration lookups both failed',
      detail: errorMessage(error),
    };
  }
}

/**
 * Evidence for a renewal (extend-registration) poll gate: the registrar
 * operation's current status (looked up by `externalOperationId`) plus the
 * domain's expiration from FOUR independent sources — live registrar, on-chain
 * Namefi NFT, our registrar index, and RDAP/WHOIS — each compared against the
 * pre-renewal expiration and the expected post-renewal date. A verdict
 * summarises whether the renewal already landed (RESPOND), did not (RETRY /
 * CANCEL), or is inconclusive. Each sub-lookup is isolated so partial evidence
 * still surfaces.
 */
async function gatherRenewalStatusEvidence(
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const normalizedDomainName = params.normalizedDomainName as
    | NamefiNormalizedDomain
    | undefined;
  if (!normalizedDomainName) {
    return { error: 'missing normalizedDomainName in evidenceParams' };
  }

  const externalOperationId =
    typeof params.externalOperationId === 'string'
      ? params.externalOperationId
      : undefined;
  const durationInYears = Number(params.durationInYears);
  const previous =
    typeof params.previousExpirationTimeIso === 'string'
      ? new Date(params.previousExpirationTimeIso)
      : null;
  const previousValid = previous && !Number.isNaN(previous.getTime());
  const expected =
    previousValid && Number.isFinite(durationInYears)
      ? addYears(previous as Date, durationInYears)
      : null;
  const previousForCompare = previousValid ? (previous as Date) : null;

  const punycodeDomainName = toPunycodeDomainName(normalizedDomainName);
  const evidence: Record<string, unknown> = {};

  // (1) Registrar operation, looked up by id. Its status (SUCCESSFUL / FAILED /
  // …) is the registrar's own verdict on whether the renewal completed.
  if (externalOperationId) {
    try {
      const op = await sldRegistrar.getOperationStatus(
        punycodeDomainName,
        externalOperationId,
      );
      evidence.operation = {
        found: true,
        operationId: op.operationId ?? externalOperationId,
        status: op.status,
        type: op.type,
        message: op.message,
        registrarKey: (op as { registrarKey?: string }).registrarKey,
      };
    } catch (error) {
      evidence.operation = { error: errorMessage(error) };
    }
  } else {
    evidence.operation = { found: false, reason: 'no externalOperationId' };
  }

  // Resolve a chainId for the on-chain NFT read: prefer the workflow-supplied
  // chainId, else fall back to the NFT-owner view (also yields the owner).
  let chainId =
    typeof params.chainId === 'number' && Number.isFinite(params.chainId)
      ? (params.chainId as number)
      : undefined;
  let nftOwnerAddress: string | undefined;
  try {
    const rows = await db
      .with(namefiNftOwnersCte)
      .select()
      .from(namefiNftOwnersView)
      .where(eq(namefiNftOwnersView.normalizedDomainName, normalizedDomainName))
      .limit(1);
    const row = rows[0];
    if (row) {
      nftOwnerAddress = row.ownerAddress;
      chainId ??= row.chainId;
    }
  } catch {
    // Best-effort; the NFT expiration below notes the missing chain.
  }

  const sources: Record<string, unknown> = {};

  // (2a) Live registrar expiration.
  try {
    const details = await sldRegistrar.getDomainDetails(punycodeDomainName);
    sources.registrar = {
      ...compareExpiration(
        new Date(details.expirationTime),
        previousForCompare,
        expected,
      ),
      registrarKey: details.registrarKey,
    };
  } catch (error) {
    sources.registrar = { error: errorMessage(error) };
  }

  // (2b) On-chain Namefi NFT expiration (`getExpiration`, returns unix seconds).
  if (chainId === undefined) {
    sources.nft = { found: false, reason: 'no chainId for on-chain read' };
  } else {
    try {
      const seconds = await getNftExpirationTimeInSeconds(
        chainId,
        normalizedDomainName,
      );
      if (!Number.isFinite(seconds) || seconds <= 0) {
        // 0 = never set; non-finite = a bad contract read.
        sources.nft = {
          found: false,
          chainId,
          reason: 'no NFT expiration set',
        };
      } else {
        const nftExpiration = new Date(seconds * 1000);
        sources.nft = Number.isNaN(nftExpiration.getTime())
          ? {
              found: false,
              chainId,
              seconds,
              reason: 'invalid NFT expiration value',
            }
          : {
              ...compareExpiration(nftExpiration, previousForCompare, expected),
              chainId,
              ownerAddress: nftOwnerAddress,
            };
      }
    } catch (error) {
      sources.nft = { error: errorMessage(error), chainId };
    }
  }

  // (2c) Our registrar index (`indexedDomainsTable`).
  try {
    const row = await db.query.indexedDomainsTable.findFirst({
      where: eq(indexedDomainsTable.normalizedDomainName, normalizedDomainName),
    });
    sources.indexedDomain = row
      ? {
          ...compareExpiration(
            new Date(row.expirationTime),
            previousForCompare,
            expected,
          ),
          registrarKey: row.registrarKey,
          isMissingFromRegistrar: row.isMissingFromRegistrar,
        }
      : { found: false };
  } catch (error) {
    sources.indexedDomain = { error: errorMessage(error) };
  }

  // (2d) RDAP → WHOIS expiration.
  sources.rdapWhois = await gatherExpirationFromRdapWhois(
    punycodeDomainName,
    previousForCompare,
    expected,
  );

  // (3) Verdict. A successful renewal pushes the expiration past the pre-renewal
  // value by ~`durationInYears`, so a source only counts as positive evidence
  // when it BOTH moved past the old date (`reflectsRenewal`) AND landed near the
  // expected new date (`matchesExpected !== false`). A move to an unexpected date
  // (stale cache from a prior renewal, or the wrong duration) is tracked
  // separately and never on its own implies the renewal landed. The registrar
  // operation's own terminal status is authoritative: a FAILED/ERROR operation is
  // never overridden to "landed" by source movements (which may be stale).
  const comparisons = Object.values(sources).filter(
    (s): s is ExpirationComparison =>
      !!s &&
      typeof s === 'object' &&
      'expiration' in (s as object) &&
      !('error' in (s as object)),
  );
  const sourcesWithData = comparisons.length;
  const sourcesReflectingRenewal = comparisons.filter(
    (s) => s.reflectsRenewal === true && s.matchesExpected !== false,
  ).length;
  const sourcesMovedUnexpectedAmount = comparisons.filter(
    (s) => s.reflectsRenewal === true && s.matchesExpected === false,
  ).length;
  const opStatus = (evidence.operation as { status?: string } | undefined)
    ?.status;
  const opTerminalFailure = opStatus === 'FAILED' || opStatus === 'ERROR';

  let state: 'landed' | 'not-landed' | 'inconclusive';
  let summary: string;
  if (opTerminalFailure) {
    // Registrar explicitly failed — never claim "landed" off source movement.
    if (sourcesReflectingRenewal > 0 || sourcesMovedUnexpectedAmount > 0) {
      state = 'inconclusive';
      summary = `Conflicting signals: the registrar operation reports ${opStatus}, but ${
        sourcesReflectingRenewal + sourcesMovedUnexpectedAmount
      }/${sourcesWithData} expiration source(s) show a later date — possibly stale/cached from a prior renewal${
        sourcesMovedUnexpectedAmount > 0
          ? ', or a different duration than requested'
          : ''
      }. Verify the registrar directly before deciding.`;
    } else {
      state = 'not-landed';
      summary = `The registrar operation reports ${opStatus} and no expiration source moved to the expected new date. The renewal likely did not land — RETRY to re-poll, or CANCEL to fail.`;
    }
  } else if (opStatus === 'SUCCESSFUL') {
    state = 'landed';
    summary = `The registrar operation reports SUCCESSFUL${
      sourcesReflectingRenewal > 0
        ? ` and ${sourcesReflectingRenewal}/${sourcesWithData} expiration sources match the expected new date`
        : ' (the new expiration may still be propagating to other sources)'
    }. RESPOND SUCCESSFUL so the NFT expiry is updated.`;
  } else if (sourcesReflectingRenewal > 0) {
    state = 'landed';
    summary = `The renewal appears to have landed — ${sourcesReflectingRenewal}/${sourcesWithData} expiration sources match the expected post-renewal date${
      opStatus ? ` (operation status ${opStatus})` : ''
    }.${
      sourcesMovedUnexpectedAmount > 0
        ? ` Note: ${sourcesMovedUnexpectedAmount} other source(s) moved but to an unexpected date — confirm the duration.`
        : ''
    } RESPOND SUCCESSFUL so the NFT expiry is updated.`;
  } else if (!previousValid) {
    // No pre-renewal baseline → reflectsRenewal/matchesExpected are unavailable.
    state = 'inconclusive';
    summary =
      'No pre-renewal expiration baseline was supplied, so the renewal could not be confirmed by comparison. Check the registrar operation status and the raw expirations below.';
  } else if (sourcesMovedUnexpectedAmount > 0) {
    state = 'inconclusive';
    summary = `${sourcesMovedUnexpectedAmount}/${sourcesWithData} expiration source(s) moved but to an unexpected date (not ~${
      Number.isFinite(durationInYears) ? durationInYears : '?'
    } year(s) past the old expiry). Verify the registrar before deciding.`;
  } else {
    state = 'inconclusive';
    summary =
      sourcesWithData === 0
        ? 'Could not read any expiration source. Verify the registrar state manually before deciding.'
        : `Expiration sources still show the old date${
            opStatus ? ` and the operation status is ${opStatus}` : ''
          }. RETRY to keep polling, or verify at the registrar before deciding.`;
  }

  evidence.expiration = {
    durationInYears: Number.isFinite(durationInYears) ? durationInYears : null,
    previous: previousValid ? (previous as Date).toISOString() : null,
    expectedAfterRenewal: expected ? expected.toISOString() : null,
    toleranceDays: EXPIRATION_MATCH_TOLERANCE_DAYS,
    ...(previousValid
      ? {}
      : {
          note: 'No pre-renewal expiration baseline supplied — reflectsRenewal/matchesExpected are unavailable; sources show their current expiration only.',
        }),
    ...sources,
  };
  evidence.verdict = {
    state,
    sourcesWithData,
    sourcesReflectingRenewal,
    sourcesMovedUnexpectedAmount,
    summary,
  };

  return evidence;
}

/** GateKind → gatherer. Add an entry when a new known gate needs evidence. */
export const GATE_EVIDENCE_GATHERERS: Record<string, GateEvidenceGatherer> = {
  'register-or-import-poll': gatherDomainEvidence,
  // Same domain evidence helps an admin decide whether to re-submit (e.g. is the
  // domain already registered / already in our accounts?).
  'register-or-import-submit': gatherDomainEvidence,
  // An order item wraps an acquire/register/import/renew — the same domain
  // evidence shows whether it already completed.
  'process-order-item': gatherDomainEvidence,
  // NFSC charge: the payment record shows whether the charge already landed.
  'nfsc-charge': gatherNfscChargeEvidence,
  // Mint double-commit: per-candidate on-chain receipt status.
  'mint-double-commit': gatherMintDoubleCommitEvidence,
  // Tx-already-sent: the single landed tx's on-chain receipt.
  'tx-already-sent': gatherTxAlreadySentEvidence,
  // Renewal (extend-registration) gates: the registrar operation status plus the
  // domain's expiration across every source, compared to the expected
  // post-renewal date, so the admin can tell whether the renewal already landed.
  'extend-epp-status-poll': gatherRenewalStatusEvidence,
  'extend-expiration-poll': gatherRenewalStatusEvidence,
};
