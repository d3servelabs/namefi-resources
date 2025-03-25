import * as workflow from '@temporalio/workflow';

/**
 * Creates a timeout promise that rejects after the specified duration
 * @param durationInMs - Duration in milliseconds after which the promise should reject
 * @param message - Custom message to include in the rejection error
 * @returns A promise that rejects after the specified duration
 */
export function createTimeoutPromise(
  durationInMs: number,
  message: string,
): Promise<never> {
  return new Promise<never>((_, reject) => {
    workflow.sleep(durationInMs).then(() => {
      reject(new Error(`${message} after ${durationInMs}ms`));
    });
  });
}

/**
 * Executes a promise with an optional timeout
 * @param promise - The promise to execute
 * @param timeoutInMs - Optional timeout in milliseconds
 * @param timeoutMessage - Message to include in the timeout error
 * @returns The result of the promise or rejects if timeout occurs first
 */
export function executeWithTimeout<T>(
  promise: Promise<T>,
  timeoutInMs?: number,
  timeoutMessage = 'Execution timed out',
): Promise<T> {
  if (timeoutInMs) {
    const timeoutPromise = createTimeoutPromise(timeoutInMs, timeoutMessage);
    return Promise.race([promise, timeoutPromise]);
  }
  return promise;
}
