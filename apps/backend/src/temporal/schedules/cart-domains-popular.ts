/**
 * Weekly schedule for cart domain reminder emails
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';
import { weeklyCartDomainsPopularWorkflow } from '../workflows/cart-domains-popular.workflow';

const CartDomainsPopularSchedule = BaseSchedule.forWorkflowType(
  weeklyCartDomainsPopularWorkflow,
);

const config: ScheduleConfig<typeof weeklyCartDomainsPopularWorkflow> = {
  scheduleId: 'cart-domains-popular-schedule',
  workflowId: 'cart-domains-popular',
  name: 'Cart Domains Popular',
  description: 'Weekly reminder for users with cart items older than one day',
  groupId: 'user-notifications',
  cronExpressions: [
    // Every Monday at 16:00 UTC
    '0 16 * * 1',
  ],
  taskQueue: TEMPORAL_QUEUES.DEFAULT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  owner: 'growth',
  category: 'notification',
};

export const cartDomainsPopularSchedule = new CartDomainsPopularSchedule(
  config,
);

export async function submitScheduleForCartDomainsPopular() {
  return await cartDomainsPopularSchedule.submit();
}

export async function triggerCartDomainsPopularSchedule() {
  return await cartDomainsPopularSchedule.trigger();
}

export async function deleteScheduleForCartDomainsPopular() {
  return await cartDomainsPopularSchedule.delete();
}
