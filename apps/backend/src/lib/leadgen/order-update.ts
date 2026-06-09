import type { LeadgenUserSignalState } from '@namefi-astra/common/contract/leadgen-contract';
import { getPersistableLeadgenLeadOrder } from '@namefi-astra/common/leadgen-order';
import { TRPCError } from '@trpc/server';

export type LeadgenLeadSignalUpdate = {
  leadId: string;
  state: LeadgenUserSignalState;
};

export function buildLeadgenLeadOrderUpdate({
  agentOrderedLeadIds,
  requestedLeadIds,
  signalUpdates,
}: {
  agentOrderedLeadIds: string[];
  requestedLeadIds: string[];
  signalUpdates: LeadgenLeadSignalUpdate[];
}) {
  const validLeadIds = new Set(agentOrderedLeadIds);
  const dedupedSignalUpdates = new Map<string, LeadgenLeadSignalUpdate>();

  for (const update of signalUpdates) {
    if (!validLeadIds.has(update.leadId)) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Leadgen prospect not found',
      });
    }

    dedupedSignalUpdates.set(update.leadId, update);
  }

  return {
    signalUpdates: [...dedupedSignalUpdates.values()],
    userLeadOrder: getPersistableLeadgenLeadOrder({
      agentOrderedLeadIds,
      userOrderedLeadIds: requestedLeadIds,
    }),
  };
}
