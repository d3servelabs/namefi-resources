import { ScheduleOverlapPolicy } from '@temporalio/client';
import { temporalClient } from '../../client';
import { TEMPORAL_QUEUES } from '../../shared';
import { periodAwardWorkflow } from '../../workflows/hunt/period-award.workflow';

const WORKFLOW_ID = 'period-award';
const workflowType = periodAwardWorkflow;

/**
 * Submit the schedule for the daily award workflow
 * Runs every day at 00:05 to award the previous day's top domains
 */
export const submitScheduleForDailyAward = async () => {
  const schedule = await temporalClient.schedule.create({
    scheduleId: 'daily-award-schedule',
    spec: {
      cronExpressions: ['5 0 * * *'], // every day at 00:05
    },
    policies: {
      overlap: ScheduleOverlapPolicy.SKIP, // Skip if previous run is still executing
    },
    action: {
      type: 'startWorkflow',
      workflowType,
      taskQueue: TEMPORAL_QUEUES.HUNT,
      workflowId: `${WORKFLOW_ID}-daily`,
      args: [{ type: 'DAILY' }], // Award daily period
    },
  });
  console.log('Daily award schedule created', schedule);
};

/**
 * Submit the schedule for the weekly award workflow
 * Runs every Monday at 00:10 to award the previous week's top domains
 */
export const submitScheduleForWeeklyAward = async () => {
  const schedule = await temporalClient.schedule.create({
    scheduleId: 'weekly-award-schedule',
    spec: {
      cronExpressions: ['10 0 * * 1'], // every Monday at 00:10
    },
    policies: {
      overlap: ScheduleOverlapPolicy.SKIP, // Skip if previous run is still executing
    },
    action: {
      type: 'startWorkflow',
      workflowType,
      taskQueue: TEMPORAL_QUEUES.HUNT,
      workflowId: `${WORKFLOW_ID}-weekly`,
      args: [{ type: 'WEEKLY' }], // Award weekly period
    },
  });
  console.log('Weekly award schedule created', schedule);
};

/**
 * Submit the schedule for the monthly award workflow
 * Runs on the 1st of every month at 00:15 to award the previous month's top domains
 */
export const submitScheduleForMonthlyAward = async () => {
  const schedule = await temporalClient.schedule.create({
    scheduleId: 'monthly-award-schedule',
    spec: {
      cronExpressions: ['15 0 1 * *'], // 1st of every month at 00:15
    },
    policies: {
      overlap: ScheduleOverlapPolicy.SKIP, // Skip if previous run is still executing
    },
    action: {
      type: 'startWorkflow',
      workflowType,
      taskQueue: TEMPORAL_QUEUES.HUNT,
      workflowId: `${WORKFLOW_ID}-monthly`,
      args: [{ type: 'MONTHLY' }], // Award monthly period
    },
  });
  console.log('Monthly award schedule created', schedule);
};

/**
 * Submit the schedule for the yearly award workflow
 * Runs on January 1st at 00:20 to award the previous year's top domains
 */
export const submitScheduleForYearlyAward = async () => {
  const schedule = await temporalClient.schedule.create({
    scheduleId: 'yearly-award-schedule',
    spec: {
      cronExpressions: ['20 0 1 1 *'], // January 1st at 00:20
    },
    policies: {
      overlap: ScheduleOverlapPolicy.SKIP, // Skip if previous run is still executing
    },
    action: {
      type: 'startWorkflow',
      workflowType,
      taskQueue: TEMPORAL_QUEUES.HUNT,
      workflowId: `${WORKFLOW_ID}-yearly`,
      args: [{ type: 'YEARLY' }], // Award yearly period
    },
  });
  console.log('Yearly award schedule created', schedule);
};

/**
 * Submit all period award schedules
 */
export const submitAllPeriodAwardSchedules = async () => {
  await Promise.all([
    // We are not awarding daily or yearly periods at the moment.
    submitScheduleForWeeklyAward(),
    submitScheduleForMonthlyAward(),
  ]);
  console.log('All period award schedules created');
};
