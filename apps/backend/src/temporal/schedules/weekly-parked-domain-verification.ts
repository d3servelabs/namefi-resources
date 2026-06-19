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

// Dry-run variant for manual testing (run more frequently). It performs the
// same live verification + email; trigger it on demand from /admin/schedules.
const dryRunConfig: ScheduleConfig<
  typeof weeklyParkedDomainVerificationWorkflow
> = {
  ...config,
  scheduleId: 'weekly-parked-domain-verification-dry-run',
  workflowId: 'weekly-parked-domain-verification-dry-run',
  name: 'Weekly Parked-Domain Verification (Dry Run)',
  description:
    'Dry-run of the weekly parked-domain verification report for manual testing',
  cronExpressions: ['0 */6 * * *'], // every 6 hours
};

export const weeklyParkedDomainVerificationDryRunSchedule =
  new WeeklyParkedDomainVerificationSchedule(dryRunConfig);
