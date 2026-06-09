import { TRPCError } from '@trpc/server';
import { describe, expect, it } from 'vitest';

import { buildLeadgenLeadOrderUpdate } from './order-update';

describe('buildLeadgenLeadOrderUpdate', () => {
  it('stores only customized valid lead order ids', () => {
    expect(
      buildLeadgenLeadOrderUpdate({
        agentOrderedLeadIds: ['lead-1', 'lead-2', 'lead-3'],
        requestedLeadIds: ['lead-2', 'missing', 'lead-1', 'lead-2'],
        signalUpdates: [],
      }).userLeadOrder,
    ).toEqual(['lead-2', 'lead-1', 'lead-3']);

    expect(
      buildLeadgenLeadOrderUpdate({
        agentOrderedLeadIds: ['lead-1', 'lead-2'],
        requestedLeadIds: ['lead-1', 'lead-2'],
        signalUpdates: [],
      }).userLeadOrder,
    ).toEqual([]);
  });

  it('rejects signal updates for leads outside the authorized run', () => {
    expect(() =>
      buildLeadgenLeadOrderUpdate({
        agentOrderedLeadIds: ['lead-1'],
        requestedLeadIds: ['lead-1'],
        signalUpdates: [{ leadId: 'missing', state: 'hidden' }],
      }),
    ).toThrow(TRPCError);
  });

  it('dedupes signal updates with the latest update winning', () => {
    expect(
      buildLeadgenLeadOrderUpdate({
        agentOrderedLeadIds: ['lead-1', 'lead-2'],
        requestedLeadIds: ['lead-2', 'lead-1'],
        signalUpdates: [
          { leadId: 'lead-1', state: 'hidden' },
          { leadId: 'lead-1', state: 'bookmarked' },
          { leadId: 'lead-2', state: 'hidden' },
        ],
      }).signalUpdates,
    ).toEqual([
      { leadId: 'lead-1', state: 'bookmarked' },
      { leadId: 'lead-2', state: 'hidden' },
    ]);
  });
});
