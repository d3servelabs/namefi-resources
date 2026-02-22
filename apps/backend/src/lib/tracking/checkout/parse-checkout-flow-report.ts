import { createLogger } from '#lib/logger';
import { CHECKOUT_FLOW_EVENT_SEQUENCE } from './analytics-client';
import {
  CHECKOUT_FLOW_EVENT_LABELS,
  CHECKOUT_PRIMARY_FUNNEL_SEQUENCE,
  type CheckoutFlowAnalyticsParsed,
  type CheckoutFlowAnalyticsReportRaw,
  type CheckoutFlowStep,
} from './analytics-types';
import {
  getSuccessCountFromEventWithFallback,
  roundToSingleDecimal,
} from './analytics-shared';
import { buildCheckoutFlowFunnel } from './checkout-funnel';
import {
  buildSankeyGraph,
  buildSankeyGraphCheckout,
  buildSankeyGraphDomainAcquisition,
} from './checkout-sankey';
import {
  buildEventCountsByName,
  createEmptyCheckoutFlowEventsParsed,
  parseCheckoutFlowRawReportData,
} from './parse-checkout-flow-raw-report';

const logger = createLogger({ module: 'checkout-analytics-parser' });

function createEmptyCheckoutFlowAnalyticsParsed(): CheckoutFlowAnalyticsParsed {
  const emptyEvents = createEmptyCheckoutFlowEventsParsed();

  return {
    summary: {
      beginSearchCount: 0,
      orderPlacedCount: 0,
      domainAcquisitionFinishedSuccessCount: 0,
      refundedCount: 0,
      conversionRatePercent: null,
      completionRatePercent: null,
    },
    steps: CHECKOUT_FLOW_EVENT_SEQUENCE.map((eventName, index) => ({
      eventName,
      label: CHECKOUT_FLOW_EVENT_LABELS[eventName],
      count: 0,
      conversionFromPreviousPercent: index === 0 ? null : 0,
      dropoffFromPreviousCount: index === 0 ? null : 0,
    })),
    funnel: CHECKOUT_PRIMARY_FUNNEL_SEQUENCE.map((eventName) => ({
      eventName,
      label:
        eventName === 'payment_processed'
          ? 'Payment Processed (Success)'
          : CHECKOUT_FLOW_EVENT_LABELS[eventName],
      value: 0,
    })),
    sankey: {
      nodes: [],
      links: [],
    },
    sankeyDomainAcquisition: {
      nodes: [],
      links: [],
    },
    sankeyCheckout: {
      nodes: [],
      links: [],
    },
    eventCountsByName: buildEventCountsByName(emptyEvents),
    events: emptyEvents,
  };
}

function buildCheckoutFlowSteps(
  eventCountsByName: CheckoutFlowAnalyticsParsed['eventCountsByName'],
): CheckoutFlowStep[] {
  return CHECKOUT_FLOW_EVENT_SEQUENCE.map((eventName, index) => {
    const count = eventCountsByName[eventName];
    const previousEventName = CHECKOUT_FLOW_EVENT_SEQUENCE[index - 1];

    if (!previousEventName) {
      return {
        eventName,
        label: CHECKOUT_FLOW_EVENT_LABELS[eventName],
        count,
        conversionFromPreviousPercent: null,
        dropoffFromPreviousCount: null,
      } satisfies CheckoutFlowStep;
    }

    const previousCount = eventCountsByName[previousEventName];
    const conversionFromPreviousPercent =
      previousCount > 0
        ? roundToSingleDecimal((count / previousCount) * 100)
        : null;

    return {
      eventName,
      label: CHECKOUT_FLOW_EVENT_LABELS[eventName],
      count,
      conversionFromPreviousPercent,
      dropoffFromPreviousCount: Math.max(previousCount - count, 0),
    } satisfies CheckoutFlowStep;
  });
}

export function parseCheckoutFlowReportData(
  raw: CheckoutFlowAnalyticsReportRaw,
): CheckoutFlowAnalyticsParsed {
  try {
    // Stage 1: flatten/filter/normalize GA rows into an explicit event model.
    const rawParsed = parseCheckoutFlowRawReportData(raw);
    const { events, eventCountsByName } = rawParsed;

    // Stage 2: tabular step conversion rows.
    const steps = buildCheckoutFlowSteps(eventCountsByName);

    // Stage 3: summary counts + success checkpoints.
    const beginSearchCount = eventCountsByName.user_begin_search;
    const orderPlacedCount = eventCountsByName.order_placed;
    const domainAcquisitionFinishedSuccessCount =
      getSuccessCountFromEventWithFallback(events.domain_acquisition_finished);

    // Stage 4: funnel dataset.
    const funnel = buildCheckoutFlowFunnel({
      events,
      eventCountsByName,
    });

    // Stage 5: top-level rates.
    const refundedCount = eventCountsByName.payment_refunded;
    const conversionRatePercent =
      beginSearchCount > 0
        ? roundToSingleDecimal((orderPlacedCount / beginSearchCount) * 100)
        : null;

    const completionRatePercent =
      orderPlacedCount > 0
        ? roundToSingleDecimal(
            (domainAcquisitionFinishedSuccessCount / orderPlacedCount) * 100,
          )
        : null;

    // Stage 6: Sankey graph variants for branching paths.
    const sankey = buildSankeyGraph({ events });
    const sankeyDomainAcquisition = buildSankeyGraphDomainAcquisition({
      events,
    });
    const sankeyCheckout = buildSankeyGraphCheckout({ events });

    return {
      summary: {
        beginSearchCount,
        orderPlacedCount,
        domainAcquisitionFinishedSuccessCount,
        refundedCount,
        conversionRatePercent,
        completionRatePercent,
      },
      steps,
      funnel,
      sankey,
      sankeyDomainAcquisition,
      sankeyCheckout,
      eventCountsByName,
      events,
    };
  } catch (error) {
    logger.warn(
      { error },
      'Failed to parse checkout flow analytics report data',
    );
    return createEmptyCheckoutFlowAnalyticsParsed();
  }
}
