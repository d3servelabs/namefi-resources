import type { GaReportLike } from '#lib/analytics-parser';
import type { CheckoutFlowEventName } from './analytics-client';

/**
 * Human-friendly labels for checkout flow events.
 *
 * @remarks
 * These labels are used in funnel steps, Sankey nodes, and step-by-step summaries.
 */
export const CHECKOUT_FLOW_EVENT_LABELS: Record<CheckoutFlowEventName, string> =
  {
    user_begin_search: 'Begin Search',
    order_placed: 'Order Placed',
    payment_processed: 'Payment Processed',
    domain_acquisition_started: 'Domain Acquisition Started',
    domain_acquisition_finished: 'Domain Acquisition Finished',
    dns_records_propagated: 'DNS Records Propagated',
    parking_finished: 'Parking Finished',
    payment_refunded: 'Payment Refunded',
    order_finished_email_sent: 'Order Email Sent',
    order_finished_email_opened: 'Order Email Opened',
  };

/**
 * Ordered event sequence used for the primary checkout funnel visualization.
 */
export const CHECKOUT_PRIMARY_FUNNEL_SEQUENCE = [
  'user_begin_search',
  'order_placed',
  'payment_processed',
  'order_finished_email_sent',
  'order_finished_email_opened',
] as const satisfies readonly CheckoutFlowEventName[];

type CheckoutPrimaryFunnelEventName =
  (typeof CHECKOUT_PRIMARY_FUNNEL_SEQUENCE)[number];

/**
 * Raw GA4 reports required to build checkout flow analytics.
 */
export interface CheckoutFlowAnalyticsReportRaw {
  /** Event totals grouped by `eventName`. */
  eventCounts: GaReportLike;

  /**
   * Event totals grouped by `eventName`, `status`, and `order_status`.
   *
   * @remarks
   * `order_status` is primarily used by email events.
   */
  eventCountsByStatus: GaReportLike;
}

/**
 * Aggregate KPIs displayed in the checkout analytics summary cards.
 */
export interface CheckoutFlowSummary {
  /** Total `user_begin_search` events. */
  beginSearchCount: number;

  /** Total `order_placed` events. */
  orderPlacedCount: number;

  /** Success-only count for `domain_acquisition_finished`. */
  domainAcquisitionFinishedSuccessCount: number;

  /** Total `payment_refunded` events. */
  refundedCount: number;

  /** `order_placed / user_begin_search`, represented as percent. */
  conversionRatePercent: number | null;

  /**
   * `domain_acquisition_finished(SUCCESS) / order_placed`, represented as percent.
   */
  completionRatePercent: number | null;
}

/**
 * One row in the step-by-step conversion table.
 */
export interface CheckoutFlowStep {
  /** Checkout flow event represented by this row. */
  eventName: CheckoutFlowEventName;

  /** Human-friendly event label. */
  label: string;

  /** Raw event count for the row event. */
  count: number;

  /**
   * Conversion from previous row event as percentage.
   *
   * `null` for the first row.
   */
  conversionFromPreviousPercent: number | null;

  /**
   * Positive difference between previous event and current event counts.
   *
   * `null` for the first row.
   */
  dropoffFromPreviousCount: number | null;
}

/**
 * One point in the checkout funnel series.
 */
export interface CheckoutFlowFunnelPoint {
  /** Event key for the funnel step. */
  eventName: CheckoutPrimaryFunnelEventName;

  /** Display label for the funnel step. */
  label: string;

  /** Numeric value rendered for the step. */
  value: number;
}

/**
 * Sankey node definition used by frontend charts.
 */
export interface CheckoutFlowSankeyNode {
  /** Unique node id (includes outcome suffix for split nodes). */
  id: string;

  /** Human-friendly node label shown in the chart. */
  label: string;

  /** Total value associated with this node. */
  count: number;

  /** Base event key represented by the node. */
  eventName: CheckoutFlowEventName;

  /** Optional normalized outcome for split nodes (e.g. SUCCESS, FAILURE). */
  outcome?: string;
}

/**
 * Sankey link definition used by frontend charts.
 */
export interface CheckoutFlowSankeyLink {
  /** Source node id. */
  source: string;

  /** Target node id. */
  target: string;

  /** Link weight/value. */
  value: number;
}

/**
 * Normalized status value supported by checkout analytics.
 */
export type CheckoutFlowStatus =
  | 'SUCCESS'
  | 'SUCCEEDED'
  | 'FAILURE'
  | 'TIMEOUT'
  | '(NOT SET)'
  | (string & {});

/**
 * Per-event breakdown collections used for diagnostics and derived analytics.
 */
export interface CheckoutFlowEventBreakdown {
  /** Counts grouped by normalized `status`. */
  status: Array<{ status: CheckoutFlowStatus; count: number }>;

  /** Counts grouped by normalized `order_status`. */
  orderStatus: Array<{ orderStatus: string; count: number }>;

  /**
   * Final derived outcome buckets used by Sankey/summary calculations.
   *
   * @remarks
   * For `order_finished_email_sent`, this is usually derived from `order_status`.
   */
  outcome: Array<{ outcome: string; count: number }>;
}

/**
 * Parsed event payload for one checkout flow event.
 */
export interface CheckoutFlowEventParsed {
  /** Total event count. */
  count: number;

  /** Breakdown buckets by status/order status/outcome. */
  breakdown: CheckoutFlowEventBreakdown;
}

/**
 * Explicit event-by-event normalized structure.
 *
 * This is intentionally not generic so each event remains obvious and easy
 * to customize independently.
 */
export interface CheckoutFlowEventsParsed {
  user_begin_search: CheckoutFlowEventParsed;
  order_placed: CheckoutFlowEventParsed;
  payment_processed: CheckoutFlowEventParsed;
  domain_acquisition_started: CheckoutFlowEventParsed;
  domain_acquisition_finished: CheckoutFlowEventParsed;
  dns_records_propagated: CheckoutFlowEventParsed;
  parking_finished: CheckoutFlowEventParsed;
  payment_refunded: CheckoutFlowEventParsed;
  order_finished_email_sent: CheckoutFlowEventParsed;
  order_finished_email_opened: CheckoutFlowEventParsed;
}

/**
 * Structured result returned by the raw checkout report parser.
 */
export interface CheckoutFlowRawReportParsed {
  /** Explicit per-event normalized data. */
  events: CheckoutFlowEventsParsed;

  /** Fast lookup of per-event total counts. */
  eventCountsByName: Record<CheckoutFlowEventName, number>;
}

/**
 * Final checkout analytics payload returned to API consumers.
 */
export interface CheckoutFlowAnalyticsParsed {
  /** Top-level checkout KPIs. */
  summary: CheckoutFlowSummary;

  /** Step conversion rows for tabular display. */
  steps: CheckoutFlowStep[];

  /** Funnel series for the checkout funnel chart. */
  funnel: CheckoutFlowFunnelPoint[];

  /** Full journey Sankey graph. */
  sankey: {
    nodes: CheckoutFlowSankeyNode[];
    links: CheckoutFlowSankeyLink[];
  };

  /** Domain-acquisition-focused Sankey graph variant. */
  sankeyDomainAcquisition: {
    nodes: CheckoutFlowSankeyNode[];
    links: CheckoutFlowSankeyLink[];
  };

  /** Checkout + email-focused Sankey graph variant. */
  sankeyCheckout: {
    nodes: CheckoutFlowSankeyNode[];
    links: CheckoutFlowSankeyLink[];
  };

  /** Fast lookup of per-event total counts. */
  eventCountsByName: Record<CheckoutFlowEventName, number>;

  /** Explicit per-event normalized dataset used to derive all charts. */
  events: CheckoutFlowEventsParsed;
}
