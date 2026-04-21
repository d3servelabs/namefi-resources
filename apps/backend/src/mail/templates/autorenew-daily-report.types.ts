/**
 * Props shared by the summary email body (`autorenew-daily-report.tsx`)
 * and the detailed HTML attachment (`autorenew-daily-report-detailed.tsx`).
 *
 * The types intentionally match — and are populated from — the shapes
 * in `apps/backend/src/temporal/activities/domain/autorenew-report.activities.ts`
 * so a single builder function feeds both renders.
 */

export type AutoRenewSnapshotCategory =
  | 'renewed'
  | 'registrarFailed'
  | 'paymentFailed'
  | 'deferredInsufficientBalance'
  | 'missingPrice';

export interface AutoRenewDomainEntry {
  normalizedDomainName: string;
  userId: string;
  userEmail?: string;
  registrarKey?: string;
  /** USD per domain. Null when price data was missing. */
  chargeAmountInUsd: number | null;
  /** Human-readable reason — populated for failure categories only. */
  reason?: string;
}

export interface AutoRenewCategorySummary {
  total: number;
  /** Sum of charge amounts (USD) for this category. */
  totalUsd?: number;
}

export interface AutoRenewReportSummary {
  reportDate: string; // YYYY-MM-DD
  totalUsersProcessed: number;
  totalDomainsProcessed: number;
  renewed: AutoRenewCategorySummary;
  registrarFailed: AutoRenewCategorySummary;
  paymentFailed: AutoRenewCategorySummary;
  deferredInsufficientBalance: AutoRenewCategorySummary & {
    totalShortfallInUsd: number;
    usersAffected: number;
  };
  missingPrice: AutoRenewCategorySummary;
  totalChargedInUsd: number;
  totalRefundedInUsd: number;
  /** Sum of user NFSC balances (USD, USD-pegged) at run start. */
  totalNfscBalanceInUsdAtRunStart: number;
  /** Workflow execution time in ms — surfaced in the summary panel. */
  executionTimeMs: number;
}

export interface AutoRenewPaymentMethodSnapshot {
  kind: 'NFSC_WALLET' | 'STRIPE';
  walletAddress?: string;
  last4?: string | null;
  paymentMethodId?: string;
}

export interface AutoRenewNfscBalanceEntry {
  walletAddress: string;
  chainId: number;
  /** USD-equivalent balance on that chain. Null = not fetched / unknown. */
  balanceInUsd: number | null;
}

/**
 * Full per-user card for the detailed HTML attachment. The summary email
 * body does NOT render these (it shows category-first tables capped at
 * `DOMAINS_VISIBLE_LIMIT_PER_CATEGORY`).
 */
export interface AutoRenewUserCard {
  userId: string;
  userEmail?: string;
  paymentStatus: 'SUCCEEDED' | 'FAILED' | 'SKIPPED';
  availableBalanceInUsd: number;
  nfscBalancesByChain: AutoRenewNfscBalanceEntry[];
  availablePaymentMethods: AutoRenewPaymentMethodSnapshot[];
  /** Total USD billed for this user this run. */
  totalBilledInUsd: number;
  /** USD cents short of the full original renewal bill. */
  shortfallInUsdCents?: number;
  /** ISO timestamp when the snapshot was taken (workflow start). */
  snapshotTakenAt: string;
  domainsByCategory: Record<AutoRenewSnapshotCategory, AutoRenewDomainEntry[]>;
}

/** Common meta fields used by both templates. */
export interface AutoRenewReportMeta {
  /** YYYY-MM-DD */
  reportDate: string;
  /** ISO timestamp when the report was generated. */
  generatedAt: string;
  /** Link to the admin run-detail page for this workflow. */
  adminUrl: string;
  /** Optional note shown above the footer, e.g. attachment pointers. */
  attachmentNote?: string;
}

/** Props for the summary email body (compact, category-first). */
export interface AutoRenewDailyReportProps {
  title: string;
  summary: AutoRenewReportSummary;
  /** Flat per-category arrays. Each entry carries its user reference. */
  categorized: Record<AutoRenewSnapshotCategory, AutoRenewDomainEntry[]>;
  meta: AutoRenewReportMeta;
}

/**
 * Props for the detailed HTML attachment — full per-user cards, no cap.
 * Extends the summary props with the user-card array.
 */
export interface AutoRenewDailyReportDetailedProps
  extends AutoRenewDailyReportProps {
  users: AutoRenewUserCard[];
}
