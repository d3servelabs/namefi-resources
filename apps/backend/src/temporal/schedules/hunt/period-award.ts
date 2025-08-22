/**
 * Schedules for Period Award workflow
 * Awards top domains for different time periods (daily, weekly, monthly, yearly)
 */

import { ScheduleOverlapPolicy } from '@temporalio/client';
import { BaseSchedule } from '../base-schedule';
import { periodAwardWorkflow } from '../../workflows/hunt/period-award.workflow';
import type { ScheduleConfig } from '../types';
import { TEMPORAL_QUEUES } from '../../shared';

const PeriodAwardSchedule = BaseSchedule.forWorkflowType(periodAwardWorkflow);

// Daily Award Schedule
const dailyAwardConfig: ScheduleConfig<typeof periodAwardWorkflow> = {
  scheduleId: 'daily-award-schedule',
  workflowId: 'period-award-daily',
  name: 'Daily Period Award',
  description: 'Awards top domains from the previous day',
  groupId: 'period-awards',
  cronExpressions: ['5 0 * * *'], // every day at 00:05
  taskQueue: TEMPORAL_QUEUES.HUNT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  args: [{ type: 'DAILY' }],
  owner: 'hunt-team',
  category: 'hunt',
};

export const dailyAwardSchedule = new PeriodAwardSchedule(dailyAwardConfig);

// Weekly Award Schedule
const weeklyAwardConfig: ScheduleConfig<typeof periodAwardWorkflow> = {
  scheduleId: 'weekly-award-schedule',
  workflowId: 'period-award-weekly',
  name: 'Weekly Period Award',
  description: 'Awards top domains from the previous week',
  groupId: 'period-awards',
  cronExpressions: ['10 0 * * 1'], // every Monday at 00:10
  taskQueue: TEMPORAL_QUEUES.HUNT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  args: [{ type: 'WEEKLY' }],
  owner: 'hunt-team',
  category: 'hunt',
};

export const weeklyAwardSchedule = new PeriodAwardSchedule(weeklyAwardConfig);

// Monthly Award Schedule
const monthlyAwardConfig: ScheduleConfig<typeof periodAwardWorkflow> = {
  scheduleId: 'monthly-award-schedule',
  workflowId: 'period-award-monthly',
  name: 'Monthly Period Award',
  description: 'Awards top domains from the previous month',
  groupId: 'period-awards',
  cronExpressions: ['15 0 1 * *'], // 1st of every month at 00:15
  taskQueue: TEMPORAL_QUEUES.HUNT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  args: [{ type: 'MONTHLY' }],
  owner: 'hunt-team',
  category: 'hunt',
};

export const monthlyAwardSchedule = new PeriodAwardSchedule(monthlyAwardConfig);

// Yearly Award Schedule
const yearlyAwardConfig: ScheduleConfig<typeof periodAwardWorkflow> = {
  scheduleId: 'yearly-award-schedule',
  workflowId: 'period-award-yearly',
  name: 'Yearly Period Award',
  description: 'Awards top domains from the previous year',
  groupId: 'period-awards',
  cronExpressions: ['20 0 1 1 *'], // January 1st at 00:20
  taskQueue: TEMPORAL_QUEUES.HUNT,
  overlapPolicy: ScheduleOverlapPolicy.SKIP,
  args: [{ type: 'YEARLY' }],
  owner: 'hunt-team',
  category: 'hunt',
};

export const yearlyAwardSchedule = new PeriodAwardSchedule(yearlyAwardConfig);

// Legacy functions for backward compatibility
export const submitScheduleForDailyAward = async () => {
  return await dailyAwardSchedule.submit();
};

export const submitScheduleForWeeklyAward = async () => {
  return await weeklyAwardSchedule.submit();
};

export const submitScheduleForMonthlyAward = async () => {
  return await monthlyAwardSchedule.submit();
};

export const submitScheduleForYearlyAward = async () => {
  return await yearlyAwardSchedule.submit();
};

export const submitAllPeriodAwardSchedules = async () => {
  await Promise.all([
    // We are not awarding daily or yearly periods at the moment.
    submitScheduleForWeeklyAward(),
    submitScheduleForMonthlyAward(),
  ]);
};
