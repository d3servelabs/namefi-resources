import type { CheckoutFlowEventName } from './analytics-client';
import type {
  CheckoutFlowAnalyticsReportRaw,
  CheckoutFlowEventParsed,
  CheckoutFlowEventsParsed,
  CheckoutFlowRawReportParsed,
  CheckoutFlowStatus,
} from './analytics-types';
import {
  OUTCOME_NOT_SET,
  isCheckoutFlowEventName,
  isNotSetOutcome,
  normalizeOutcomeValue,
  safeGetDimension,
  safeGetMetric,
  sortOutcomeRows,
  sortRowsLexicographicallyWithNotSetLast,
} from './analytics-shared';

type CountMap = Map<string, number>;

interface CheckoutFlowEventAccumulator {
  count: number;
  statusCounts: CountMap;
  orderStatusCounts: CountMap;
  outcomeCounts: CountMap;
}

type CheckoutFlowEventAccumulatorByName = Record<
  CheckoutFlowEventName,
  CheckoutFlowEventAccumulator
>;

interface CheckoutFlowEventBuilderInput {
  eventName: CheckoutFlowEventName;
  accumulator: CheckoutFlowEventAccumulator;
  allAccumulators: CheckoutFlowEventAccumulatorByName;
}

type CheckoutFlowEventBuilder = (
  input: CheckoutFlowEventBuilderInput,
) => CheckoutFlowEventParsed;

type BreakdownRow = { key: string; count: number };

function incrementMapCount(map: CountMap, key: string, count: number): void {
  if (count <= 0) return;
  map.set(key, (map.get(key) ?? 0) + count);
}

function sumMapCounts(map: CountMap): number {
  let sum = 0;
  for (const count of map.values()) {
    sum += count;
  }
  return sum;
}

function resolveOutcomeForEvent({
  eventName,
  normalizedStatus,
  normalizedOrderStatus,
}: {
  eventName: CheckoutFlowEventName;
  normalizedStatus: string;
  normalizedOrderStatus: string;
}): string {
  // order_finished_email_sent is tracked primarily with order_status.
  // If present, it should override generic status.
  if (
    eventName === 'order_finished_email_sent' &&
    normalizedOrderStatus !== OUTCOME_NOT_SET
  ) {
    return normalizedOrderStatus;
  }

  return normalizedStatus;
}

function createEmptyEventAccumulator(): CheckoutFlowEventAccumulator {
  return {
    count: 0,
    statusCounts: new Map<string, number>(),
    orderStatusCounts: new Map<string, number>(),
    outcomeCounts: new Map<string, number>(),
  };
}

function createEmptyEventAccumulators(): CheckoutFlowEventAccumulatorByName {
  return {
    user_begin_search: createEmptyEventAccumulator(),
    order_placed: createEmptyEventAccumulator(),
    payment_processed: createEmptyEventAccumulator(),
    domain_acquisition_started: createEmptyEventAccumulator(),
    domain_acquisition_finished: createEmptyEventAccumulator(),
    dns_records_propagated: createEmptyEventAccumulator(),
    parking_finished: createEmptyEventAccumulator(),
    payment_refunded: createEmptyEventAccumulator(),
    order_finished_email_sent: createEmptyEventAccumulator(),
    order_finished_email_opened: createEmptyEventAccumulator(),
  };
}

function createEmptyCheckoutFlowEventParsed(): CheckoutFlowEventParsed {
  return {
    count: 0,
    breakdown: {
      status: [],
      orderStatus: [],
      outcome: [],
    },
  };
}

export function createEmptyCheckoutFlowEventsParsed(): CheckoutFlowEventsParsed {
  return {
    user_begin_search: createEmptyCheckoutFlowEventParsed(),
    order_placed: createEmptyCheckoutFlowEventParsed(),
    payment_processed: createEmptyCheckoutFlowEventParsed(),
    domain_acquisition_started: createEmptyCheckoutFlowEventParsed(),
    domain_acquisition_finished: createEmptyCheckoutFlowEventParsed(),
    dns_records_propagated: createEmptyCheckoutFlowEventParsed(),
    parking_finished: createEmptyCheckoutFlowEventParsed(),
    payment_refunded: createEmptyCheckoutFlowEventParsed(),
    order_finished_email_sent: createEmptyCheckoutFlowEventParsed(),
    order_finished_email_opened: createEmptyCheckoutFlowEventParsed(),
  };
}

function getResolvedEventCount(
  accumulator: CheckoutFlowEventAccumulator,
): number {
  if (accumulator.count > 0) {
    return accumulator.count;
  }

  return Math.max(
    sumMapCounts(accumulator.outcomeCounts),
    sumMapCounts(accumulator.statusCounts),
    sumMapCounts(accumulator.orderStatusCounts),
    0,
  );
}

function buildBreakdownRowsFromCountMap({
  explicitCountsByKey,
  eventTotalCount,
  notSetKey,
  sortRows,
}: {
  explicitCountsByKey: CountMap;
  eventTotalCount: number;
  notSetKey: string;
  sortRows: (rows: BreakdownRow[]) => BreakdownRow[];
}): BreakdownRow[] {
  const rows = Array.from(explicitCountsByKey.entries())
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({ key, count }));

  const rowsExcludingNotSet = rows.filter((row) => row.key !== notSetKey);
  const explicitNotSetCount =
    rows.find((row) => row.key === notSetKey)?.count ?? 0;

  // inferredNotSetCount ensures breakdown totals always match eventTotalCount
  // when GA does not emit explicit (NOT SET) rows.
  const knownCountExcludingNotSet = rowsExcludingNotSet.reduce(
    (sum, row) => sum + row.count,
    0,
  );
  const inferredNotSetCount = Math.max(
    eventTotalCount - knownCountExcludingNotSet - explicitNotSetCount,
    0,
  );
  const totalNotSetCount = explicitNotSetCount + inferredNotSetCount;

  const mergedRows = [...rowsExcludingNotSet];
  if (totalNotSetCount > 0) {
    mergedRows.push({ key: notSetKey, count: totalNotSetCount });
  }

  return sortRows(mergedRows);
}

function buildStatusBreakdown(
  statusCounts: CountMap,
  eventTotalCount: number,
): Array<{ status: CheckoutFlowStatus; count: number }> {
  return buildBreakdownRowsFromCountMap({
    explicitCountsByKey: statusCounts,
    eventTotalCount,
    notSetKey: OUTCOME_NOT_SET,
    sortRows: sortOutcomeRows,
  }).map((row) => ({
    status: row.key as CheckoutFlowStatus,
    count: row.count,
  }));
}

function buildOrderStatusBreakdown(
  orderStatusCounts: CountMap,
  eventTotalCount: number,
): Array<{ orderStatus: string; count: number }> {
  return buildBreakdownRowsFromCountMap({
    explicitCountsByKey: orderStatusCounts,
    eventTotalCount,
    notSetKey: OUTCOME_NOT_SET,
    sortRows: sortRowsLexicographicallyWithNotSetLast,
  }).map((row) => ({
    orderStatus: row.key,
    count: row.count,
  }));
}

function buildOutcomeBreakdown(
  outcomeCounts: CountMap,
  eventTotalCount: number,
): Array<{ outcome: string; count: number }> {
  return buildBreakdownRowsFromCountMap({
    explicitCountsByKey: outcomeCounts,
    eventTotalCount,
    notSetKey: OUTCOME_NOT_SET,
    sortRows: sortOutcomeRows,
  }).map((row) => ({
    outcome: row.key,
    count: row.count,
  }));
}

function buildDefaultEventParsed({
  accumulator,
}: CheckoutFlowEventBuilderInput): CheckoutFlowEventParsed {
  const eventCount = getResolvedEventCount(accumulator);

  return {
    count: eventCount,
    breakdown: {
      status: buildStatusBreakdown(accumulator.statusCounts, eventCount),
      orderStatus: buildOrderStatusBreakdown(
        accumulator.orderStatusCounts,
        eventCount,
      ),
      outcome: buildOutcomeBreakdown(accumulator.outcomeCounts, eventCount),
    },
  };
}

function buildOrderFinishedEmailSentParsed(
  input: CheckoutFlowEventBuilderInput,
): CheckoutFlowEventParsed {
  const parsed = buildDefaultEventParsed(input);
  const orderStatusRowsExcludingNotSet = parsed.breakdown.orderStatus.filter(
    (row) => !isNotSetOutcome(row.orderStatus),
  );

  if (orderStatusRowsExcludingNotSet.length === 0) {
    return parsed;
  }

  // For order_finished_email_sent, outcome should follow order_status values.
  const outcomeCountsFromOrderStatus = new Map<string, number>();
  for (const row of parsed.breakdown.orderStatus) {
    incrementMapCount(
      outcomeCountsFromOrderStatus,
      normalizeOutcomeValue(row.orderStatus),
      row.count,
    );
  }

  return {
    ...parsed,
    breakdown: {
      ...parsed.breakdown,
      outcome: buildOutcomeBreakdown(
        outcomeCountsFromOrderStatus,
        parsed.count,
      ),
    },
  };
}

const EVENT_PARSED_BUILDERS: Record<
  CheckoutFlowEventName,
  CheckoutFlowEventBuilder
> = {
  user_begin_search: buildDefaultEventParsed,
  order_placed: buildDefaultEventParsed,
  payment_processed: buildDefaultEventParsed,
  domain_acquisition_started: buildDefaultEventParsed,
  domain_acquisition_finished: buildDefaultEventParsed,
  dns_records_propagated: buildDefaultEventParsed,
  parking_finished: buildDefaultEventParsed,
  payment_refunded: buildDefaultEventParsed,
  order_finished_email_sent: buildOrderFinishedEmailSentParsed,
  order_finished_email_opened: buildDefaultEventParsed,
};

function buildParsedEvent(
  eventName: CheckoutFlowEventName,
  allAccumulators: CheckoutFlowEventAccumulatorByName,
): CheckoutFlowEventParsed {
  const builder = EVENT_PARSED_BUILDERS[eventName];
  return builder({
    eventName,
    accumulator: allAccumulators[eventName],
    allAccumulators,
  });
}

function buildParsedEvents(
  accumulators: CheckoutFlowEventAccumulatorByName,
): CheckoutFlowEventsParsed {
  return {
    user_begin_search: buildParsedEvent('user_begin_search', accumulators),
    order_placed: buildParsedEvent('order_placed', accumulators),
    payment_processed: buildParsedEvent('payment_processed', accumulators),
    domain_acquisition_started: buildParsedEvent(
      'domain_acquisition_started',
      accumulators,
    ),
    domain_acquisition_finished: buildParsedEvent(
      'domain_acquisition_finished',
      accumulators,
    ),
    dns_records_propagated: buildParsedEvent(
      'dns_records_propagated',
      accumulators,
    ),
    parking_finished: buildParsedEvent('parking_finished', accumulators),
    payment_refunded: buildParsedEvent('payment_refunded', accumulators),
    order_finished_email_sent: buildParsedEvent(
      'order_finished_email_sent',
      accumulators,
    ),
    order_finished_email_opened: buildParsedEvent(
      'order_finished_email_opened',
      accumulators,
    ),
  };
}

export function buildEventCountsByName(
  events: CheckoutFlowEventsParsed,
): Record<CheckoutFlowEventName, number> {
  return {
    user_begin_search: events.user_begin_search.count,
    order_placed: events.order_placed.count,
    payment_processed: events.payment_processed.count,
    domain_acquisition_started: events.domain_acquisition_started.count,
    domain_acquisition_finished: events.domain_acquisition_finished.count,
    dns_records_propagated: events.dns_records_propagated.count,
    parking_finished: events.parking_finished.count,
    payment_refunded: events.payment_refunded.count,
    order_finished_email_sent: events.order_finished_email_sent.count,
    order_finished_email_opened: events.order_finished_email_opened.count,
  };
}

export function parseCheckoutFlowRawReportData(
  raw: CheckoutFlowAnalyticsReportRaw,
): CheckoutFlowRawReportParsed {
  const accumulators = createEmptyEventAccumulators();

  for (const row of raw.eventCounts.rows ?? []) {
    const eventName = safeGetDimension(row, 0);
    if (!isCheckoutFlowEventName(eventName)) continue;

    const count = safeGetMetric(row, 0);
    if (count <= 0) continue;

    accumulators[eventName].count += count;
  }

  for (const row of raw.eventCountsByStatus.rows ?? []) {
    const eventName = safeGetDimension(row, 0);
    if (!isCheckoutFlowEventName(eventName)) continue;

    const count = safeGetMetric(row, 0);
    if (count <= 0) continue;

    const normalizedStatus = normalizeOutcomeValue(safeGetDimension(row, 1));
    const normalizedOrderStatus = normalizeOutcomeValue(
      safeGetDimension(row, 2),
    );
    const resolvedOutcome = resolveOutcomeForEvent({
      eventName,
      normalizedStatus,
      normalizedOrderStatus,
    });

    const accumulator = accumulators[eventName];
    incrementMapCount(accumulator.statusCounts, normalizedStatus, count);
    incrementMapCount(
      accumulator.orderStatusCounts,
      normalizedOrderStatus,
      count,
    );
    incrementMapCount(accumulator.outcomeCounts, resolvedOutcome, count);
  }

  const events = buildParsedEvents(accumulators);

  return {
    events,
    eventCountsByName: buildEventCountsByName(events),
  };
}
