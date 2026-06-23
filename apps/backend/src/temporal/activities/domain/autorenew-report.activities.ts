import { Context } from '@temporalio/activity';
import { format } from 'date-fns';
import type { PaymentProvider, PaymentSelect } from '@namefi-astra/db/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { formatDomainNameForDisplay } from '@namefi-astra/registrars/data/validations';
import { secrets } from '#lib/env';
import { sendMail } from '../../../mail/mail-client';
import { createElement } from 'react';
import { render } from '@react-email/components';
import { AutoRenewDailyReport } from '../../../mail/templates/autorenew-daily-report';
import { AutoRenewDailyReportDetailed } from '../../../mail/templates/autorenew-daily-report-detailed';
import type {
  AutoRenewDailyReportDetailedProps,
  AutoRenewDailyReportProps,
  AutoRenewDomainEntry,
  AutoRenewReportSummary,
  AutoRenewSnapshotCategory,
  AutoRenewUserCard,
} from '../../../mail/templates/autorenew-daily-report.types';
import {
  generateAutoRenewReportCsv,
  generateAutoRenewReportMarkdown,
} from './autorenew-report-attachments.activities';
import {
  determineActionRequired,
  isPaymentFailure,
} from '../../shared/autorenew-utils';

const SEND_TO_SLACK_DIRECT = false;

/**
 * Per-domain category, computed once during orchestration from the typed
 * workflow result. Downstream (email, CSV, HTML, admin UI) reads the
 * category directly instead of re-deriving from `successes[]` /
 * `failures[]` / reason strings.
 */
export type AutoRenewDomainCategory =
  | 'renewed'
  | 'registrarFailed'
  | 'paymentFailed'
  | 'deferredInsufficientBalance'
  | 'missingPrice';

/**
 * Per-user snapshot captured at the *start* of the renewal run.
 *
 * Duplicated here (structurally) from
 * `apps/backend/src/temporal/workflows/autorenew-daily-emails.workflow.ts`'s
 * `PerUserRunSnapshot` rather than imported, because the workflow
 * bundle must not pull activity-file imports, and this file is used by
 * both the activity bundle and the admin tRPC router.
 */
export interface AutoRenewUserSnapshot {
  availableBalanceInNfsc: number;
  nfscBalancesByChain: Array<{
    walletAddress: string;
    chainId: number;
    balanceInUsd: number | null;
  }>;
  availablePaymentMethods: Array<
    | { kind: 'NFSC_WALLET'; walletAddress: string }
    | { kind: 'STRIPE'; last4: string | null; paymentMethodId: string }
  >;
  snapshotTakenAt: string;
}

export interface AutoRenewMetrics {
  reportDate: Date;
  totalUsersProcessed: number;
  totalDomainsProcessed: number;
  successfulRenewals: number;
  failedRenewals: number;
  totalAmountChargedInUsd: number;
  totalAmountRefundedInUsd: number;
  paymentMethodBreakdown: Record<
    PaymentProvider,
    {
      count: number;
      amountInUsd: number;
    }
  >;
  failureBreakdown: {
    failedToCharge: number;
    registrarErrors: number;
    missingPriceData: number;
    /** NEW: domains deferred because NFSC balance ran out this cycle. */
    deferredInsufficientBalance: number;
  };
  /** NEW: sum of per-user `shortfallInUsdCents` across users with a shortfall. */
  totalShortfallInUsdCents: number;
  /** NEW: sum of per-user `availableBalanceInNfsc` (USD) at run start. */
  totalNfscBalanceInUsdAtRunStart: number;
  /** NEW: count of users where balance did not cover their renewal bill. */
  usersWithInsufficientBalance: number;
  criticalDomains: Array<{
    domain: NamefiNormalizedDomain;
    userId: string;
    userEmail?: string;
    issue: string;
    registrar?: string;
    expirationDate?: Date;
    actionRequired: string;
  }>;
  userCommunication: {
    upcomingRenewalNotifications: number;
    successfulRenewalConfirmations: number;
    failedRenewalAlerts: number;
    paymentFailureNotifications: number;
  };
  executionMetrics: {
    totalExecutionTime: number;
    averageTimePerUser: number;
    childWorkflowsSpawned: number;
  };
  registrarBreakdown: Record<
    string,
    {
      successful: number;
      failed: number;
    }
  >;
  largestTransaction: {
    userId: string;
    amount: number;
    domainCount: number;
  };
  domainsInTransferPeriod?: number;
  domainsInAddPeriod?: number;
  lockedDomains?: number;
  domainLockStatus?: Record<
    NamefiNormalizedDomain,
    {
      isTransferPeriod: boolean;
      isAddPeriod: boolean;
      locked: boolean;
      error?: boolean;
    }
  >;
  comparisonWithPreviousDay?: {
    renewalsDiff: number;
    revenueDiff: number;
    failuresDiff: number;
    successRateDiff: number;
  };
}

/** Per-user entry inside the `AutoRenewReportInput.workflowResults` array. */
export interface AutoRenewWorkflowResultEntry {
  userId: string;
  userEmail?: string;
  status: 'success' | 'failure' | 'skipped';
  domainsProcessed?: number;
  amountChargedInUsd?: number;
  amountRefundedInUsd?: number;
  /** Total USD the user was billed this cycle (successes + deferred would-be). */
  totalAmountInUsd?: number;
  /** USD cents the user was short of covering the full original renewal bill. */
  shortfallInUsdCents?: number;
  /** Snapshot taken at workflow start — balance, payment methods available. */
  snapshot?: AutoRenewUserSnapshot;
  payments?: {
    id: string;
    paymentProvider: PaymentProvider;
    amountInUsdCents: number;
  }[];
  failures?: {
    domain: NamefiNormalizedDomain;
    reason: string;
    registrar?: string;
  }[];
  successes?: {
    domain: NamefiNormalizedDomain;
    registrar?: string;
  }[];
  /** Per-domain charge amounts in USD (keyed by normalized domain name) */
  chargeAmountByDomainLdh?: Record<string, number | null>;
  /**
   * Pre-categorized domain outcomes. Authoritative for the new typed
   * email/attachment/admin-UI rendering. The legacy `failures[]` /
   * `successes[]` arrays are kept for the Markdown formatter back-compat
   * but downstream typed consumers should prefer this.
   */
  domainCategories?: {
    renewed: Array<{
      domain: NamefiNormalizedDomain;
      registrar?: string;
      chargeAmountInUsd: number | null;
    }>;
    registrarFailed: Array<{
      domain: NamefiNormalizedDomain;
      registrar?: string;
      reason: string;
      chargeAmountInUsd: number | null;
    }>;
    paymentFailed: Array<{
      domain: NamefiNormalizedDomain;
      registrar?: string;
      reason: string;
      chargeAmountInUsd: number | null;
    }>;
    deferredInsufficientBalance: Array<{
      domain: NamefiNormalizedDomain;
      registrar?: string;
      chargeAmountInUsd: number | null;
    }>;
    missingPrice: Array<{
      domain: NamefiNormalizedDomain;
      registrar?: string;
    }>;
  };
}

export interface AutoRenewReportInput {
  metrics: AutoRenewMetrics;
  workflowResults: AutoRenewWorkflowResultEntry[];
}

/**
 * Pure function to compute auto-renewal metrics from workflow results.
 *
 * Can be called from both activity code and the admin tRPC router
 * (not from workflow code — use via the `collectAutoRenewMetrics` activity).
 */
export function computeAutoRenewMetricsFromResults(
  workflowResults: AutoRenewReportInput['workflowResults'],
  executionTime: number,
  upcomingRenewalNotifications: number,
): AutoRenewMetrics {
  const metrics: AutoRenewMetrics = {
    reportDate: new Date(),
    totalUsersProcessed: workflowResults.length,
    totalDomainsProcessed: 0,
    successfulRenewals: 0,
    failedRenewals: 0,
    totalAmountChargedInUsd: 0,
    totalAmountRefundedInUsd: 0,
    paymentMethodBreakdown: {} as Record<
      PaymentProvider,
      { count: number; amountInUsd: number }
    >,
    failureBreakdown: {
      failedToCharge: 0,
      registrarErrors: 0,
      missingPriceData: 0,
      deferredInsufficientBalance: 0,
    },
    totalShortfallInUsdCents: 0,
    totalNfscBalanceInUsdAtRunStart: 0,
    usersWithInsufficientBalance: 0,
    criticalDomains: [],
    userCommunication: {
      upcomingRenewalNotifications,
      successfulRenewalConfirmations: 0,
      failedRenewalAlerts: 0,
      paymentFailureNotifications: 0,
    },
    executionMetrics: {
      totalExecutionTime: executionTime,
      averageTimePerUser:
        workflowResults.length > 0 ? executionTime / workflowResults.length : 0,
      childWorkflowsSpawned: workflowResults.length,
    },
    registrarBreakdown: {},
    largestTransaction: {
      userId: '',
      amount: 0,
      domainCount: 0,
    },
  };

  for (const result of workflowResults) {
    metrics.totalDomainsProcessed += result.domainsProcessed || 0;
    metrics.totalAmountChargedInUsd +=
      result.status === 'success' ? result.amountChargedInUsd || 0 : 0;
    metrics.totalAmountRefundedInUsd += result.amountRefundedInUsd || 0;

    // Snapshot aggregates (when orchestration supplied them)
    if (result.snapshot) {
      metrics.totalNfscBalanceInUsdAtRunStart +=
        result.snapshot.availableBalanceInNfsc;
    }
    if (result.shortfallInUsdCents && result.shortfallInUsdCents > 0) {
      metrics.totalShortfallInUsdCents += result.shortfallInUsdCents;
      metrics.usersWithInsufficientBalance += 1;
    }

    // Prefer typed `domainCategories` when the orchestration layer
    // supplied them. Falls back to reason-string regex / legacy arrays
    // for callers that still populate only `failures[]` / `successes[]`.
    if (result.domainCategories) {
      const cats = result.domainCategories;
      metrics.successfulRenewals += cats.renewed.length;
      for (const entry of cats.renewed) {
        const registrar = entry.registrar || 'Unknown';
        if (!metrics.registrarBreakdown[registrar]) {
          metrics.registrarBreakdown[registrar] = { successful: 0, failed: 0 };
        }
        metrics.registrarBreakdown[registrar].successful++;
      }
      metrics.failureBreakdown.registrarErrors += cats.registrarFailed.length;
      metrics.failureBreakdown.failedToCharge += cats.paymentFailed.length;
      metrics.failureBreakdown.missingPriceData += cats.missingPrice.length;
      metrics.failureBreakdown.deferredInsufficientBalance +=
        cats.deferredInsufficientBalance.length;
      metrics.failedRenewals +=
        cats.registrarFailed.length +
        cats.paymentFailed.length +
        cats.deferredInsufficientBalance.length +
        cats.missingPrice.length;

      for (const entry of cats.registrarFailed) {
        const registrar = entry.registrar || 'Unknown';
        if (!metrics.registrarBreakdown[registrar]) {
          metrics.registrarBreakdown[registrar] = { successful: 0, failed: 0 };
        }
        metrics.registrarBreakdown[registrar].failed++;
        metrics.criticalDomains.push({
          domain: entry.domain,
          userId: result.userId,
          userEmail: result.userEmail,
          issue: entry.reason,
          registrar: entry.registrar,
          actionRequired: determineActionRequired(entry.reason),
        });
      }
      for (const entry of cats.missingPrice) {
        metrics.criticalDomains.push({
          domain: entry.domain,
          userId: result.userId,
          userEmail: result.userEmail,
          issue: 'Missing price data',
          registrar: entry.registrar,
          actionRequired: 'Check pricing data',
        });
      }
      // paymentFailed and deferredInsufficientBalance are user-side,
      // not ops-actionable — excluded from `criticalDomains`.
    } else if (result.failures) {
      // Legacy path: bucket via reason-string regex.
      metrics.failedRenewals += result.failures.length;
      for (const failure of result.failures) {
        const registrar = failure.registrar || 'Unknown';
        if (!metrics.registrarBreakdown[registrar]) {
          metrics.registrarBreakdown[registrar] = { successful: 0, failed: 0 };
        }
        metrics.registrarBreakdown[registrar].failed++;

        if (isPaymentFailure(failure.reason)) {
          metrics.failureBreakdown.failedToCharge++;
        } else if (failure.reason.toLowerCase().includes('price')) {
          metrics.failureBreakdown.missingPriceData++;
        } else {
          metrics.failureBreakdown.registrarErrors++;
        }
        if (!isPaymentFailure(failure.reason)) {
          metrics.criticalDomains.push({
            domain: failure.domain,
            userId: result.userId,
            userEmail: result.userEmail,
            issue: failure.reason,
            registrar: failure.registrar,
            actionRequired: determineActionRequired(failure.reason),
          });
        }
      }
    }

    // Payment methods
    if (result.payments && result.amountChargedInUsd) {
      for (const { paymentProvider, amountInUsdCents } of result.payments) {
        if (!metrics.paymentMethodBreakdown[paymentProvider]) {
          metrics.paymentMethodBreakdown[paymentProvider] = {
            count: 0,
            amountInUsd: 0,
          };
        }
        metrics.paymentMethodBreakdown[paymentProvider].count++;
        metrics.paymentMethodBreakdown[paymentProvider].amountInUsd +=
          amountInUsdCents / 100;
      }
    }

    // Largest transaction
    if (
      result.amountChargedInUsd &&
      result.amountChargedInUsd > metrics.largestTransaction.amount
    ) {
      metrics.largestTransaction = {
        userId: result.userId,
        amount: result.amountChargedInUsd,
        domainCount: result.domainsProcessed || 0,
      };
    }

    // Communication counts
    if (result.status === 'success' && result.userEmail) {
      metrics.userCommunication.successfulRenewalConfirmations++;
    } else if (result.status === 'failure' && result.userEmail) {
      if (result.failures?.some((f) => isPaymentFailure(f.reason))) {
        metrics.userCommunication.paymentFailureNotifications++;
      } else {
        metrics.userCommunication.failedRenewalAlerts++;
      }
    }
  }

  // Sort critical domains by urgency
  const urgencyOrder = [
    'Check pricing data',
    'Unlock domain and retry',
    'Retry renewal',
    'Check registrar API',
    'Wait for transfer period to end',
    'Domain already expired',
    'Contact user about payment',
    'Manual investigation required',
  ];
  metrics.criticalDomains.sort(
    (a, b) =>
      urgencyOrder.indexOf(a.actionRequired) -
      urgencyOrder.indexOf(b.actionRequired),
  );

  return metrics;
}

/**
 * Build the summary email props from the raw report input + computed
 * metrics. Pure — safe to call from both the activity and the admin
 * tRPC router. Email body focuses on aggregate counts; per-category
 * tables are capped by the template itself.
 */
export function buildAutoRenewReportProps(
  input: AutoRenewReportInput,
  metrics: AutoRenewMetrics,
  options: {
    adminUrl?: string;
    attachmentNote?: string;
  } = {},
): AutoRenewDailyReportProps {
  const reportDate = format(metrics.reportDate ?? new Date(), 'yyyy-MM-dd');
  const title = `${reportDate} Auto-Renewal Daily Report`;

  const categorized: Record<AutoRenewSnapshotCategory, AutoRenewDomainEntry[]> =
    {
      renewed: [],
      registrarFailed: [],
      paymentFailed: [],
      deferredInsufficientBalance: [],
      missingPrice: [],
    };

  const renewedTotalUsd = { value: 0 };
  const paymentFailedTotalUsd = { value: 0 };
  const deferredTotalUsd = { value: 0 };

  for (const result of input.workflowResults) {
    if (!result.domainCategories) continue;
    const userRef = {
      userId: result.userId,
      userEmail: result.userEmail,
    };

    for (const entry of result.domainCategories.renewed) {
      categorized.renewed.push({
        ...userRef,
        normalizedDomainName: entry.domain,
        registrarKey: entry.registrar,
        chargeAmountInUsd: entry.chargeAmountInUsd,
      });
      renewedTotalUsd.value += entry.chargeAmountInUsd ?? 0;
    }
    for (const entry of result.domainCategories.registrarFailed) {
      categorized.registrarFailed.push({
        ...userRef,
        normalizedDomainName: entry.domain,
        registrarKey: entry.registrar,
        chargeAmountInUsd: entry.chargeAmountInUsd,
        reason: entry.reason,
      });
    }
    for (const entry of result.domainCategories.paymentFailed) {
      categorized.paymentFailed.push({
        ...userRef,
        normalizedDomainName: entry.domain,
        registrarKey: entry.registrar,
        chargeAmountInUsd: entry.chargeAmountInUsd,
        reason: entry.reason,
      });
      paymentFailedTotalUsd.value += entry.chargeAmountInUsd ?? 0;
    }
    for (const entry of result.domainCategories.deferredInsufficientBalance) {
      categorized.deferredInsufficientBalance.push({
        ...userRef,
        normalizedDomainName: entry.domain,
        registrarKey: entry.registrar,
        chargeAmountInUsd: entry.chargeAmountInUsd,
      });
      deferredTotalUsd.value += entry.chargeAmountInUsd ?? 0;
    }
    for (const entry of result.domainCategories.missingPrice) {
      categorized.missingPrice.push({
        ...userRef,
        normalizedDomainName: entry.domain,
        registrarKey: entry.registrar,
        chargeAmountInUsd: null,
      });
    }
  }

  const summary: AutoRenewReportSummary = {
    reportDate,
    totalUsersProcessed: metrics.totalUsersProcessed,
    totalDomainsProcessed: metrics.totalDomainsProcessed,
    renewed: {
      total: metrics.successfulRenewals,
      totalUsd: renewedTotalUsd.value,
    },
    registrarFailed: { total: metrics.failureBreakdown.registrarErrors },
    paymentFailed: {
      total: metrics.failureBreakdown.failedToCharge,
      totalUsd: paymentFailedTotalUsd.value,
    },
    deferredInsufficientBalance: {
      total: metrics.failureBreakdown.deferredInsufficientBalance,
      totalUsd: deferredTotalUsd.value,
      totalShortfallInUsd: metrics.totalShortfallInUsdCents / 100,
      usersAffected: metrics.usersWithInsufficientBalance,
    },
    missingPrice: { total: metrics.failureBreakdown.missingPriceData },
    totalChargedInUsd: metrics.totalAmountChargedInUsd,
    totalRefundedInUsd: metrics.totalAmountRefundedInUsd,
    totalNfscBalanceInUsdAtRunStart: metrics.totalNfscBalanceInUsdAtRunStart,
    executionTimeMs: metrics.executionMetrics.totalExecutionTime,
  };

  return {
    title,
    summary,
    categorized,
    meta: {
      reportDate,
      generatedAt: new Date().toISOString(),
      adminUrl:
        options.adminUrl ?? 'https://astra.namefi.io/admin/auto-renewal',
      attachmentNote: options.attachmentNote,
    },
  };
}

/**
 * Build the detailed HTML-attachment props. Extends the summary props
 * with a full per-user card array (no cap).
 */
export function buildAutoRenewDetailedProps(
  input: AutoRenewReportInput,
  metrics: AutoRenewMetrics,
  options: {
    adminUrl?: string;
    attachmentNote?: string;
  } = {},
): AutoRenewDailyReportDetailedProps {
  const summaryProps = buildAutoRenewReportProps(input, metrics, options);

  const users: AutoRenewUserCard[] = input.workflowResults
    .filter((r) => r.snapshot)
    .map((result) => {
      const cats = result.domainCategories ?? {
        renewed: [],
        registrarFailed: [],
        paymentFailed: [],
        deferredInsufficientBalance: [],
        missingPrice: [],
      };
      const userRef = {
        userId: result.userId,
        userEmail: result.userEmail,
      };
      return {
        userId: result.userId,
        userEmail: result.userEmail,
        paymentStatus:
          result.status === 'success'
            ? 'SUCCEEDED'
            : result.status === 'failure'
              ? 'FAILED'
              : 'SKIPPED',
        availableBalanceInUsd: result.snapshot!.availableBalanceInNfsc,
        nfscBalancesByChain: result.snapshot!.nfscBalancesByChain,
        availablePaymentMethods: result.snapshot!.availablePaymentMethods,
        totalBilledInUsd: result.totalAmountInUsd ?? 0,
        shortfallInUsdCents: result.shortfallInUsdCents,
        snapshotTakenAt: result.snapshot!.snapshotTakenAt,
        domainsByCategory: {
          renewed: cats.renewed.map((entry) => ({
            ...userRef,
            normalizedDomainName: entry.domain,
            registrarKey: entry.registrar,
            chargeAmountInUsd: entry.chargeAmountInUsd,
          })),
          registrarFailed: cats.registrarFailed.map((entry) => ({
            ...userRef,
            normalizedDomainName: entry.domain,
            registrarKey: entry.registrar,
            chargeAmountInUsd: entry.chargeAmountInUsd,
            reason: entry.reason,
          })),
          paymentFailed: cats.paymentFailed.map((entry) => ({
            ...userRef,
            normalizedDomainName: entry.domain,
            registrarKey: entry.registrar,
            chargeAmountInUsd: entry.chargeAmountInUsd,
            reason: entry.reason,
          })),
          deferredInsufficientBalance: cats.deferredInsufficientBalance.map(
            (entry) => ({
              ...userRef,
              normalizedDomainName: entry.domain,
              registrarKey: entry.registrar,
              chargeAmountInUsd: entry.chargeAmountInUsd,
            }),
          ),
          missingPrice: cats.missingPrice.map((entry) => ({
            ...userRef,
            normalizedDomainName: entry.domain,
            registrarKey: entry.registrar,
            chargeAmountInUsd: null,
          })),
        },
      };
    });

  return {
    ...summaryProps,
    title: `${summaryProps.title} — Detailed`,
    users,
  };
}

/**
 * Collect comprehensive metrics from auto-renewal workflow results
 */
export async function collectAutoRenewMetrics(
  input: AutoRenewReportInput,
): Promise<AutoRenewMetrics> {
  const ctx = Context.current();
  ctx.log.info('Collecting auto-renewal metrics');

  // Delegate to the pure function, preserving execution metrics and
  // upcomingRenewalNotifications from the pre-built metrics if available.
  const metrics = computeAutoRenewMetricsFromResults(
    input.workflowResults,
    input.metrics?.executionMetrics?.totalExecutionTime ?? 0,
    input.metrics?.userCommunication?.upcomingRenewalNotifications ?? 0,
  );

  ctx.log.info('Auto-renewal metrics collected successfully', { metrics });
  return metrics;
}

/**
 * Format the auto-renewal report for email/Slack
 */
export async function formatAutoRenewReport(
  metrics: AutoRenewMetrics,
): Promise<{ title: string; content: string }> {
  const ctx = Context.current();
  ctx.log.info('Formatting auto-renewal report');
  const dateStr = format(metrics.reportDate || new Date(), 'MMM do, yyyy');
  const title = `${dateStr} Auto-Renewal Daily Report`;

  const successRate =
    metrics.totalDomainsProcessed > 0
      ? (
          (metrics.successfulRenewals / metrics.totalDomainsProcessed) *
          100
        ).toFixed(1)
      : '0';

  const netRevenue =
    metrics.totalAmountChargedInUsd - metrics.totalAmountRefundedInUsd;

  // Build payment method breakdown
  let paymentBreakdown = '';
  for (const [method, data] of Object.entries(
    metrics.paymentMethodBreakdown || {},
  )) {
    const percentage =
      metrics.totalAmountChargedInUsd > 0
        ? ((data.amountInUsd / metrics.totalAmountChargedInUsd) * 100).toFixed(
            0,
          )
        : '0';
    paymentBreakdown += `- ${method}: $${data.amountInUsd.toFixed(2)} (${percentage}%)\n`;
  }

  // Build critical domains table
  let criticalDomainsTable = '';
  if (metrics.criticalDomains && metrics.criticalDomains.length > 0) {
    // Group by action required
    const criticalByAction: Record<string, typeof metrics.criticalDomains> = {};
    for (const domain of metrics.criticalDomains) {
      if (!criticalByAction[domain.actionRequired]) {
        criticalByAction[domain.actionRequired] = [];
      }
      criticalByAction[domain.actionRequired].push(domain);
    }

    for (const [action, domains] of Object.entries(criticalByAction)) {
      criticalDomainsTable += `\n### ${action} (${domains.length})\n\n`;
      criticalDomainsTable += '<div id="markdown-table">\n\n';
      criticalDomainsTable +=
        '| Domain | User | Issue | Registrar | Action |\n';
      criticalDomainsTable +=
        '|:------:|:----:|:-----:|:---------:|:------:|\n';

      // Show up to 10 domains per action type
      const displayDomains = domains.slice(0, 10);
      for (const domain of displayDomains) {
        const userDisplay = domain.userEmail || domain.userId;
        criticalDomainsTable += `| ${formatDomainNameForDisplay(domain.domain)} | ${userDisplay} | ${domain.issue.slice(0, 30)} | ${domain.registrar || 'Unknown'} | ${domain.actionRequired} |\n`;
      }

      if (domains.length > 10) {
        criticalDomainsTable += `\n*... and ${domains.length - 10} more domains requiring "${action}"*\n`;
      }

      criticalDomainsTable += '\n</div>\n';
    }
  }

  // Build registrar breakdown with proper names
  let registrarStats = '';
  for (const [registrar, stats] of Object.entries(
    metrics.registrarBreakdown || {},
  )) {
    const registrarDisplayName =
      registrar === 'dynadot_gdg'
        ? 'Dynadot (GDG)'
        : registrar === 'dynadot_regular'
          ? 'Dynadot (Regular)'
          : registrar === 'route53'
            ? 'Route 53'
            : registrar || 'Unknown';
    registrarStats += `- ${registrarDisplayName}: ${stats.successful} successful, ${stats.failed} failed\n`;
  }

  const content = `## 📊 Auto-Renewal Overview

- **Date:** ${dateStr}
- **Total Users With Domain Renewals Attempted:** ${metrics.totalUsersProcessed}
- **Total Domain Renewals Attempted :** ${metrics.totalDomainsProcessed}

### Failure Breakdown:
- **🔴 Failed to Charge:** ${metrics.failureBreakdown?.failedToCharge || 0} domains
- **🟡 Registrar Errors:** ${metrics.failureBreakdown?.registrarErrors || 0} domains
- **🟠 Missing Price Data:** ${metrics.failureBreakdown?.missingPriceData || 0} domains

## Successful Renewals

- **Domains Renewed:** ${metrics.successfulRenewals}

### Registrar Breakdown:
${registrarStats || '- No registrar data available'}


## 💰 Financial Summary

- **Total Amount Charged:** $${metrics.totalAmountChargedInUsd.toFixed(2)} USD
- **Total Amount Refunded:** $${metrics.totalAmountRefundedInUsd.toFixed(2)} USD
- **Net Revenue:** $${netRevenue.toFixed(2)} USD


## 🚨 Critical Issues Requiring Action

${
  metrics.criticalDomains && metrics.criticalDomains.length > 0
    ? criticalDomainsTable
    : '✅ No critical issues requiring immediate action.'
}

## 📋 User Communication

**Email Notifications Sent:**
- Upcoming renewal notifications: ${metrics.userCommunication?.upcomingRenewalNotifications || 0}
- Successful renewal confirmations: ${metrics.userCommunication?.successfulRenewalConfirmations || 0}
- Failed renewal alerts: ${metrics.userCommunication?.failedRenewalAlerts || 0}
- Payment failure notifications: ${metrics.userCommunication?.paymentFailureNotifications || 0}

## 🔒 Domain Lock & Transfer Status

**Domains in Transfer Period:** ${metrics.domainsInTransferPeriod || 0}
**Domains in Add Period:** ${metrics.domainsInAddPeriod || 0}
**Locked Domains:** ${metrics.lockedDomains || 0}

${metrics.domainsInTransferPeriod ? '⚠️ Domains in transfer period cannot be renewed immediately and may require special handling.' : ''}

## 🛠️ System Health

**Workflow Execution Time:** ${Math.floor((metrics.executionMetrics?.totalExecutionTime || 0) / 60000)}m ${Math.floor(((metrics.executionMetrics?.totalExecutionTime || 0) % 60000) / 1000)}s
**Average Processing Time per User:** ${((metrics.executionMetrics?.averageTimePerUser || 0) / 1000).toFixed(1)}s
**Child Workflows Spawned:** ${metrics.executionMetrics?.childWorkflowsSpawned || 0}

## 🎯 Action Items Priority

${
  metrics.criticalDomains && metrics.criticalDomains.length > 0
    ? `
1. **URGENT:** Process ${metrics.failureBreakdown?.missingPriceData || 0} domains with missing price data
2. **HIGH:** Investigate registrar errors for ${metrics.failureBreakdown?.registrarErrors || 0} domains
3. **MEDIUM:** Review ${metrics.failureBreakdown?.failedToCharge || 0} payment failures
4. **LOW:** Monitor successful renewals for any post-renewal issues
`
    : '✅ All renewals processed successfully - no action items required'
}

${
  metrics.largestTransaction && metrics.largestTransaction.amount > 0
    ? `
## 📈 Notable Transactions

**Largest Single Transaction:**
- User: ${metrics.largestTransaction.userId}
- Amount: $${metrics.largestTransaction.amount.toFixed(2)}
- Domains: ${metrics.largestTransaction.domainCount}
`
    : ''
}

---

*This report is generated automatically by the Auto-Renewal Daily Report workflow.*
*For detailed information, check the admin panel or Temporal workflow history.*`;

  return { title, content };
}
/**
 * Send auto-renewal report to Slack with note about email attachments
 * Note: Slack webhooks don't support file uploads. Files are sent via email.
 */
export async function sendAutoRenewReportToSlackWithAttachments(
  title: string,
  content: string,
  input: AutoRenewReportInput,
  metrics: AutoRenewMetrics,
): Promise<void> {
  if (!SEND_TO_SLACK_DIRECT) {
    return;
  }
  const ctx = Context.current();
  const webhookUrl = secrets.NAMEFI_ASSET_REPORT_SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    ctx.log.warn(
      'No Slack webhook URL configured, skipping Slack notification',
    );
    return;
  }

  try {
    const blocks = getSlackTextBlocks(content);
    const dateStr = format(metrics.reportDate || new Date(), 'yyyy-MM-dd');

    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: title,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📎 *Detailed reports with full data have been sent via email*\n\nAttachments include:\n• \`autorenew-report-${dateStr}.csv\` - Complete transaction data\n• \`autorenew-report-${dateStr}-detailed.md\` - Full detailed report\n\n---\n`,
          },
        },
        ...blocks,
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    ctx.log.info(
      'Successfully sent auto-renewal report to Slack with attachment notice',
    );
  } catch (error) {
    ctx.log.error('Failed to send auto-renewal report to Slack', { error });
    throw error;
  }
}

/**
 * Send auto-renewal report to Slack via webhook (no attachments)
 */
export async function sendAutoRenewReportToSlack(
  title: string,
  content: string,
): Promise<void> {
  if (!SEND_TO_SLACK_DIRECT) {
    return;
  }
  const ctx = Context.current();
  const webhookUrl = secrets.NAMEFI_ASSET_REPORT_SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    ctx.log.warn(
      'No Slack webhook URL configured, skipping Slack notification',
    );
    ctx.log.info('Report would have been sent', {
      title,
      contentLength: content.length,
    });
    return;
  }

  try {
    const blocks = getSlackTextBlocks(content);

    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: title,
          },
        },
        ...blocks,
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    ctx.log.info('Successfully sent auto-renewal report to Slack');
  } catch (error) {
    ctx.log.error('Failed to send auto-renewal report to Slack', { error });
    throw error;
  }
}

/**
 * Send auto-renewal report via email with CSV, Markdown, and detailed HTML attachments.
 *
 * The email body renders the compact summary template
 * (`AutoRenewDailyReport`) with category-first capped tables. Full
 * per-user detail (balance, payment methods, every domain) lives in
 * the detailed HTML attachment rendered from `AutoRenewDailyReportDetailed`,
 * plus the existing CSV and Markdown attachments for grep-ability.
 *
 * `content` is the legacy Markdown-formatted report content. It's still
 * used by the Slack path; no longer rendered into the email body.
 */
export async function sendAutoRenewReportEmailWithAttachments(
  title: string,
  content: string,
  input: AutoRenewReportInput,
  metrics: AutoRenewMetrics,
): Promise<void> {
  const ctx = Context.current();
  // `content` (legacy Markdown) is threaded through only so the Slack
  // path and other ambient callers can still consume it; the email
  // body no longer uses it.
  void content;

  try {
    // Build typed props for both the email body and the HTML attachment.
    const reportProps = buildAutoRenewReportProps(input, metrics);
    const detailedProps = buildAutoRenewDetailedProps(input, metrics);

    // Generate attachments
    const csvContent = await generateAutoRenewReportCsv(input, metrics);
    const markdownContent = await generateAutoRenewReportMarkdown(
      input,
      metrics,
    );

    const dateStr = format(metrics.reportDate || new Date(), 'yyyy-MM-dd');

    // Render the structured summary template into the email body.
    const emailTemplate = createElement(AutoRenewDailyReport, reportProps);
    const html = await render(emailTemplate);
    const plain = await render(emailTemplate, { plainText: true });

    // Render the detailed per-user template into a standalone HTML
    // attachment — every user, no cap.
    const detailedTemplate = createElement(
      AutoRenewDailyReportDetailed,
      detailedProps,
    );
    const detailedHtml = await render(detailedTemplate);

    await sendMail({
      to: [
        'reports+autorenew@d3serve.xyz',
        'asset-report-aaaao27zt2zkdocu7mqxfdxvzm@namefi.slack.com',
      ],
      subject: title,
      content: {
        html,
        plain,
      },
      from: 'Auto-Renewal System <noreply@d3serve.xyz>',
      attachments: [
        {
          filename: `autorenew-report-${dateStr}.csv`,
          content: csvContent,
          contentType: 'text/csv',
        },
        {
          filename: `autorenew-report-${dateStr}-detailed.md`,
          content: markdownContent,
          contentType: 'text/markdown',
        },
        {
          filename: `autorenew-report-${dateStr}-detailed.html`,
          content: detailedHtml,
          contentType: 'text/html',
        },
      ],
    });

    ctx.log.info(
      'Successfully sent auto-renewal report email with attachments to reports+autorenew@d3serve.xyz',
    );
  } catch (error) {
    ctx.log.error('Failed to send auto-renewal report email with attachments', {
      error,
    });
    throw error;
  }
}

/**
 * Convert content into Slack text blocks with proper size limits
 */
function getSlackTextBlocks(content: string) {
  const charLimitPerBlock = 3000;
  const blocks = [];

  // Split content into manageable chunks
  const lines = content.split('\n');
  let currentBlock = '';

  for (const line of lines) {
    const potentialBlock = currentBlock + (currentBlock ? '\n' : '') + line;

    if (potentialBlock.length > charLimitPerBlock && currentBlock) {
      // Add current block and start new one
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: currentBlock,
        },
      });
      currentBlock = line;
    } else {
      currentBlock = potentialBlock;
    }
  }

  // Add the last block
  if (currentBlock) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: currentBlock,
      },
    });
  }

  return blocks;
}
