/** biome-ignore-all lint/style/useNamingConvention: alot of generics that require this */
import * as workflow from '@temporalio/workflow';
import type { ActivityOptions } from '@temporalio/workflow';
import type { TEMPORAL_ENUMS } from '../../shared/enums';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';
import type { ACTIVITIES } from '../../workers/activity-registry';

type ActivityName<TEnum extends TEMPORAL_ENUMS> = keyof ACTIVITIES[TEnum];
type ActivitiesForQueue<TEnum extends TEMPORAL_ENUMS> = ACTIVITIES[TEnum][any];

type StartActivityResult<
  TEnum extends TEMPORAL_ENUMS,
  TActivityName extends keyof TActivitiesMap,
  TActivitiesMap = ACTIVITIES[TEnum],
> = TActivitiesMap[TActivityName] extends (...args: any) => any
  ? Awaited<ReturnType<TActivitiesMap[TActivityName]>>
  : never;

export type StartActivityWorkflow<
  TEnum extends TEMPORAL_ENUMS,
  TActivityName extends ActivityName<TEnum>,
> = (input: {
  temporalEnum: TEnum;
  activityName: TActivityName;
  args?: Parameters<ActivitiesForQueue<TEnum>>;
  options?: ActivityOptions;
}) => Promise<StartActivityResult<TEnum, TActivityName>>;

/**
 * Waits for the provided delay, then invokes the given activity (must exist in the registry).
 * Uses typed generics for strong typing when temporalEnum and activityName are known,
 * while still allowing string-based activity names when typing isn't provided.
 */
export async function startActivityWorkflow<
  TEnum extends TEMPORAL_ENUMS,
  TActivityName extends ActivityName<TEnum>,
>(input: {
  temporalEnum: TEnum;
  activityName: TActivityName;
  args?: Parameters<ActivitiesForQueue<TEnum>>;
  options?: ActivityOptions;
}): Promise<unknown> {
  const { temporalEnum, activityName, args = [], options = {} } = input;

  workflow.log.info('Waiting before starting activity', {
    activityName,
    temporalEnum,
  });

  const activities = typedProxyActivities({
    temporalEnum,
    options,
  });

  const activity = (activities as Record<string, any>)[activityName as any];

  if (typeof activity !== 'function') {
    throw workflow.ApplicationFailure.create({
      message: `Activity "${activityName as any}" not found in registry for queue ${temporalEnum}`,
      nonRetryable: true,
      type: 'activity/not-found',
    });
  }

  const result = await activity(...(args as unknown[]));

  workflow.log.info('Completed activity after delay', {
    activityName,
    temporalEnum,
  });

  return {
    activityName,
    result,
  };
}
