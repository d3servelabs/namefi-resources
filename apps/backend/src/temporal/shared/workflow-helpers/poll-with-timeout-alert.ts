import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../../shared';
import { typedProxyActivities } from './typed-proxy-activities';

const ONE_HOUR_MS = 60 * 60 * 1000;
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

interface PollWithTimeoutAlertOptions {
  /** Domain name for alert context */
  domainName: string;
  /** Human-readable label for the polling operation, e.g. "DS record removal" */
  operationLabel: string;
  /** Time before firing an alert (default: 1 hour) */
  alertThresholdMs?: number;
  /** Time before hard-failing the workflow (default: 3 hours) */
  failThresholdMs?: number;
}

/**
 * Races a polling promise against a two-phase timeout:
 * 1. After `alertThresholdMs` → sends a general alert to Namefi, continues waiting.
 * 2. After `failThresholdMs` → throws a non-retryable ApplicationFailure.
 *
 * If the polling promise resolves or rejects before either threshold, its
 * result/error is returned/thrown as-is.
 */
export async function pollWithTimeoutAlert<T>(
  pollingPromise: Promise<T>,
  options: PollWithTimeoutAlertOptions,
): Promise<T> {
  const alertMs = options.alertThresholdMs ?? ONE_HOUR_MS;
  const failMs = options.failThresholdMs ?? THREE_HOURS_MS;

  const { generalAlertNamefi } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
      retry: {
        maximumInterval: '1 minute',
        maximumAttempts: 10,
      },
    },
  });

  const info = workflow.workflowInfo();

  // Sentinel to track if polling finished before any timeout
  let pollingFinished = false;
  const pollingResult = pollingPromise.then((result) => {
    pollingFinished = true;
    return result;
  });

  // Phase 1: Wait for alert threshold
  const alertTimer = workflow.sleep(alertMs).then(async () => {
    if (pollingFinished) return;
    try {
      await generalAlertNamefi({
        title: `Polling taking too long: ${options.operationLabel}`,
        message: `Polling for "${options.operationLabel}" on ${options.domainName} has exceeded ${Math.round(alertMs / 60_000)} minutes. Will fail after ${Math.round(failMs / 60_000)} minutes total.`,
        workflowId: info.workflowId,
        runId: info.runId,
        domainName: options.domainName,
        operation: options.operationLabel,
        thresholdMinutes: Math.round(alertMs / 60_000),
      });
    } catch {
      // Alert failure should not affect the workflow
    }
  });

  // Phase 2: Hard-fail after fail threshold
  const failTimer = workflow.sleep(failMs).then(() => {
    if (pollingFinished) return undefined as T;
    throw workflow.ApplicationFailure.create({
      message: `Polling for "${options.operationLabel}" on ${options.domainName} timed out after ${Math.round(failMs / 60_000)} minutes`,
      nonRetryable: true,
      type: 'polling/timeout',
    });
  });

  // Race: polling vs fail-timer. Alert timer runs as a side-effect.
  void alertTimer;
  return Promise.race([pollingResult, failTimer]);
}
