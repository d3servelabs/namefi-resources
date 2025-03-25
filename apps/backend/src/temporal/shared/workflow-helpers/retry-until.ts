import type { Duration } from '@temporalio/common';
import * as workflow from '@temporalio/workflow';

// TODO make more generic
// TODO Add use case for throw errors
/**
 * Retries an action until a condition is met.
 *
 * @param action - The action to retry.
 * @param retryCondition - The condition that determines if the action should be retried.
 * @param message - The message to use if the action fails after the maximum number of retries.
 * @param maxRetries - The maximum number of retries.
 * @param retryInterval - The interval between retries.
 */
export async function retryUntil<T>(
  action: () => Promise<T>,
  retryCondition: (t: T, attempt: number) => boolean,
  message = (_result: T, attempt: number) =>
    `Max retries reached, attempt: ${attempt}`,
  maxRetries = 20,
  retryInterval: Duration = '1 minute',
) {
  let res: T;
  let count = 0;
  while (true) {
    count++;

    res = await action();
    if (!retryCondition(res, count)) {
      break;
    }
    await workflow.sleep(retryInterval);
    if (count >= maxRetries) {
      throw new workflow.TemporalFailure(message(res, count));
    }
  }
  return res;
}
