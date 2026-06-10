import {
  computeDsDigest,
  computeKeyTag,
  detectDnsProviderFromNameservers,
} from '@namefi-astra/dns-tools';
import {
  type DnssecAlgorithms,
  DnssecDigestType,
  DnssecFlags,
  type DnssecKey,
} from '@namefi-astra/registrars/data/types/dnssec';
import {
  type PunycodeDomainName,
  toPunycodeFqdn,
} from '@namefi-astra/registrars/data/validations';
import { WorkflowIdReusePolicy } from '@temporalio/common';
import { TRPCError } from '@trpc/server';
import { createLogger } from '#lib/logger';
import { sldRegistrar } from '#lib/namefi-registry';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import {
  DEFERRED_DS_DEFAULTS,
  deferredAssociateDelegationSignerWorkflow,
} from '../../temporal/workflows/deferred-associate-delegation-signer.workflow';
import { associateDelegationSigner } from './dnssec';
import {
  fetchDnskeysAtAuthoritativeNs,
  validateDsAgainstAuthoritative,
  validateDsAgainstPublicDns,
} from './dnssec-validation';

const _logger = createLogger({ module: 'domains-custom-dnssec' });

/**
 * Result of inspecting whether a custom-NS domain is ready for one-click
 * "Enable DNSSEC". Drives the Simple panel's landing UX in the frontend.
 *
 * - `'no-dnskey'`: no DNSKEY at the authoritative NS and no DS at the
 *   registrar. Clean uninitialized state.
 * - `'ready'`: at least one KSK at the NS is not yet associated. Show
 *   the green Enable button.
 * - `'already-active'`: every KSK at the NS is already in the registrar's
 *   DS list. Quiet confirmation.
 * - `'mismatch'`: DS records are set up at the registrar but the
 *   authoritative NS isn't publishing a DNSKEY. DNSSEC validation is
 *   broken globally — surface a warning so the user can either enable
 *   DNSSEC at their DNS provider or remove the orphaned DS.
 */
export type CustomDnssecEnableStatus = {
  readiness: 'no-dnskey' | 'ready' | 'already-active' | 'mismatch';
  kskCount: number;
  detectedProvider: {
    name: string;
    dnssecSetupUrl?: string;
    confidence: 'all' | 'majority' | 'unknown';
  };
  sampleNameservers: string[];
};

const SAMPLE_NAMESERVERS_LIMIT = 3;

/**
 * Read-only "what will Enable do?" check. Fetches authoritative DNSKEYs,
 * detects the DNS provider from NS hostnames, and reports whether the user
 * can click Enable now (`'ready'`), needs to enable DNSSEC at their provider
 * first (`'no-dnskey'`), or already has every published KSK associated
 * (`'already-active'`). Never throws on DNS failures — falls back to
 * `'no-dnskey'` so the frontend renders the sad-path CTA instead of crashing.
 */
export async function getCustomDnssecEnableStatus(
  domainName: PunycodeDomainName,
): Promise<CustomDnssecEnableStatus> {
  const details = await sldRegistrar.getDomainDetails(domainName);
  const nameservers = details.nameservers.map((ns) => toPunycodeFqdn(ns));
  const detectedProvider = detectDnsProviderFromNameservers(nameservers);
  const sampleNameservers = nameservers.slice(0, SAMPLE_NAMESERVERS_LIMIT);

  const hasDsAtRegistrar = (details.dnssecKeys ?? []).length > 0;

  let dnskeys: Awaited<ReturnType<typeof fetchDnskeysAtAuthoritativeNs>> = [];
  try {
    dnskeys = await fetchDnskeysAtAuthoritativeNs(domainName, nameservers);
  } catch (error) {
    _logger.warn(
      { error, domainName },
      'Failed to fetch DNSKEY at authoritative NS; treating as no-dnskey readiness',
    );
    return {
      readiness: hasDsAtRegistrar ? 'mismatch' : 'no-dnskey',
      kskCount: 0,
      detectedProvider,
      sampleNameservers,
    };
  }

  const ksks = dnskeys.filter((dk) => dk.flags === DnssecFlags.KSK);
  if (ksks.length === 0) {
    return {
      readiness: hasDsAtRegistrar ? 'mismatch' : 'no-dnskey',
      kskCount: 0,
      detectedProvider,
      sampleNameservers,
    };
  }

  const associatedKeyTags = new Set<number>(
    (details.dnssecKeys ?? [])
      .map((ds) => ds.keyTag)
      .filter((kt): kt is number => typeof kt === 'number'),
  );
  const candidateKeyTags = ksks.map((ksk) =>
    computeKeyTag(ksk.flags, ksk.protocol, ksk.algorithm, ksk.publicKey),
  );
  const allAlreadyActive = candidateKeyTags.every((kt) =>
    associatedKeyTags.has(kt),
  );

  return {
    readiness: allAlreadyActive ? 'already-active' : 'ready',
    kskCount: ksks.length,
    detectedProvider,
    sampleNameservers,
  };
}

export type EnableCustomDnssecOutcome =
  | 'submitted-immediate'
  | 'submitted-deferred'
  | 'skipped-already-active';

/**
 * Per-KSK result. Discriminated by `outcome` so `workflowId` is required
 * exactly on the deferred variant and absent on the others. Matches the
 * `enableCustomDnssecResultSchema` contract in `domain-config-contract.ts`.
 */
type EnableCustomDnssecResultBase = {
  keyTag: number;
  algorithm: DnssecAlgorithms;
  digestType: DnssecDigestType;
  digest: string;
};

export type EnableCustomDnssecResult =
  | (EnableCustomDnssecResultBase & { outcome: 'submitted-immediate' })
  | (EnableCustomDnssecResultBase & {
      outcome: 'submitted-deferred';
      workflowId: string;
    })
  | (EnableCustomDnssecResultBase & { outcome: 'skipped-already-active' });

/**
 * Detect Temporal's "workflow already started" error so two callers (the
 * v3 mutation and the new orchestrator) can react differently. We don't
 * import the typed error class to avoid pulling Temporal internals into
 * this lib module — the error name and message are stable in practice.
 */
function isWorkflowAlreadyStartedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'WorkflowExecutionAlreadyStartedError') return true;
  return /already.*started/i.test(error.message);
}

/**
 * Start (or re-attach to) the deferred-associate-DS workflow for a single
 * (domain, keyTag). Used by both the existing override-flow mutation and
 * the new Simple-mode orchestrator.
 *
 * Returns `existed: true` when a workflow with the deterministic ID is
 * already running (so the orchestrator can keep iterating across multiple
 * KSKs without aborting on the first conflict).
 */
export async function startDeferredAssociateDelegationSignerWorkflow({
  domainName,
  signingConfig,
  userId,
  authoritativeTimeoutMs,
  publicDnsTimeoutMs,
}: {
  domainName: PunycodeDomainName;
  signingConfig: DnssecKey;
  userId: string;
  authoritativeTimeoutMs: number;
  publicDnsTimeoutMs: number;
}): Promise<{ workflowId: string; existed: boolean }> {
  const workflowId = deferredAssociateDelegationSignerWorkflow.generateId({
    domainName,
    signingConfig,
  });
  try {
    await temporalClient.workflow.start(
      deferredAssociateDelegationSignerWorkflow,
      {
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        workflowId,
        workflowIdReusePolicy: WorkflowIdReusePolicy.ALLOW_DUPLICATE,
        workflowIdConflictPolicy: 'FAIL',
        args: [
          {
            domainName,
            signingConfig,
            userId,
            authoritativeTimeoutMs,
            publicDnsTimeoutMs,
          },
        ],
      },
    );
    return { workflowId, existed: false };
  } catch (error) {
    if (isWorkflowAlreadyStartedError(error)) {
      return { workflowId, existed: true };
    }
    _logger.error(
      { error, workflowId, domainName },
      'Failed to start deferred-DS workflow',
    );
    throw error;
  }
}

/**
 * One-click "Enable DNSSEC" for a custom-NS domain. Detects KSKs at the
 * authoritative NS and, for each one, decides:
 * - `submitted-immediate`: both lanes pass → registrar accepts the DS now.
 * - `submitted-deferred`: at least one lane lags → start a deferred workflow
 *   that polls and submits when both lanes match.
 * - `skipped-already-active`: KSK is already in the registrar's DS list.
 *
 * Throws `PRECONDITION_FAILED` when no KSK is published — the frontend
 * already shows the sad-path CTA in that case, but the mutation is also
 * a hard error so the toast can surface a clear message.
 */
export async function enableCustomDnssec({
  domainName,
  userId,
  authoritativeTimeoutMs,
  publicDnsTimeoutMs,
}: {
  domainName: PunycodeDomainName;
  userId: string;
  authoritativeTimeoutMs?: number;
  publicDnsTimeoutMs?: number;
}): Promise<{ results: EnableCustomDnssecResult[] }> {
  const details = await sldRegistrar.getDomainDetails(domainName);
  const nameservers = details.nameservers.map((ns) => toPunycodeFqdn(ns));
  const dnskeys = await fetchDnskeysAtAuthoritativeNs(domainName, nameservers);
  const ksks = dnskeys.filter((dk) => dk.flags === DnssecFlags.KSK);

  if (ksks.length === 0) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: `No DNSKEY published at authoritative nameservers for "${domainName}". Enable DNSSEC at your DNS provider first.`,
    });
  }

  // SHA-256 is the most-supported digest type at parent zones and registrars.
  const digestType = DnssecDigestType.SHA_256;
  const associatedKeyTags = new Set<number>(
    (details.dnssecKeys ?? [])
      .map((ds) => ds.keyTag)
      .filter((kt): kt is number => typeof kt === 'number'),
  );

  const finalAuthoritativeTimeoutMs =
    authoritativeTimeoutMs ?? DEFERRED_DS_DEFAULTS.authoritativeTimeoutMs;
  const finalPublicDnsTimeoutMs =
    publicDnsTimeoutMs ?? DEFERRED_DS_DEFAULTS.publicDnsTimeoutMs;

  const results: EnableCustomDnssecResult[] = [];

  for (const ksk of ksks) {
    const algorithm = ksk.algorithm as DnssecAlgorithms;
    const keyTag = computeKeyTag(
      ksk.flags,
      ksk.protocol,
      ksk.algorithm,
      ksk.publicKey,
    );
    const digest = computeDsDigest(
      domainName,
      ksk.flags,
      ksk.protocol,
      ksk.algorithm,
      ksk.publicKey,
      digestType as number,
    );
    const signingConfig: DnssecKey = {
      algorithm,
      publicKey: ksk.publicKey,
      flags: ksk.flags as DnssecFlags,
      keyTag,
      digestType,
      digest,
    };

    if (associatedKeyTags.has(keyTag)) {
      results.push({
        keyTag,
        algorithm,
        digestType,
        digest,
        outcome: 'skipped-already-active',
      });
      continue;
    }

    const [auth, publicDns] = await Promise.all([
      validateDsAgainstAuthoritative({ domainName, signingConfig }),
      validateDsAgainstPublicDns({ domainName, signingConfig }),
    ]);

    if (auth.isValid && publicDns.isValid) {
      try {
        await associateDelegationSigner(domainName, signingConfig);
        results.push({
          keyTag,
          algorithm,
          digestType,
          digest,
          outcome: 'submitted-immediate',
        });
        continue;
      } catch (error) {
        _logger.warn(
          { error, domainName, keyTag },
          'Immediate associate failed despite both lanes valid; falling back to deferred workflow',
        );
      }
    }

    const { workflowId } = await startDeferredAssociateDelegationSignerWorkflow(
      {
        domainName,
        signingConfig,
        userId,
        authoritativeTimeoutMs: finalAuthoritativeTimeoutMs,
        publicDnsTimeoutMs: finalPublicDnsTimeoutMs,
      },
    );
    results.push({
      keyTag,
      algorithm,
      digestType,
      digest,
      outcome: 'submitted-deferred',
      workflowId,
    });
  }

  return { results };
}
