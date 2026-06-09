import { describe, expect, it } from 'vitest';

import {
  getPersistableLeadgenLeadOrder,
  isLeadgenLeadOrderCustomized,
  reconcileLeadgenLeadOrder,
} from './leadgen-order';

describe('reconcileLeadgenLeadOrder', () => {
  it('filters stale ids, dedupes saved ids, and appends new agent-ranked leads', () => {
    expect(
      reconcileLeadgenLeadOrder(
        ['lead-2', 'missing', 'lead-2', 'lead-1'],
        ['lead-1', 'lead-2', 'lead-3'],
      ),
    ).toEqual(['lead-2', 'lead-1', 'lead-3']);
  });

  it('detects whether the saved order differs from the agent order', () => {
    expect(
      isLeadgenLeadOrderCustomized({
        agentOrderedLeadIds: ['lead-1', 'lead-2'],
        userOrderedLeadIds: ['lead-1', 'lead-2'],
      }),
    ).toBe(false);
    expect(
      isLeadgenLeadOrderCustomized({
        agentOrderedLeadIds: ['lead-1', 'lead-2'],
        userOrderedLeadIds: ['lead-2', 'lead-1'],
      }),
    ).toBe(true);
  });

  it('stores an empty order when the reconciled order matches the agent order', () => {
    expect(
      getPersistableLeadgenLeadOrder({
        agentOrderedLeadIds: ['lead-1', 'lead-2'],
        userOrderedLeadIds: ['lead-1', 'lead-2'],
      }),
    ).toEqual([]);
    expect(
      getPersistableLeadgenLeadOrder({
        agentOrderedLeadIds: ['lead-1', 'lead-2'],
        userOrderedLeadIds: ['lead-2', 'lead-1'],
      }),
    ).toEqual(['lead-2', 'lead-1']);
  });
});
