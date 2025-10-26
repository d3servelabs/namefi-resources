import * as workflow from '@temporalio/workflow';
import type { ACTIVITIES } from '../../workers/activity-registry';
import { type TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../enums';

export const typedProxyActivities = <T extends TEMPORAL_ENUMS>({
  temporalEnum,
  options,
}: {
  temporalEnum: T;
  options: Omit<workflow.ActivityOptions, 'taskQueue'>;
}) =>
  workflow.proxyActivities<ACTIVITIES[T]>({
    ...options,
    taskQueue: TEMPORAL_QUEUES[temporalEnum],
  });
