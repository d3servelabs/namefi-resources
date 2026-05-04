/**
 * Shared retry orchestration for the dnsviz daily-digest and on-demand
 * workflows.
 *
 * Strategy:
 *   1. Run all input domains through `analyzeDomainsBatch` once (the "main
 *      pass"), accumulating the final per-domain status in a Map.
 *   2. Aggregate every ERROR / BOGUS verdict from the main pass into a
 *      single retry queue and process it as fresh batches at the end —
 *      not inline per-batch — so a long sweep doesn't block on a slow
 *      retry round mid-loop.
 *   3. Loop retry rounds until no domain is still eligible:
 *        - ERROR is treated as transient (probe/grok/network) and retried
 *          up to `maxErrorRetries` times.
 *        - BOGUS is mostly persistent (DNSSEC misconfig) but key-roll
 *          windows can clear within minutes, so we retry up to
 *          `maxBogusRetries` times.
 *      A single retry counter per domain governs eligibility — if BOGUS
 *      flips to ERROR mid-retry it can keep retrying as ERROR up to
 *      `maxErrorRetries`, and vice-versa.
 *
 * The activity upserts on `(domain, analysisDate)`, so each round
 * overwrites the previous row for that domain. The final per-domain map
 * therefore matches what's in the DB at the end and is the source of
 * truth for the workflow's totals.
 */
import * as workflow from '@temporalio/workflow';
import { splitEvery } from 'ramda';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';

export type DnsvizDomainStatus = 'SECURE' | 'INSECURE' | 'BOGUS' | 'ERROR';

export interface DnsvizRetryTotals {
  processed: number;
  secure: number;
  insecure: number;
  bogus: number;
  error: number;
}

interface DnsvizDomainTarget {
  domainName: NamefiNormalizedDomain;
  registrarKey: string;
}

interface DnsvizBatchResult {
  processed: number;
  secure: number;
  insecure: number;
  bogus: number;
  error: number;
  domainResults: Array<{
    domainName: NamefiNormalizedDomain;
    registrarKey: string;
    status: DnsvizDomainStatus;
  }>;
}

interface AnalyzeBatchInput {
  domains: DnsvizDomainTarget[];
  analysisDate: string;
  retentionDays: number;
  workflowRunId: string;
  perDomainConcurrency: number;
}

export interface RunDnsvizAnalysisWithRetriesArgs {
  domains: DnsvizDomainTarget[];
  analysisDate: string;
  retentionDays: number;
  workflowRunId: string;
  perDomainConcurrency: number;
  batchSize: number;
  delayBetweenBatchesSeconds: number;
  maxErrorRetries: number;
  maxBogusRetries: number;
  /**
   * The proxy-activity reference from the calling workflow. Passed in
   * because each workflow declares its own typed proxy and we don't want
   * this helper to import a specific binding.
   */
  analyzeDomainsBatch: (input: AnalyzeBatchInput) => Promise<DnsvizBatchResult>;
  /** Prefix used in `workflow.log.*` messages — e.g. `'dnsviz daily'`. */
  logPrefix: string;
}

/**
 * Returns `DnsvizRetryTotals` reflecting the final state in the DB (via the
 * per-domain map): SECURE/INSECURE/BOGUS/ERROR counts after all retries.
 */
export async function runDnsvizAnalysisWithRetries(
  args: RunDnsvizAnalysisWithRetriesArgs,
): Promise<DnsvizRetryTotals> {
  const {
    domains,
    analysisDate,
    retentionDays,
    workflowRunId,
    perDomainConcurrency,
    batchSize,
    delayBetweenBatchesSeconds,
    maxErrorRetries,
    maxBogusRetries,
    analyzeDomainsBatch,
    logPrefix,
  } = args;

  const domainStatus = new Map<string, DnsvizDomainStatus>();
  const retries = new Map<string, number>();
  const registrarKeyByDomain = new Map<string, string>();
  for (const d of domains) {
    registrarKeyByDomain.set(d.domainName, d.registrarKey);
  }

  const safeBatchSize = Math.max(1, Math.floor(batchSize));
  const sleepSeconds = Math.max(0, Math.floor(delayBetweenBatchesSeconds));
  const interBatchSleepMs = sleepSeconds * 1000;
  const retryRoundSleepMs = (sleepSeconds || 10) * 1000;

  const mainBatches = splitEvery(safeBatchSize, domains);

  for (let i = 0; i < mainBatches.length; i++) {
    const batch = mainBatches[i];
    workflow.log.debug(`${logPrefix} batch ${i + 1}/${mainBatches.length}`, {
      batchSize: batch.length,
    });

    const result = await catchAndAlertLocally(
      () =>
        analyzeDomainsBatch({
          domains: batch,
          analysisDate,
          retentionDays,
          workflowRunId,
          perDomainConcurrency,
        }),
      {
        message: `${logPrefix} batch failed`,
        details: { batchIndex: i, batchSize: batch.length, analysisDate },
      },
    );

    if (result) {
      for (const r of result.domainResults) {
        domainStatus.set(r.domainName, r.status);
      }
    }

    if (interBatchSleepMs > 0 && i < mainBatches.length - 1) {
      await workflow.sleep(interBatchSleepMs);
    }
  }

  let round = 0;
  while (true) {
    const candidates: DnsvizDomainTarget[] = [];
    for (const [domain, status] of domainStatus) {
      const r = retries.get(domain) ?? 0;
      const eligible =
        (status === 'ERROR' && r < maxErrorRetries) ||
        (status === 'BOGUS' && r < maxBogusRetries);
      if (!eligible) continue;
      const registrarKey = registrarKeyByDomain.get(domain);
      if (!registrarKey) continue;
      candidates.push({
        domainName: domain as NamefiNormalizedDomain,
        registrarKey,
      });
    }
    if (candidates.length === 0) break;

    round++;
    for (const c of candidates) {
      retries.set(c.domainName, (retries.get(c.domainName) ?? 0) + 1);
    }

    const errorCount = candidates.filter(
      (c) => domainStatus.get(c.domainName) === 'ERROR',
    ).length;
    const bogusCount = candidates.length - errorCount;
    workflow.log.debug(
      `${logPrefix} retry round ${round}: ${candidates.length} candidate(s) (${errorCount} ERROR, ${bogusCount} BOGUS)`,
    );

    // Pause before the first retry batch so the upstream resolvers get a
    // breather; same rationale as inter-batch sleep on the main pass.
    await workflow.sleep(retryRoundSleepMs);

    const retryBatches = splitEvery(safeBatchSize, candidates);
    for (let i = 0; i < retryBatches.length; i++) {
      const batch = retryBatches[i];
      const result = await catchAndAlertLocally(
        () =>
          analyzeDomainsBatch({
            domains: batch,
            analysisDate,
            retentionDays,
            workflowRunId,
            perDomainConcurrency,
          }),
        {
          message: `${logPrefix} retry batch failed`,
          details: {
            round,
            batchIndex: i,
            batchSize: batch.length,
            analysisDate,
          },
        },
      );
      if (result) {
        for (const r of result.domainResults) {
          domainStatus.set(r.domainName, r.status);
        }
      }
      if (interBatchSleepMs > 0 && i < retryBatches.length - 1) {
        await workflow.sleep(interBatchSleepMs);
      }
    }
  }

  const totals: DnsvizRetryTotals = {
    processed: domainStatus.size,
    secure: 0,
    insecure: 0,
    bogus: 0,
    error: 0,
  };
  for (const status of domainStatus.values()) {
    switch (status) {
      case 'SECURE':
        totals.secure++;
        break;
      case 'INSECURE':
        totals.insecure++;
        break;
      case 'BOGUS':
        totals.bogus++;
        break;
      case 'ERROR':
        totals.error++;
        break;
    }
  }
  return totals;
}
