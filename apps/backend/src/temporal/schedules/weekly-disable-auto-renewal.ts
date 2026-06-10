/**
 * Weekly schedule to disable auto-renewal for all SLD domains at registrar level
 *
 * This schedule ensures that no domains have auto-renewal enabled at the registrar level,
 * as we want to control renewal through our own system only.
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from './base-schedule';
import { TEMPORAL_QUEUES } from '../shared';
import type { ScheduleConfig } from './types';
import { weeklyDisableAutoRenewalWorkflow } from '../workflows/weekly-disable-auto-renewal.workflow';
import { Registrars } from '@namefi-astra/registrars/registrars-keys';

const WeeklyDisableAutoRenewalSchedule = BaseSchedule.forWorkflowType(
  weeklyDisableAutoRenewalWorkflow,
);

// Main production schedule (all registrars)
const weeklyDisableAutoRenewalConfig: ScheduleConfig<
  typeof weeklyDisableAutoRenewalWorkflow
> = {
  scheduleId: 'weekly-disable-auto-renewal',
  workflowId: 'weekly-disable-auto-renewal-scheduled',
  name: 'Weekly Auto-Renewal Disabling',
  description:
    'Disables auto-renewal for all SLD domains at registrar level to ensure only our system controls renewals',
  groupId: 'domain-maintenance',
  cronExpressions: [
    // Run every Sunday at 2:00 AM UTC (low traffic time)
    '0 2 * * 0',
  ],
  taskQueue: TEMPORAL_QUEUES.DOMAINS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP, // Skip if previous run is still running
  args: [
    {
      dryRun: false,
      concurrency: 5, // Process 5 domains at a time to avoid rate limits
    },
  ],
  workflowExecutionTimeout: '2 hours', // Allow plenty of time for large domain lists
  workflowRunTimeout: '2 hours',
  catchupWindow: '1 hour', // Allow catchup for missed executions within 1 hour
  pauseOnFailure: false, // Continue running even if individual executions fail
  owner: 'platform-team',
  category: 'maintenance',
};

export const weeklyDisableAutoRenewalSchedule =
  new WeeklyDisableAutoRenewalSchedule(weeklyDisableAutoRenewalConfig);

// Dry run schedule for testing
const dryRunConfig: ScheduleConfig<typeof weeklyDisableAutoRenewalWorkflow> = {
  scheduleId: 'weekly-disable-auto-renewal-dry-run',
  workflowId: 'weekly-disable-auto-renewal-dry-run-scheduled',
  name: 'Weekly Auto-Renewal Disabling (Dry Run)',
  description:
    'Dry run version of the weekly auto-renewal disabling schedule for testing',
  groupId: 'domain-maintenance',
  cronExpressions: ['0 * * * *'], // Run every hour for testing
  taskQueue: TEMPORAL_QUEUES.DOMAINS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  args: [
    {
      dryRun: true,
      concurrency: 10, // Can be more aggressive in dry run
    },
  ],
  workflowExecutionTimeout: '2 hours',
  workflowRunTimeout: '2 hours',
  catchupWindow: '1 hour',
  pauseOnFailure: false,
  owner: 'platform-team',
  category: 'maintenance',
};

export const weeklyDisableAutoRenewalDryRunSchedule =
  new WeeklyDisableAutoRenewalSchedule(dryRunConfig);

// Route53 specific schedule
const route53Config: ScheduleConfig<typeof weeklyDisableAutoRenewalWorkflow> = {
  scheduleId: 'weekly-disable-auto-renewal-route53',
  workflowId: 'weekly-disable-auto-renewal-route53-scheduled',
  name: 'Weekly Auto-Renewal Disabling (Route53)',
  description:
    'Disables auto-renewal for all SLD domains at Route53 registrar level',
  groupId: 'domain-maintenance',
  cronExpressions: ['0 2 * * 0'], // Sunday 2 AM UTC
  taskQueue: TEMPORAL_QUEUES.DOMAINS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  args: [
    {
      dryRun: false,
      registrar: Registrars.Route53,
      concurrency: 5,
    },
  ],
  workflowExecutionTimeout: '2 hours',
  workflowRunTimeout: '2 hours',
  catchupWindow: '1 hour',
  pauseOnFailure: false,
  owner: 'platform-team',
  category: 'maintenance',
};

export const weeklyDisableAutoRenewalRoute53Schedule =
  new WeeklyDisableAutoRenewalSchedule(route53Config);

// Dynadot GDG specific schedule
const dynadotGdgConfig: ScheduleConfig<
  typeof weeklyDisableAutoRenewalWorkflow
> = {
  scheduleId: 'weekly-disable-auto-renewal-dynadot-gdg',
  workflowId: 'weekly-disable-auto-renewal-dynadot-gdg-scheduled',
  name: 'Weekly Auto-Renewal Disabling (Dynadot GDG)',
  description:
    'Disables auto-renewal for all SLD domains at Dynadot GDG registrar level',
  groupId: 'domain-maintenance',
  cronExpressions: ['0 2 * * 0'], // Sunday 2 AM UTC
  taskQueue: TEMPORAL_QUEUES.DOMAINS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  args: [
    {
      dryRun: false,
      registrar: Registrars.DynadotGdg,
      concurrency: 5,
    },
  ],
  workflowExecutionTimeout: '2 hours',
  workflowRunTimeout: '2 hours',
  catchupWindow: '1 hour',
  pauseOnFailure: false,
  owner: 'platform-team',
  category: 'maintenance',
};

export const weeklyDisableAutoRenewalDynadotGdgSchedule =
  new WeeklyDisableAutoRenewalSchedule(dynadotGdgConfig);

// Dynadot Regular specific schedule
const dynadotRegularConfig: ScheduleConfig<
  typeof weeklyDisableAutoRenewalWorkflow
> = {
  scheduleId: 'weekly-disable-auto-renewal-dynadot-regular',
  workflowId: 'weekly-disable-auto-renewal-dynadot-regular-scheduled',
  name: 'Weekly Auto-Renewal Disabling (Dynadot Regular)',
  description:
    'Disables auto-renewal for all SLD domains at Dynadot Regular registrar level',
  groupId: 'domain-maintenance',
  cronExpressions: ['0 2 * * 0'], // Sunday 2 AM UTC
  taskQueue: TEMPORAL_QUEUES.DOMAINS,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  args: [
    {
      dryRun: false,
      registrar: Registrars.DynadotRegular,
      concurrency: 5,
    },
  ],
  workflowExecutionTimeout: '2 hours',
  workflowRunTimeout: '2 hours',
  catchupWindow: '1 hour',
  pauseOnFailure: false,
  owner: 'platform-team',
  category: 'maintenance',
};

export const weeklyDisableAutoRenewalDynadotRegularSchedule =
  new WeeklyDisableAutoRenewalSchedule(dynadotRegularConfig);

// Convenience functions for creating schedules with predefined configurations
export const createWeeklyDisableAutoRenewalSchedule = () =>
  weeklyDisableAutoRenewalSchedule;
export const createDryRunSchedule = () =>
  weeklyDisableAutoRenewalDryRunSchedule;
export const createRoute53Schedule = () =>
  weeklyDisableAutoRenewalRoute53Schedule;
export const createDynadotGdgSchedule = () =>
  weeklyDisableAutoRenewalDynadotGdgSchedule;
export const createDynadotRegularSchedule = () =>
  weeklyDisableAutoRenewalDynadotRegularSchedule;

// Generic function to create registrar-specific schedule with custom options
export const createRegistrarSpecificSchedule = (
  registrar: Registrars,
  dryRun = false,
) => {
  const config: ScheduleConfig<typeof weeklyDisableAutoRenewalWorkflow> = {
    scheduleId: `weekly-disable-auto-renewal-${registrar}${dryRun ? '-dry-run' : ''}`,
    workflowId: `weekly-disable-auto-renewal-${registrar}${dryRun ? '-dry-run' : ''}-scheduled`,
    name: `Weekly Auto-Renewal Disabling (${registrar.toUpperCase()})${dryRun ? ' - Dry Run' : ''}`,
    description: `Disables auto-renewal for all SLD domains at ${registrar} registrar level${dryRun ? ' (dry run for testing)' : ''}`,
    groupId: 'domain-maintenance',
    cronExpressions: dryRun ? ['0 */2 * * *'] : ['0 2 * * 0'], // Every 2 hours for dry run, weekly for production
    taskQueue: TEMPORAL_QUEUES.DOMAINS,
    overlapPolicy: ScheduleOverlapPolicy.SKIP,
    args: [
      {
        dryRun,
        registrar,
        concurrency: 5,
      },
    ],
    workflowExecutionTimeout: '2 hours',
    workflowRunTimeout: '2 hours',
    catchupWindow: '1 hour',
    pauseOnFailure: false,
    owner: 'platform-team',
    category: 'maintenance',
  };

  return new WeeklyDisableAutoRenewalSchedule(config);
};

// Legacy functions for backward compatibility
export const submitWeeklyDisableAutoRenewalSchedule = async () => {
  return await weeklyDisableAutoRenewalSchedule.submit();
};

export const submitDryRunSchedule = async () => {
  return await weeklyDisableAutoRenewalDryRunSchedule.submit();
};

export const submitRoute53Schedule = async () => {
  return await weeklyDisableAutoRenewalRoute53Schedule.submit();
};

export const submitDynadotGdgSchedule = async () => {
  return await weeklyDisableAutoRenewalDynadotGdgSchedule.submit();
};

export const submitDynadotRegularSchedule = async () => {
  return await weeklyDisableAutoRenewalDynadotRegularSchedule.submit();
};

export const submitAllRegistrarSchedules = async () => {
  await Promise.all([
    submitRoute53Schedule(),
    submitDynadotGdgSchedule(),
    submitDynadotRegularSchedule(),
  ]);
};
