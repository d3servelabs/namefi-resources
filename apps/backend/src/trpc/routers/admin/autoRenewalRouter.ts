import { inArray } from 'drizzle-orm';
import { defaultPayloadConverter } from '@temporalio/common';
import { logger } from '#lib/logger';
import { config } from '#lib/env';
import { adminProcedureWithPermissions } from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminAutoRenewalContract } from '@namefi-astra/common/contract/admin/admin-auto-renewal-contract';
import { Permission } from '@namefi-astra/utils';
import { temporalClient } from '#temporal/client';
import { db, paymentsTable } from '@namefi-astra/db';
import {
  computeAutoRenewMetricsFromResults,
  type AutoRenewReportInput,
} from '#temporal/activities/domain/autorenew-report.activities';
import { determineActionRequired } from '#temporal/shared/autorenew-utils';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import type { PaymentProvider } from '@namefi-astra/db/types';

const autoRenewalLogger = logger;

export const autoRenewalRouter = createContractTRPCRouter<
  typeof adminAutoRenewalContract
>({
  /**
   * List all auto-renewal workflow runs (recent 90 days).
   * For completed runs, extract summary counts from the workflow result.
   */
  getAllAutoRenewalWorkflows: adminProcedureWithPermissions(
    Permission.READ_ORDERS,
  )
    .input(adminAutoRenewalContract.getAllAutoRenewalWorkflows.input)
    .output(adminAutoRenewalContract.getAllAutoRenewalWorkflows.output)
    .query(async () => {
      try {
        await temporalClient.connection.ensureConnected();

        const cutoff = new Date(
          Date.now() - 90 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const workflowList = temporalClient.workflow.list({
          query: `StartTime >= "${cutoff}" AND WorkflowType = "dailyDomainsUpcomingRenewalsWorkflow"`,
        });

        const workflows: Array<{
          workflowId: string;
          status: string;
          startTime: Date | null;
          closeTime: Date | null;
          runId: string;
          summary?: {
            totalUsers: number;
            successfulUsers: number;
            failedUsers: number;
            totalDomains: number;
            totalDomainsRenewed: number;
            totalDomainsFailed: number;
            totalRevenueUsd: number;
            executionTimeMs: number;
          };
        }> = [];

        for await (const info of workflowList) {
          try {
            let summary: (typeof workflows)[number]['summary'];

            // For completed workflows, extract summary from the result
            if (info.status?.name === 'COMPLETED') {
              try {
                const handle = temporalClient.workflow.getHandle(
                  info.workflowId,
                  info.runId,
                );
                const result = await handle.result();
                // `successes` = child workflows that didn't crash (but may
                // still have paymentStatus FAILED/SKIPPED internally).
                // `failures` = child workflows that threw entirely.
                const childSuccesses = (result?.successes ?? []) as Array<{
                  result?: {
                    paymentStatus?: string;
                    successes?: unknown[];
                    failures?: unknown[];
                    domainsThatCouldBeRenewed?: unknown[];
                    domainsMissingPriceData?: unknown[];
                    totalAmountInUsd?: number;
                    refundAmountInUsd?: number | null;
                  };
                }>;
                const childFailures: unknown[] = result?.failures ?? [];

                let domainsRenewed = 0;
                let domainsFailed = 0;
                let totalRevenue = 0;
                let successfulUsers = 0;
                let failedUsers = childFailures.length; // crashed workflows = failed

                for (const s of childSuccesses) {
                  const ps = s.result?.paymentStatus;
                  if (ps === 'SUCCEEDED') {
                    successfulUsers++;
                    // Only count revenue from successful payments
                    totalRevenue +=
                      (s.result?.totalAmountInUsd ?? 0) -
                      (s.result?.refundAmountInUsd ?? 0);
                  } else if (ps === 'FAILED' || ps === 'SKIPPED') {
                    failedUsers++;
                  }
                  domainsRenewed += s.result?.successes?.length ?? 0;
                  domainsFailed += s.result?.failures?.length ?? 0;

                  // When payment failed, all attempted domains are effectively failed
                  if (ps === 'FAILED') {
                    domainsFailed +=
                      s.result?.domainsThatCouldBeRenewed?.length ?? 0;
                  }
                  // Domains with missing price data are always failed
                  domainsFailed +=
                    s.result?.domainsMissingPriceData?.length ?? 0;
                }

                summary = {
                  totalUsers: childSuccesses.length + childFailures.length,
                  successfulUsers,
                  failedUsers,
                  totalDomains: domainsRenewed + domainsFailed,
                  totalDomainsRenewed: domainsRenewed,
                  totalDomainsFailed: domainsFailed,
                  totalRevenueUsd: totalRevenue,
                  executionTimeMs: result?.executionTime ?? 0,
                };
              } catch (err) {
                autoRenewalLogger.debug(
                  { workflowId: info.workflowId, err },
                  'Could not fetch workflow result for summary',
                );
              }
            }

            workflows.push({
              workflowId: info.workflowId,
              status: info.status?.name || 'Unknown',
              startTime: info.startTime ?? null,
              closeTime: info.closeTime ?? null,
              runId: info.runId,
              summary,
            });
          } catch (err) {
            autoRenewalLogger.error(
              { workflowId: info.workflowId, err },
              'Failed to process auto-renewal workflow entry',
            );
          }
        }

        return workflows;
      } catch (error) {
        autoRenewalLogger.error(
          { error },
          'Failed to fetch auto-renewal workflows',
        );
        return [];
      }
    }),

  /**
   * Get full details for a single auto-renewal workflow run.
   * Returns computed metrics and per-user/per-domain breakdowns.
   */
  getAutoRenewalWorkflowById: adminProcedureWithPermissions(
    Permission.READ_ORDERS,
  )
    .input(adminAutoRenewalContract.getAutoRenewalWorkflowById.input)
    .output(adminAutoRenewalContract.getAutoRenewalWorkflowById.output)
    .query(async ({ input }) => {
      const { workflowId, runId } = input;

      try {
        await temporalClient.connection.ensureConnected();

        const handle = temporalClient.workflow.getHandle(workflowId, runId);
        const desc = await handle.describe();

        // Best-effort run-type + input-arg extraction. Always returns
        // something (falls back to `{ runType: 'unknown' }` on failure).
        const runConfig = await extractRunConfig(handle, desc);

        const base = {
          exists: true as const,
          workflowId: desc.workflowId,
          status: desc.status?.name || 'Unknown',
          startTime: desc.startTime ?? null,
          closeTime: desc.closeTime ?? null,
          runId: desc.runId,
          historyLength: desc.historyLength ?? null,
          temporal: {
            apiUrl: config.TEMPORAL_API_URL,
            namespace: config.TEMPORAL_NAMESPACE,
          },
          runConfig,
        };

        // If the workflow is still running, return basic info only
        if (desc.status?.name === 'RUNNING') {
          return base;
        }

        // Try to retrieve the completed result
        let rawResult: {
          successes: Array<{
            status: string;
            userId: string;
            result: SingleUserResult;
          }>;
          failures: Array<{
            status: string;
            userId: string;
            error?: { message?: string };
          }>;
          executionTime: number;
          reportSent: boolean;
        };

        try {
          rawResult = await handle.result();
        } catch (err) {
          autoRenewalLogger.warn(
            { workflowId, err },
            'Could not retrieve workflow result',
          );
          return base;
        }

        // The workflow's notify activity returns payment objects without
        // `paymentProviderReferenceId` (the external Stripe Payment Intent ID
        // or on-chain tx hash). Enrich them via a single batched DB lookup
        // keyed on the payment row id (UUID stored in `paymentId` / `id`).
        const allPaymentIds = new Set<string>();
        for (const s of rawResult.successes ?? []) {
          for (const p of s.result?.payments ?? []) {
            const id = p.paymentId ?? p.id;
            if (id) allPaymentIds.add(id);
          }
        }
        const paymentRefById: Record<string, string | null> = {};
        if (allPaymentIds.size > 0) {
          try {
            const rows = await db.query.paymentsTable.findMany({
              columns: { id: true, paymentProviderReferenceId: true },
              where: inArray(paymentsTable.id, [...allPaymentIds]),
            });
            for (const row of rows) {
              paymentRefById[row.id] = row.paymentProviderReferenceId ?? null;
            }
          } catch (err) {
            autoRenewalLogger.warn(
              { workflowId, err },
              'Failed to enrich payments with provider reference ids',
            );
          }
        }

        // Build workflowResults in the same format used by the report
        const workflowResults: AutoRenewReportInput['workflowResults'] = [];
        const userResults: UserResultForAdmin[] = [];

        for (const success of rawResult.successes ?? []) {
          const r = success.result;
          if (!r) continue;

          const chargeMap = r.chargeAmountByDomainLdh ?? {};
          const lookupCharge = (name: string): number | null =>
            chargeMap[name] ?? null;

          // Authoritative per-domain categorization. Mirrors the
          // orchestration logic in `autorenew-daily-report.workflow.ts`.
          const isInsufficientBalance =
            typeof r.shortfallInUsdCents === 'number' &&
            r.shortfallInUsdCents > 0;
          const domainCategories: NonNullable<
            AutoRenewReportInput['workflowResults'][number]['domainCategories']
          > = {
            renewed: (r.successes ?? []).map((s) => ({
              domain: s.domain.normalizedDomainName as NamefiNormalizedDomain,
              registrar: s.domain.registrarKey,
              chargeAmountInUsd: lookupCharge(s.domain.normalizedDomainName),
            })),
            registrarFailed: (r.failures ?? []).map((f) => ({
              domain: f.domain.normalizedDomainName as NamefiNormalizedDomain,
              registrar: f.domain.registrarKey,
              reason: f.error?.message || 'Unknown error',
              chargeAmountInUsd: lookupCharge(f.domain.normalizedDomainName),
            })),
            paymentFailed: [],
            deferredInsufficientBalance: (
              r.domainsSkippedDueToInsufficientFunds ?? []
            ).map((d) => ({
              domain: d.normalizedDomainName as NamefiNormalizedDomain,
              registrar: d.registrarKey,
              chargeAmountInUsd: lookupCharge(d.normalizedDomainName),
            })),
            missingPrice: (r.domainsMissingPriceData ?? []).map((d) => ({
              domain: d.normalizedDomainName as NamefiNormalizedDomain,
              registrar: d.registrarKey,
            })),
          };

          if (r.paymentStatus === 'FAILED' && r.domainsThatCouldBeRenewed) {
            const reason = isInsufficientBalance
              ? `Skipped due to insufficient balance (short by $${(r.shortfallInUsdCents! / 100).toFixed(2)})`
              : r.message || 'Payment failed';
            for (const d of r.domainsThatCouldBeRenewed) {
              if (isInsufficientBalance) {
                domainCategories.deferredInsufficientBalance.push({
                  domain: d.normalizedDomainName as NamefiNormalizedDomain,
                  registrar: d.registrarKey,
                  chargeAmountInUsd: lookupCharge(d.normalizedDomainName),
                });
              } else {
                domainCategories.paymentFailed.push({
                  domain: d.normalizedDomainName as NamefiNormalizedDomain,
                  registrar: d.registrarKey,
                  reason,
                  chargeAmountInUsd: lookupCharge(d.normalizedDomainName),
                });
              }
            }
          }

          // Legacy `failures[]` / `successes[]` arrays are kept populated
          // for callers that still read them (metrics fallback path).
          const legacySuccesses =
            domainCategories.renewed.map((e) => ({
              domain: e.domain,
              registrar: e.registrar,
            })) ?? [];
          const legacyFailures: NonNullable<
            AutoRenewReportInput['workflowResults'][number]['failures']
          > = [
            ...domainCategories.registrarFailed.map((e) => ({
              domain: e.domain,
              reason: e.reason,
              registrar: e.registrar,
            })),
            ...domainCategories.paymentFailed.map((e) => ({
              domain: e.domain,
              reason: e.reason,
              registrar: e.registrar,
            })),
            ...domainCategories.deferredInsufficientBalance.map((e) => ({
              domain: e.domain,
              reason: isInsufficientBalance
                ? `Skipped due to insufficient balance (short by $${(r.shortfallInUsdCents! / 100).toFixed(2)})`
                : 'Skipped due to insufficient balance',
              registrar: e.registrar,
            })),
            ...domainCategories.missingPrice.map((e) => ({
              domain: e.domain,
              reason: 'Missing price data',
              registrar: e.registrar,
            })),
          ];

          const snapshot =
            typeof r.availableBalanceInNfsc === 'number' &&
            r.nfscBalancesByChain &&
            r.availablePaymentMethods &&
            r.snapshotTakenAt
              ? {
                  availableBalanceInNfsc: r.availableBalanceInNfsc,
                  nfscBalancesByChain: r.nfscBalancesByChain,
                  availablePaymentMethods: r.availablePaymentMethods,
                  snapshotTakenAt: r.snapshotTakenAt,
                }
              : undefined;

          workflowResults.push({
            userId: success.userId,
            userEmail: r.userEmail,
            status:
              r.paymentStatus === 'FAILED'
                ? 'failure'
                : r.paymentStatus === 'SKIPPED'
                  ? 'skipped'
                  : 'success',
            domainsProcessed:
              legacySuccesses.length + legacyFailures.length || 0,
            amountChargedInUsd: r.totalAmountInUsd || 0,
            amountRefundedInUsd: r.refundAmountInUsd || 0,
            totalAmountInUsd: r.totalAmountInUsd,
            shortfallInUsdCents: r.shortfallInUsdCents,
            snapshot,
            // The workflow runtime returns each payment with `provider`
            // rather than `paymentProvider`; normalize so that
            // computeAutoRenewMetricsFromResults sees the field it expects.
            payments: r.payments?.map((p) => ({
              id: p.id ?? p.paymentId ?? '',
              paymentProvider: (p.provider ??
                p.paymentProvider ??
                'UNKNOWN') as PaymentProvider,
              amountInUsdCents: p.amountInUsdCents,
            })),
            failures: legacyFailures,
            successes: legacySuccesses,
            chargeAmountByDomainLdh: r.chargeAmountByDomainLdh,
            domainCategories,
          });

          // Build flattened domain rows for the admin UI.
          const domains: UserResultForAdmin['domains'] = [];

          for (const s of r.successes ?? []) {
            domains.push({
              domain: s.domain.normalizedDomainName,
              registrar: s.domain.registrarKey,
              chainId: s.domain.chainId,
              status: 'SUCCESS',
              chargeAmountUsd:
                r.chargeAmountByDomainLdh?.[s.domain.normalizedDomainName] ??
                undefined,
              txHash: s.result?.txHash,
              eppOperationStatus: s.result?.eppOperationStatus,
            });
          }

          for (const f of r.failures ?? []) {
            domains.push({
              domain: f.domain.normalizedDomainName,
              registrar: f.domain.registrarKey,
              chainId: f.domain.chainId,
              status: 'FAILED',
              chargeAmountUsd:
                r.chargeAmountByDomainLdh?.[f.domain.normalizedDomainName] ??
                undefined,
              errorReason: f.error?.message || 'Unknown error',
              actionRequired: determineActionRequired(
                f.error?.message || 'Unknown error',
              ),
            });
          }

          // Deferred-insufficient-balance domains (partial-renewal branch).
          for (const d of r.domainsSkippedDueToInsufficientFunds ?? []) {
            domains.push({
              domain: d.normalizedDomainName,
              registrar: d.registrarKey,
              chainId: d.chainId,
              status: 'SKIPPED_INSUFFICIENT_FUNDS',
              chargeAmountUsd:
                r.chargeAmountByDomainLdh?.[d.normalizedDomainName] ??
                undefined,
              errorReason:
                typeof r.shortfallInUsdCents === 'number'
                  ? `Deferred — short by $${(r.shortfallInUsdCents / 100).toFixed(2)}`
                  : 'Deferred — insufficient balance',
              actionRequired: 'Top up balance or wait for next cycle',
            });
          }

          if (r.paymentStatus === 'FAILED' && r.domainsThatCouldBeRenewed) {
            for (const d of r.domainsThatCouldBeRenewed) {
              if (isInsufficientBalance) {
                domains.push({
                  domain: d.normalizedDomainName,
                  registrar: d.registrarKey,
                  chainId: d.chainId,
                  status: 'SKIPPED_INSUFFICIENT_FUNDS',
                  chargeAmountUsd:
                    r.chargeAmountByDomainLdh?.[d.normalizedDomainName] ??
                    undefined,
                  errorReason: `Deferred — short by $${(r.shortfallInUsdCents! / 100).toFixed(2)}`,
                  actionRequired: 'Top up balance or wait for next cycle',
                });
              } else {
                domains.push({
                  domain: d.normalizedDomainName,
                  registrar: d.registrarKey,
                  chainId: d.chainId,
                  status: 'PAYMENT_FAILED',
                  chargeAmountUsd:
                    r.chargeAmountByDomainLdh?.[d.normalizedDomainName] ??
                    undefined,
                  errorReason: r.message || 'Payment failed',
                  actionRequired: 'Contact user about payment',
                });
              }
            }
          }

          for (const d of r.domainsMissingPriceData ?? []) {
            domains.push({
              domain: d.normalizedDomainName,
              registrar: d.registrarKey,
              chainId: d.chainId,
              status: 'MISSING_PRICE',
              errorReason: 'Missing price data',
              actionRequired: 'Check pricing data',
            });
          }

          // Invariant check: if the workflow output suggests deferred
          // state (non-empty skipped list or positive shortfall) we
          // expect at least one SKIPPED_INSUFFICIENT_FUNDS row to have
          // landed in `domains`. Log a structured warning if the two
          // disagree — makes a silent hole observable next time it
          // surfaces.
          const expectsDeferredRows =
            (r.domainsSkippedDueToInsufficientFunds?.length ?? 0) > 0 ||
            (typeof r.shortfallInUsdCents === 'number' &&
              r.shortfallInUsdCents > 0);
          const emittedDeferredRows = domains.filter(
            (d) => d.status === 'SKIPPED_INSUFFICIENT_FUNDS',
          ).length;
          if (expectsDeferredRows && emittedDeferredRows === 0) {
            autoRenewalLogger.warn(
              {
                workflowId,
                userId: success.userId,
                shortfallInUsdCents: r.shortfallInUsdCents,
                skippedLen: r.domainsSkippedDueToInsufficientFunds?.length ?? 0,
                couldBeRenewedLen: r.domainsThatCouldBeRenewed?.length ?? 0,
                paymentStatus: r.paymentStatus,
              },
              'Deferred rows expected but none emitted in admin userResults.domains',
            );
          }

          userResults.push({
            userId: success.userId,
            userEmail: r.userEmail,
            paymentStatus: r.paymentStatus,
            totalAmountInUsd: r.totalAmountInUsd,
            refundAmountInUsd: r.refundAmountInUsd ?? undefined,
            orderId: r.orderId ?? undefined,
            availableBalanceInNfsc: r.availableBalanceInNfsc,
            nfscBalancesByChain: r.nfscBalancesByChain,
            availablePaymentMethods: r.availablePaymentMethods,
            shortfallInUsdCents: r.shortfallInUsdCents,
            snapshotTakenAt: r.snapshotTakenAt,
            domains,
            // Note: the workflow returns these objects with `provider` (not
            // `paymentProvider`) — fall back to either to be defensive.
            payments: (r.payments ?? []).map((p) => {
              const dbId = p.paymentId ?? p.id;
              return {
                provider: p.provider ?? p.paymentProvider ?? 'UNKNOWN',
                amountInUsdCents: p.amountInUsdCents,
                walletAddress: p.walletAddress,
                stripeLast4: p.stripeLast4,
                paymentProviderReferenceId:
                  (dbId ? paymentRefById[dbId] : null) ?? undefined,
              };
            }),
          });
        }

        // Workflow-level failures (entire child workflow crashed)
        for (const failure of rawResult.failures ?? []) {
          workflowResults.push({
            userId: failure.userId,
            status: 'failure',
            domainsProcessed: 0,
            amountChargedInUsd: 0,
            amountRefundedInUsd: 0,
            failures: [
              {
                domain: 'Unknown' as any,
                reason: `Workflow failed: ${failure.error?.message || 'Unknown error'}`,
              },
            ],
          });

          userResults.push({
            userId: failure.userId,
            paymentStatus: 'FAILED',
            totalAmountInUsd: 0,
            domains: [
              {
                domain: 'Unknown',
                status: 'FAILED',
                errorReason: `Workflow failed: ${failure.error?.message || 'Unknown error'}`,
                actionRequired: 'Manual investigation required',
              },
            ],
            payments: [],
          });
        }

        // Compute full metrics
        const metrics = computeAutoRenewMetricsFromResults(
          workflowResults,
          rawResult.executionTime,
          (rawResult.successes ?? []).length,
        );

        return {
          ...base,
          metrics,
          userResults,
        };
      } catch (error) {
        autoRenewalLogger.error(
          { workflowId, error },
          'Failed to fetch auto-renewal workflow by ID',
        );
        return { exists: false as const, workflowId };
      }
    }),
});

// ─── Run-config extraction ──────────────────────────────────────

type RunConfig = {
  runType: 'scheduled' | 'manual' | 'unknown';
  scheduleId?: string;
  scheduledStartTime?: Date;
  input?: {
    dryRun?: boolean;
    forceSendReport?: boolean;
    allowExpired?: boolean;
    ownersIdFilter?: string[];
    overrideRecipientEmail?: string;
  };
};

/**
 * Extract run type + input args from a Temporal workflow handle.
 *
 * - `runType` comes from the `TemporalScheduledById` search attribute
 *   (Temporal auto-populates it for schedule-triggered runs).
 * - `input` comes from the first history event's payload, decoded via
 *   the default payload converter (same one `handle.result()` uses).
 *
 * Best-effort: any failure returns `{ runType: 'unknown' }` rather than
 * throwing, so a malformed/legacy history doesn't 500 the endpoint.
 */
async function extractRunConfig(
  handle: Awaited<ReturnType<typeof temporalClient.workflow.getHandle>>,
  desc: Awaited<ReturnType<typeof handle.describe>>,
): Promise<RunConfig> {
  const runConfig: RunConfig = { runType: 'unknown' };

  try {
    const searchAttrs = (desc.searchAttributes ?? {}) as Record<
      string,
      unknown
    >;
    const scheduleIdAttr = searchAttrs.TemporalScheduledById;
    const scheduledStartTimeAttr = searchAttrs.TemporalScheduledStartTime;

    if (scheduleIdAttr) {
      runConfig.runType = 'scheduled';
      const first = Array.isArray(scheduleIdAttr)
        ? scheduleIdAttr[0]
        : scheduleIdAttr;
      if (typeof first === 'string') runConfig.scheduleId = first;
    } else {
      runConfig.runType = 'manual';
    }

    if (scheduledStartTimeAttr) {
      const first = Array.isArray(scheduledStartTimeAttr)
        ? scheduledStartTimeAttr[0]
        : scheduledStartTimeAttr;
      const parsed =
        first instanceof Date
          ? first
          : typeof first === 'string' || typeof first === 'number'
            ? new Date(first)
            : null;
      if (parsed && !Number.isNaN(parsed.getTime())) {
        runConfig.scheduledStartTime = parsed;
      }
    }
  } catch (error) {
    autoRenewalLogger.debug(
      { workflowId: desc.workflowId, error },
      'Failed to read searchAttributes for runConfig',
    );
  }

  try {
    const history = await handle.fetchHistory();
    const startedEvent = history.events?.find(
      (e) => e.workflowExecutionStartedEventAttributes != null,
    );
    const payloads =
      startedEvent?.workflowExecutionStartedEventAttributes?.input?.payloads;
    if (payloads && payloads.length > 0) {
      // Workflow takes a single options object; decode the first payload.
      const decoded = defaultPayloadConverter.fromPayload<unknown>(payloads[0]);
      if (decoded && typeof decoded === 'object') {
        const raw = decoded as Record<string, unknown>;
        const input: RunConfig['input'] = {};
        if (typeof raw.dryRun === 'boolean') input.dryRun = raw.dryRun;
        if (typeof raw.forceSendReport === 'boolean')
          input.forceSendReport = raw.forceSendReport;
        if (typeof raw.allowExpired === 'boolean')
          input.allowExpired = raw.allowExpired;
        if (Array.isArray(raw.ownersIdFilter)) {
          input.ownersIdFilter = raw.ownersIdFilter.filter(
            (x): x is string => typeof x === 'string',
          );
        }
        if (typeof raw.overrideRecipientEmail === 'string') {
          input.overrideRecipientEmail = raw.overrideRecipientEmail;
        }
        if (Object.keys(input).length > 0) runConfig.input = input;
      }
    }
  } catch (error) {
    autoRenewalLogger.debug(
      { workflowId: desc.workflowId, error },
      'Failed to decode workflow input for runConfig',
    );
  }

  return runConfig;
}

// ─── Internal types ──────────────────────────────────────────────

/**
 * Flattened per-user result for the admin detail view.
 */
type UserResultForAdmin = {
  userId: string;
  userEmail?: string;
  paymentStatus: string;
  totalAmountInUsd: number;
  refundAmountInUsd?: number;
  orderId?: string;
  /** NFSC balance available at workflow start (USD, summed across chains). */
  availableBalanceInNfsc?: number;
  /** Per-(wallet, chain) USD balance at workflow start. */
  nfscBalancesByChain?: Array<{
    walletAddress: string;
    chainId: number;
    balanceInUsd: number | null;
  }>;
  /** Payment methods available at workflow start (NFSC wallets + Stripe). */
  availablePaymentMethods?: Array<
    | { kind: 'NFSC_WALLET'; walletAddress: string }
    | { kind: 'STRIPE'; last4: string | null; paymentMethodId: string }
  >;
  /** USD cents short of covering the full original renewal bill. */
  shortfallInUsdCents?: number;
  /** ISO timestamp when the snapshot was taken. */
  snapshotTakenAt?: string;
  domains: Array<{
    domain: string;
    registrar?: string;
    chainId?: number;
    status:
      | 'SUCCESS'
      | 'FAILED'
      | 'PAYMENT_FAILED'
      | 'MISSING_PRICE'
      | 'SKIPPED_INSUFFICIENT_FUNDS';
    chargeAmountUsd?: number | null;
    errorReason?: string;
    actionRequired?: string;
    txHash?: string;
    eppOperationStatus?: string;
  }>;
  payments: Array<{
    provider: string;
    /** Amount in USD cents (1 USD = 100 cents). */
    amountInUsdCents: number;
    walletAddress?: string;
    stripeLast4?: string;
    /**
     * Provider-specific external reference.
     * - Stripe: Payment Intent ID (e.g. `pi_...`)
     * - NFSC / X402 / MPP: on-chain transaction hash
     */
    paymentProviderReferenceId?: string;
  }>;
};

/**
 * Shape of SingleUserRenewalResult as returned by the Temporal workflow.
 * Typed loosely to avoid importing workflow-internal types.
 */
type SingleUserResult = {
  userId: string;
  userEmail?: string;
  domainsThatCouldBeRenewed?: Array<{
    normalizedDomainName: string;
    registrarKey?: string;
    chainId?: number;
  }>;
  domainsMissingPriceData?: Array<{
    normalizedDomainName: string;
    registrarKey?: string;
    chainId?: number;
  }>;
  domainsSkippedDueToInsufficientFunds?: Array<{
    normalizedDomainName: string;
    registrarKey?: string;
    chainId?: number;
  }>;
  shortfallInUsdCents?: number;
  // Per-user snapshot fields captured at workflow start.
  availableBalanceInNfsc?: number;
  nfscBalancesByChain?: Array<{
    walletAddress: string;
    chainId: number;
    balanceInUsd: number | null;
  }>;
  availablePaymentMethods?: Array<
    | { kind: 'NFSC_WALLET'; walletAddress: string }
    | { kind: 'STRIPE'; last4: string | null; paymentMethodId: string }
  >;
  snapshotTakenAt?: string;
  chargeAmountByDomainLdh?: Record<string, number | null>;
  totalAmountInUsd: number;
  paymentStatus: 'SUCCEEDED' | 'FAILED' | 'SKIPPED';
  /**
   * Note: the workflow's notify activity returns this array using `provider`
   * (not `paymentProvider`) and it never includes `paymentProviderReferenceId`,
   * so the only stable identifier we have here is `paymentId` (the database
   * row ID, used to enrich with the external reference via a follow-up query).
   */
  payments?: Array<{
    id?: string;
    provider?: string;
    paymentProvider?: string;
    amountInUsdCents: number;
    paymentId?: string;
    walletAddress?: string;
    stripeLast4?: string;
  }>;
  refundAmountInUsd?: number | null;
  orderId?: string | null;
  message?: string;
  successes?: Array<{
    domain: {
      normalizedDomainName: string;
      registrarKey?: string;
      chainId?: number;
    };
    result?: {
      eppOperationStatus?: string;
      txHash?: string;
      txStatus?: string;
    };
  }>;
  failures?: Array<{
    domain: {
      normalizedDomainName: string;
      registrarKey?: string;
      chainId?: number;
    };
    error?: { message?: string };
  }>;
};
