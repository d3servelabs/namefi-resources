/**
 * Schedule for the DNSViz Daily Digest workflow.
 *
 * Runs daily at 04:00 UTC — comfortably after the hourly
 * `update-domain-index-schedule` so the day's domain list is fresh.
 * Long timeout because each domain takes 30s+ for `dnsviz probe`; see
 * the workflow file's header for sizing math.
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { dnsvizDailyDigestWorkflow } from '../workflows/dnsviz-daily-digest.workflow';
import type { ScheduleConfig } from './types';
import { TEMPORAL_QUEUES } from '../shared';

const DnsvizDailyDigestSchedule = BaseSchedule.forWorkflowType(
  dnsvizDailyDigestWorkflow,
);

const config: ScheduleConfig<typeof dnsvizDailyDigestWorkflow> = {
  scheduleId: 'dnsviz-daily-digest-schedule',
  workflowId: 'dnsviz-daily-digest',
  name: 'DNSViz Daily Digest',
  description:
    'Daily DNSSEC sanity check — runs `dnsviz probe`+`grok` on every active indexed domain and emails ops a BOGUS/ERROR summary.',
  groupId: 'system-reports',
  cronExpressions: ['0 4 * * *'], // 04:00 UTC daily
  taskQueue: TEMPORAL_QUEUES.INDEXERS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  args: [
    {
      batchSize: 50,
      perDomainConcurrency: 3,
      retentionDays: 30,
    },
  ],
  workflowExecutionTimeout: '12h',
  workflowRunTimeout: '12h',
  catchupWindow: '2h',
  pauseOnFailure: false,
  owner: 'system',
  category: 'reporting',
};

export const dnsvizDailyDigestSchedule = new DnsvizDailyDigestSchedule(config);

// Legacy-style helpers, mirroring the convention in
// `export-expiration-daily-report.ts` so admin tooling can drive the schedule
// without depending on the registry indirection.
export async function submitScheduleForDnsvizDailyDigest() {
  return await dnsvizDailyDigestSchedule.submit();
}

export async function triggerDnsvizDailyDigest() {
  return await dnsvizDailyDigestSchedule.trigger();
}

export async function pauseDnsvizDailyDigestSchedule(reason?: string) {
  return await dnsvizDailyDigestSchedule.pause(reason);
}

export async function unpauseDnsvizDailyDigestSchedule(reason?: string) {
  return await dnsvizDailyDigestSchedule.unpause(reason);
}

export async function getDnsvizDailyDigestScheduleStatus() {
  return await dnsvizDailyDigestSchedule.getStatus();
}

export async function deleteDnsvizDailyDigestSchedule() {
  return await dnsvizDailyDigestSchedule.delete();
}
