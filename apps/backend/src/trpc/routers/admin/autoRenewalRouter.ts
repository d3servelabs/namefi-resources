import { z } from 'zod';
import { logger } from '#lib/logger';
import { adminProcedureWithPermissions, createTRPCRouter } from '../../base';
import { Permission } from '@namefi-astra/utils';
import { temporalClient } from '#temporal/client';
import {
  computeAutoRenewMetricsFromResults,
  type AutoRenewReportInput,
} from '#temporal/activities/domain/autorenew-report.activities';
import { determineActionRequired } from '#temporal/shared/autorenew-utils';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import type { PaymentProvider } from '@namefi-astra/db/types';

const autoRenewalLogger = logger;

export const autoRenewalRouter = createTRPCRouter({
  /**
   * List all auto-renewal workflow runs (recent 90 days).
   * For completed runs, extract summary counts from the workflow result.
   */
  getAllAutoRenewalWorkflows: adminProcedureWithPermissions(
    Permission.READ_ORDERS,
  ).query(async () => {
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
                domainsFailed += s.result?.domainsMissingPriceData?.length ?? 0;

                totalRevenue +=
                  (s.result?.totalAmountInUsd ?? 0) -
                  (s.result?.refundAmountInUsd ?? 0);
              }

              summary = {
                totalUsers: childSuccesses.length + childFailures.length,
                successfulUsers,
                failedUsers,
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
    .input(z.object({ workflowId: z.string(), runId: z.string().optional() }))
    .query(async ({ input }) => {
      const { workflowId, runId } = input;

      try {
        await temporalClient.connection.ensureConnected();

        const handle = temporalClient.workflow.getHandle(workflowId, runId);
        const desc = await handle.describe();

        const base = {
          exists: true as const,
          workflowId: desc.workflowId,
          status: desc.status?.name || 'Unknown',
          startTime: desc.startTime ?? null,
          closeTime: desc.closeTime ?? null,
          runId: desc.runId,
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

        // Build workflowResults in the same format used by the report
        const workflowResults: AutoRenewReportInput['workflowResults'] = [];
        const userResults: UserResultForAdmin[] = [];

        for (const success of rawResult.successes ?? []) {
          const r = success.result;
          if (!r) continue;

          const processedDomains: AutoRenewReportInput['workflowResults'][number]['successes'] =
            [];
          const failedDomains: AutoRenewReportInput['workflowResults'][number]['failures'] =
            [];

          if (r.successes) {
            for (const s of r.successes) {
              processedDomains?.push({
                domain: s.domain.normalizedDomainName as NamefiNormalizedDomain,
                registrar: s.domain.registrarKey,
              });
            }
          }
          if (r.failures) {
            for (const f of r.failures) {
              failedDomains?.push({
                domain: f.domain.normalizedDomainName as NamefiNormalizedDomain,
                reason: f.error?.message || 'Unknown error',
                registrar: f.domain.registrarKey,
              });
            }
          }

          // Payment-failed domains
          if (r.paymentStatus === 'FAILED' && r.domainsThatCouldBeRenewed) {
            for (const d of r.domainsThatCouldBeRenewed) {
              failedDomains?.push({
                domain: d.normalizedDomainName as NamefiNormalizedDomain,
                reason: r.message || 'Payment failed',
                registrar: d.registrarKey,
              });
            }
          }

          // Missing price data
          for (const d of r.domainsMissingPriceData ?? []) {
            failedDomains?.push({
              domain: d.normalizedDomainName as NamefiNormalizedDomain,
              reason: 'Missing price data',
              registrar: d.registrarKey,
            });
          }

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
              (processedDomains?.length ?? 0) + (failedDomains?.length ?? 0),
            amountChargedInUsd: r.totalAmountInUsd || 0,
            amountRefundedInUsd: r.refundAmountInUsd || 0,
            payments: r.payments as
              | {
                  id: string;
                  paymentProvider: PaymentProvider;
                  amountInUsdCents: number;
                }[]
              | undefined,
            failures: failedDomains ?? undefined,
            successes: processedDomains ?? undefined,
            chargeAmountByDomainLdh: r.chargeAmountByDomainLdh,
          });

          // Build flattened domain rows for the admin UI
          const domains: UserResultForAdmin['domains'] = [];

          for (const s of r.successes ?? []) {
            domains.push({
              domain: s.domain.normalizedDomainName,
              registrar: s.domain.registrarKey,
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

          if (r.paymentStatus === 'FAILED' && r.domainsThatCouldBeRenewed) {
            for (const d of r.domainsThatCouldBeRenewed) {
              domains.push({
                domain: d.normalizedDomainName,
                registrar: d.registrarKey,
                status: 'PAYMENT_FAILED',
                chargeAmountUsd:
                  r.chargeAmountByDomainLdh?.[d.normalizedDomainName] ??
                  undefined,
                errorReason: r.message || 'Payment failed',
                actionRequired: 'Contact user about payment',
              });
            }
          }

          for (const d of r.domainsMissingPriceData ?? []) {
            domains.push({
              domain: d.normalizedDomainName,
              registrar: d.registrarKey,
              status: 'MISSING_PRICE',
              errorReason: 'Missing price data',
              actionRequired: 'Check pricing data',
            });
          }

          userResults.push({
            userId: success.userId,
            userEmail: r.userEmail,
            paymentStatus: r.paymentStatus,
            totalAmountInUsd: r.totalAmountInUsd,
            refundAmountInUsd: r.refundAmountInUsd ?? undefined,
            orderId: r.orderId ?? undefined,
            domains,
            payments: (r.payments ?? []).map((p) => ({
              provider: p.paymentProvider,
              amountInUsdCents: p.amountInUsdCents,
              walletAddress: p.walletAddress,
              stripeLast4: p.stripeLast4,
            })),
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
  domains: Array<{
    domain: string;
    registrar?: string;
    status: 'SUCCESS' | 'FAILED' | 'PAYMENT_FAILED' | 'MISSING_PRICE';
    chargeAmountUsd?: number | null;
    errorReason?: string;
    actionRequired?: string;
    txHash?: string;
    eppOperationStatus?: string;
  }>;
  payments: Array<{
    provider: string;
    amountInUsdCents: number;
    walletAddress?: string;
    stripeLast4?: string;
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
  }>;
  domainsMissingPriceData?: Array<{
    normalizedDomainName: string;
    registrarKey?: string;
  }>;
  chargeAmountByDomainLdh?: Record<string, number | null>;
  totalAmountInUsd: number;
  paymentStatus: 'SUCCEEDED' | 'FAILED' | 'SKIPPED';
  payments?: Array<{
    id: string;
    paymentProvider: string;
    amountInUsdCents: number;
    paymentId: string;
    walletAddress?: string;
    stripeLast4?: string;
  }>;
  refundAmountInUsd?: number | null;
  orderId?: string | null;
  message?: string;
  successes?: Array<{
    domain: { normalizedDomainName: string; registrarKey?: string };
    result?: {
      eppOperationStatus?: string;
      txHash?: string;
      txStatus?: string;
    };
  }>;
  failures?: Array<{
    domain: { normalizedDomainName: string; registrarKey?: string };
    error?: { message?: string };
  }>;
};
