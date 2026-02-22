import {
  CHECKOUT_FLOW_EVENT_SEQUENCE,
  type CheckoutFlowEventName,
} from './analytics-client';
import {
  CHECKOUT_FLOW_EVENT_LABELS,
  type CheckoutFlowEventsParsed,
  type CheckoutFlowSankeyLink,
  type CheckoutFlowSankeyNode,
} from './analytics-types';
import {
  EPSILON,
  OUTCOME_NOT_SET,
  SUCCESS_EQUIVALENT_OUTCOMES,
  formatOutcomeLabel,
  isNotSetOutcome,
  normalizeOutcomeValue,
  sortOutcomeRows,
} from './analytics-shared';

type SankeyNodeVariant = {
  id: string;
  label: string;
  count: number;
  eventName: CheckoutFlowEventName;
  outcome?: string;
};

type OutcomeCountRow = { outcome: string; count: number };
type BreakdownRow = { key: string; count: number };

interface CheckoutFlowNodeVariantBuilderInput {
  eventName: CheckoutFlowEventName;
  event: CheckoutFlowEventsParsed[CheckoutFlowEventName];
  allEvents: CheckoutFlowEventsParsed;
}

type CheckoutFlowNodeVariantBuilder = (
  input: CheckoutFlowNodeVariantBuilderInput,
) => SankeyNodeVariant[];

function buildNodeId(
  eventName: CheckoutFlowEventName,
  outcome?: string,
): string {
  return outcome ? `${eventName}__${outcome}` : eventName;
}

function buildNodeLabel(
  eventName: CheckoutFlowEventName,
  outcome?: string,
): string {
  const baseLabel = CHECKOUT_FLOW_EVENT_LABELS[eventName];
  if (!outcome) return baseLabel;

  // For order email outcomes we keep "Order" prefix for readability,
  // e.g. "Order Email Sent (Order Completed)".
  return `${baseLabel} (${eventName === 'order_finished_email_sent' ? 'Order ' : ''}${formatOutcomeLabel(outcome)})`;
}

function normalizeOutcomeRows(rows: OutcomeCountRow[]): OutcomeCountRow[] {
  const merged = new Map<string, number>();
  for (const row of rows) {
    const normalizedOutcome = normalizeOutcomeValue(row.outcome);
    merged.set(
      normalizedOutcome,
      (merged.get(normalizedOutcome) ?? 0) + Math.max(row.count, 0),
    );
  }

  const normalizedRows: BreakdownRow[] = Array.from(merged.entries())
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({ key, count }));

  return sortOutcomeRows(normalizedRows).map((row) => ({
    outcome: row.key,
    count: row.count,
  }));
}

function sumNodeCounts(nodes: SankeyNodeVariant[]): number {
  return nodes.reduce((sum, node) => sum + node.count, 0);
}

function buildNodeVariantsFromOutcomeRows({
  eventName,
  eventCount,
  outcomeRows,
}: {
  eventName: CheckoutFlowEventName;
  eventCount: number;
  outcomeRows: OutcomeCountRow[];
}): SankeyNodeVariant[] {
  const normalizedOutcomeRows = normalizeOutcomeRows(outcomeRows);
  const outcomeRowsExcludingNotSet = normalizedOutcomeRows.filter(
    (row) => !isNotSetOutcome(row.outcome),
  );

  if (outcomeRowsExcludingNotSet.length === 0) {
    const fallbackCount =
      eventCount > 0
        ? eventCount
        : normalizedOutcomeRows.reduce((sum, row) => sum + row.count, 0);

    if (fallbackCount <= 0) {
      return [];
    }

    return [
      {
        id: buildNodeId(eventName),
        label: buildNodeLabel(eventName),
        count: fallbackCount,
        eventName,
      },
    ];
  }

  const nodes = outcomeRowsExcludingNotSet.map((row) => ({
    id: buildNodeId(eventName, row.outcome),
    label: buildNodeLabel(eventName, row.outcome),
    count: row.count,
    eventName,
    outcome: row.outcome,
  }));

  const knownOutcomeCount = outcomeRowsExcludingNotSet.reduce(
    (sum, row) => sum + row.count,
    0,
  );
  const explicitNotSetOutcomeCount =
    normalizedOutcomeRows.find((row) => isNotSetOutcome(row.outcome))?.count ??
    0;
  const inferredNotSetOutcomeCount = Math.max(
    eventCount - knownOutcomeCount - explicitNotSetOutcomeCount,
    0,
  );
  const totalNotSetOutcomeCount =
    explicitNotSetOutcomeCount + inferredNotSetOutcomeCount;

  if (totalNotSetOutcomeCount > 0) {
    nodes.push({
      id: buildNodeId(eventName, OUTCOME_NOT_SET),
      label: buildNodeLabel(eventName, OUTCOME_NOT_SET),
      count: totalNotSetOutcomeCount,
      eventName,
      outcome: OUTCOME_NOT_SET,
    });
  }

  return nodes;
}

function buildDefaultNodeVariantsForEvent({
  eventName,
  event,
}: CheckoutFlowNodeVariantBuilderInput): SankeyNodeVariant[] {
  return buildNodeVariantsFromOutcomeRows({
    eventName,
    eventCount: event.count,
    outcomeRows: event.breakdown.outcome,
  });
}

function buildOrderFinishedEmailSentNodeVariants({
  eventName,
  event,
  allEvents,
}: CheckoutFlowNodeVariantBuilderInput): SankeyNodeVariant[] {
  const outcomeRowsFromOrderStatus = event.breakdown.orderStatus.map((row) => ({
    outcome: row.orderStatus,
    count: row.count,
  }));
  const hasAnyOrderStatus = outcomeRowsFromOrderStatus.some(
    (row) => row.count > 0,
  );

  if (!hasAnyOrderStatus) {
    return buildDefaultNodeVariantsForEvent({
      eventName,
      event,
      allEvents,
    });
  }

  return buildNodeVariantsFromOutcomeRows({
    eventName,
    eventCount: event.count,
    outcomeRows: outcomeRowsFromOrderStatus,
  });
}

const EVENT_NODE_VARIANT_BUILDERS: Record<
  CheckoutFlowEventName,
  CheckoutFlowNodeVariantBuilder
> = {
  user_begin_search: buildDefaultNodeVariantsForEvent,
  order_placed: buildDefaultNodeVariantsForEvent,
  payment_processed: buildDefaultNodeVariantsForEvent,
  domain_acquisition_started: buildDefaultNodeVariantsForEvent,
  domain_acquisition_finished: buildDefaultNodeVariantsForEvent,
  dns_records_propagated: buildDefaultNodeVariantsForEvent,
  parking_finished: buildDefaultNodeVariantsForEvent,
  payment_refunded: buildDefaultNodeVariantsForEvent,
  order_finished_email_sent: buildOrderFinishedEmailSentNodeVariants,
  order_finished_email_opened: buildDefaultNodeVariantsForEvent,
};

function buildSankeyNodeVariants(
  events: CheckoutFlowEventsParsed,
): Record<CheckoutFlowEventName, SankeyNodeVariant[]> {
  return {
    user_begin_search: EVENT_NODE_VARIANT_BUILDERS.user_begin_search({
      eventName: 'user_begin_search',
      event: events.user_begin_search,
      allEvents: events,
    }),
    order_placed: EVENT_NODE_VARIANT_BUILDERS.order_placed({
      eventName: 'order_placed',
      event: events.order_placed,
      allEvents: events,
    }),
    payment_processed: EVENT_NODE_VARIANT_BUILDERS.payment_processed({
      eventName: 'payment_processed',
      event: events.payment_processed,
      allEvents: events,
    }),
    domain_acquisition_started:
      EVENT_NODE_VARIANT_BUILDERS.domain_acquisition_started({
        eventName: 'domain_acquisition_started',
        event: events.domain_acquisition_started,
        allEvents: events,
      }),
    domain_acquisition_finished:
      EVENT_NODE_VARIANT_BUILDERS.domain_acquisition_finished({
        eventName: 'domain_acquisition_finished',
        event: events.domain_acquisition_finished,
        allEvents: events,
      }),
    dns_records_propagated: EVENT_NODE_VARIANT_BUILDERS.dns_records_propagated({
      eventName: 'dns_records_propagated',
      event: events.dns_records_propagated,
      allEvents: events,
    }),
    parking_finished: EVENT_NODE_VARIANT_BUILDERS.parking_finished({
      eventName: 'parking_finished',
      event: events.parking_finished,
      allEvents: events,
    }),
    payment_refunded: EVENT_NODE_VARIANT_BUILDERS.payment_refunded({
      eventName: 'payment_refunded',
      event: events.payment_refunded,
      allEvents: events,
    }),
    order_finished_email_sent:
      EVENT_NODE_VARIANT_BUILDERS.order_finished_email_sent({
        eventName: 'order_finished_email_sent',
        event: events.order_finished_email_sent,
        allEvents: events,
      }),
    order_finished_email_opened:
      EVENT_NODE_VARIANT_BUILDERS.order_finished_email_opened({
        eventName: 'order_finished_email_opened',
        event: events.order_finished_email_opened,
        allEvents: events,
      }),
  };
}

function flattenSankeyNodes(
  nodesByEvent: Record<CheckoutFlowEventName, SankeyNodeVariant[]>,
): CheckoutFlowSankeyNode[] {
  return CHECKOUT_FLOW_EVENT_SEQUENCE.flatMap((eventName) => {
    return nodesByEvent[eventName]
      .filter((node) => node.count > 0)
      .map((node) => ({
        id: node.id,
        label: node.label,
        count: node.count,
        eventName: node.eventName,
        outcome: node.outcome,
      }));
  });
}

function pushAccumulatedLink(
  linksByKey: Map<string, CheckoutFlowSankeyLink>,
  source: string,
  target: string,
  value: number,
): void {
  if (value <= EPSILON) return;

  const normalizedValue = Number(value.toFixed(4));
  if (normalizedValue <= EPSILON) return;

  const key = `${source}__${target}`;
  const existing = linksByKey.get(key);
  if (existing) {
    existing.value = Number((existing.value + normalizedValue).toFixed(4));
    return;
  }

  linksByKey.set(key, {
    source,
    target,
    value: normalizedValue,
  });
}

/**
 * Split allocation from one source set into one target set.
 */
function distributeFlow({
  linksByKey,
  sourceNodes,
  targetNodes,
  maxFlow,
}: {
  linksByKey: Map<string, CheckoutFlowSankeyLink>;
  sourceNodes: SankeyNodeVariant[];
  targetNodes: SankeyNodeVariant[];
  maxFlow?: number;
}): void {
  if (sourceNodes.length === 0 || targetNodes.length === 0) return;

  const totalSource = sumNodeCounts(sourceNodes);
  const totalTarget = sumNodeCounts(targetNodes);
  if (totalSource <= EPSILON || totalTarget <= EPSILON) return;

  const flowCap =
    maxFlow === undefined ? Number.POSITIVE_INFINITY : Math.max(maxFlow, 0);
  const totalFlow = Math.min(totalSource, totalTarget, flowCap);
  if (totalFlow <= EPSILON) return;

  const sourceScale = totalFlow / totalSource;
  const targetScale = totalFlow / totalTarget;
  const targetRemaining = targetNodes.map((node) => node.count * targetScale);

  for (const sourceNode of sourceNodes) {
    let sourceRemaining = sourceNode.count * sourceScale;
    if (sourceRemaining <= EPSILON) continue;

    for (
      let targetIndex = 0;
      targetIndex < targetNodes.length;
      targetIndex += 1
    ) {
      if (sourceRemaining <= EPSILON) break;

      const targetCapacity = targetRemaining[targetIndex] ?? 0;
      if (targetCapacity <= EPSILON) continue;

      const allocatedFlow = Math.min(sourceRemaining, targetCapacity);
      if (allocatedFlow <= EPSILON) continue;

      pushAccumulatedLink(
        linksByKey,
        sourceNode.id,
        targetNodes[targetIndex].id,
        allocatedFlow,
      );

      sourceRemaining -= allocatedFlow;
      targetRemaining[targetIndex] = targetCapacity - allocatedFlow;
    }
  }
}

/**
 * Fan-out helper: run independent distribution passes from the same source
 * into multiple target groups (shared-source semantics).
 */
function shareFlow({
  linksByKey,
  sourceNodes,
  targetGroups,
}: {
  linksByKey: Map<string, CheckoutFlowSankeyLink>;
  sourceNodes: SankeyNodeVariant[];
  targetGroups: SankeyNodeVariant[][];
}): void {
  for (const targetNodes of targetGroups) {
    distributeFlow({
      linksByKey,
      sourceNodes,
      targetNodes,
    });
  }
}

export function buildSankeyGraph({
  events,
}: {
  events: CheckoutFlowEventsParsed;
}): {
  nodes: CheckoutFlowSankeyNode[];
  links: CheckoutFlowSankeyLink[];
} {
  const nodesByEvent = buildSankeyNodeVariants(events);
  const linksByKey = new Map<string, CheckoutFlowSankeyLink>();

  const beginSearchNodes = nodesByEvent.user_begin_search;
  const orderPlacedNodes = nodesByEvent.order_placed;
  const paymentProcessedNodes = nodesByEvent.payment_processed;
  const domainAcquisitionStartedNodes = nodesByEvent.domain_acquisition_started;
  const domainAcquisitionFinishedNodes =
    nodesByEvent.domain_acquisition_finished;
  const domainSuccessNodes = domainAcquisitionFinishedNodes.filter((node) => {
    if (!node.outcome) return false;
    return SUCCESS_EQUIVALENT_OUTCOMES.has(normalizeOutcomeValue(node.outcome));
  });
  const domainNonSuccessNodes = domainAcquisitionFinishedNodes.filter(
    (node) => {
      if (!node.outcome) return false;
      return !SUCCESS_EQUIVALENT_OUTCOMES.has(
        normalizeOutcomeValue(node.outcome),
      );
    },
  );
  const domainNodesWithoutOutcome = domainAcquisitionFinishedNodes.filter(
    (node) => node.outcome === undefined,
  );

  const sourceNodesForDomainSuccessPath =
    domainSuccessNodes.length > 0
      ? domainSuccessNodes
      : domainNodesWithoutOutcome.length > 0
        ? domainNodesWithoutOutcome
        : domainAcquisitionFinishedNodes;

  const dnsRecordsPropagatedNodes = nodesByEvent.dns_records_propagated;
  const parkingFinishedNodes = nodesByEvent.parking_finished;
  const paymentRefundedNodes = nodesByEvent.payment_refunded;
  const orderFinishedEmailSentNodes = nodesByEvent.order_finished_email_sent;
  const orderSuccessEmailSentNodes =
    nodesByEvent.order_finished_email_sent.filter((node) =>
      SUCCESS_EQUIVALENT_OUTCOMES.has(node.outcome ?? ''),
    );
  const orderFailedEmailSentNodes =
    nodesByEvent.order_finished_email_sent.filter(
      (node) => !SUCCESS_EQUIVALENT_OUTCOMES.has(node.outcome ?? ''),
    );

  const orderFinishedEmailOpenedNodes =
    nodesByEvent.order_finished_email_opened;

  distributeFlow({
    linksByKey,
    sourceNodes: orderPlacedNodes,
    targetNodes: paymentProcessedNodes,
  });
  distributeFlow({
    linksByKey,
    sourceNodes: paymentProcessedNodes,
    targetNodes: domainAcquisitionStartedNodes,
  });
  distributeFlow({
    linksByKey,
    sourceNodes: domainAcquisitionStartedNodes,
    targetNodes: domainAcquisitionFinishedNodes,
  });

  distributeFlow({
    linksByKey,
    sourceNodes: sourceNodesForDomainSuccessPath,
    targetNodes: dnsRecordsPropagatedNodes,
  });
  distributeFlow({
    linksByKey,
    sourceNodes: dnsRecordsPropagatedNodes,
    targetNodes: parkingFinishedNodes,
  });

  distributeFlow({
    linksByKey,
    sourceNodes: domainNonSuccessNodes,
    targetNodes: orderFailedEmailSentNodes,
  });

  distributeFlow({
    linksByKey,
    sourceNodes: orderFailedEmailSentNodes,
    targetNodes: paymentRefundedNodes,
  });

  distributeFlow({
    linksByKey,
    sourceNodes: parkingFinishedNodes,
    targetNodes: orderSuccessEmailSentNodes,
  });

  distributeFlow({
    linksByKey,
    sourceNodes: orderFinishedEmailSentNodes,
    targetNodes: orderFinishedEmailOpenedNodes,
  });

  return {
    nodes: flattenSankeyNodes(nodesByEvent),
    links: Array.from(linksByKey.values()).filter(
      (link) => link.value > EPSILON,
    ),
  };
}

/**
 * Focused variant for domain-acquisition-oriented Sankey exploration.
 */
export function buildSankeyGraphDomainAcquisition({
  events,
}: {
  events: CheckoutFlowEventsParsed;
}): {
  nodes: CheckoutFlowSankeyNode[];
  links: CheckoutFlowSankeyLink[];
} {
  const nodesByEvent = buildSankeyNodeVariants(events);
  const linksByKey = new Map<string, CheckoutFlowSankeyLink>();

  const domainAcquisitionStartedNodes = nodesByEvent.domain_acquisition_started;
  const domainAcquisitionFinishedNodes =
    nodesByEvent.domain_acquisition_finished;
  const dnsRecordsPropagatedNodes = nodesByEvent.dns_records_propagated;
  const parkingFinishedNodes = nodesByEvent.parking_finished;

  distributeFlow({
    linksByKey,
    sourceNodes: domainAcquisitionStartedNodes,
    targetNodes: domainAcquisitionFinishedNodes,
  });

  const domainSuccessNodes = domainAcquisitionFinishedNodes.filter((node) =>
    SUCCESS_EQUIVALENT_OUTCOMES.has(node.outcome ?? ''),
  );

  distributeFlow({
    linksByKey,
    sourceNodes: domainSuccessNodes,
    targetNodes: dnsRecordsPropagatedNodes,
  });
  distributeFlow({
    linksByKey,
    sourceNodes: dnsRecordsPropagatedNodes,
    targetNodes: parkingFinishedNodes,
  });

  return {
    nodes: flattenSankeyNodes(nodesByEvent),
    links: Array.from(linksByKey.values()).filter(
      (link) => link.value > EPSILON,
    ),
  };
}

/**
 * Focused variant for checkout/email-oriented Sankey exploration.
 */
export function buildSankeyGraphCheckout({
  events,
}: {
  events: CheckoutFlowEventsParsed;
}): {
  nodes: CheckoutFlowSankeyNode[];
  links: CheckoutFlowSankeyLink[];
} {
  const nodesByEvent = buildSankeyNodeVariants(events);
  const linksByKey = new Map<string, CheckoutFlowSankeyLink>();

  const beginSearchNodes = nodesByEvent.user_begin_search;
  const orderPlacedNodes = nodesByEvent.order_placed;
  const paymentProcessedNodes = nodesByEvent.payment_processed;
  const paymentRefundedNodes = nodesByEvent.payment_refunded;
  const orderFinishedEmailSentNodes = nodesByEvent.order_finished_email_sent;
  const orderFinishedEmailOpenedNodes =
    nodesByEvent.order_finished_email_opened;

  const orderSuccessEmailSentNodes = orderFinishedEmailSentNodes.filter(
    (node) => SUCCESS_EQUIVALENT_OUTCOMES.has(node.outcome ?? ''),
  );
  const orderNonSuccessEmailSentNodes = orderFinishedEmailSentNodes.filter(
    (node) => !SUCCESS_EQUIVALENT_OUTCOMES.has(node.outcome ?? ''),
  );

  const paymentProcessedSuccessNodes = paymentProcessedNodes.filter((node) =>
    SUCCESS_EQUIVALENT_OUTCOMES.has(node.outcome ?? ''),
  );
  const paymentProcessedNonSuccessNodes = paymentProcessedNodes.filter(
    (node) => !SUCCESS_EQUIVALENT_OUTCOMES.has(node.outcome ?? ''),
  );

  distributeFlow({
    linksByKey,
    sourceNodes: beginSearchNodes,
    targetNodes: orderPlacedNodes,
  });
  distributeFlow({
    linksByKey,
    sourceNodes: orderPlacedNodes,
    targetNodes: paymentProcessedNodes,
  });

  distributeFlow({
    linksByKey,
    sourceNodes: paymentProcessedNodes,
    targetNodes: [
      ...(paymentRefundedNodes.length
        ? paymentRefundedNodes
        : orderNonSuccessEmailSentNodes),
      ...orderSuccessEmailSentNodes,
    ],
  });

  if (paymentRefundedNodes.length) {
    distributeFlow({
      linksByKey,
      sourceNodes: paymentRefundedNodes,
      targetNodes: orderNonSuccessEmailSentNodes,
    });
  }

  distributeFlow({
    linksByKey,
    sourceNodes: orderFinishedEmailSentNodes,
    targetNodes: orderFinishedEmailOpenedNodes,
  });

  return {
    nodes: flattenSankeyNodes(nodesByEvent),
    links: Array.from(linksByKey.values()).filter(
      (link) => link.value > EPSILON,
    ),
  };
}
