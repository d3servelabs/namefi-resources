import { getExecutionContext } from '../context';
import {
  isAutomaticTemporalExecution,
  withTemporalActivityContext,
} from './context';

/**
 * Batch wrapper for multiple activities
 * Applies the same wrapper to all activities in an object
 */
export function wrapActivities<
  T extends Record<string, (...args: any[]) => any>,
>(activities: T): T {
  const wrappedActivities: any = {};

  for (const [name, activity] of Object.entries(activities)) {
    wrappedActivities[name] = withTemporalActivityContext(
      name,
      activity as any,
    );
  }

  return wrappedActivities as T;
}

/**
 * Utility function to check if current activity is running in automatic mode
 * Useful for conditional logic within activities
 */
export async function isCurrentActivityAutomatic(): Promise<boolean> {
  const context = getExecutionContext();
  return (
    context?.type === 'temporal-activity' &&
    (await isAutomaticTemporalExecution())
  );
}
