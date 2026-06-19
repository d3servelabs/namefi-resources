/**
 * Weekly schedule for the parked-domain verification report.
 *
 * Sweeps all parked domains (DNS propagation, SSL, parking page, redirect),
 * then emails a summary + CSV of failures. Runs Mondays at 08:00 UTC so issues
 * are visible at the start of the week.
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { weeklyParkedDomainVerificationWorkflow } from '../workflows/weekly-parked-domain-verification.workflow';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';

const WeeklyParkedDomainVerificationSchedule = BaseSchedule.forWorkflowType(
  weeklyParkedDomainVerificationWorkflow,
);

const config: ScheduleConfig<typeof weeklyParkedDomainVerificationWorkflow> = {
  scheduleId: 'weekly-parked-domain-verification',
  workflowId: 'weekly-parked-domain-verification',
  name: 'Weekly Parked-Domain Verification',
  description:
    'Verifies all parked domains (DNS, SSL, parking page, redirect) and emails a weekly report',
  groupId: 'system-reports',
  cronExpressions: ['0 8 * * 1'], // Mondays 08:00 UTC
  taskQueue: TEMPORAL_QUEUES.INDEXERS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  args: [{}],
  workflowExecutionTimeout: '2 hours',
  workflowRunTimeout: '2 hours',
  catchupWindow: '1h',
  pauseOnFailure: false,
  owner: 'platform-team',
  category: 'reporting',
};

export const weeklyParkedDomainVerificationSchedule =
  new WeeklyParkedDomainVerificationSchedule(config);

// No separate dry-run variant: registering an every-N-hours schedule would make
// it active by default (probe load + report email noise). For manual testing,
// trigger this schedule on demand from /admin/schedules.
