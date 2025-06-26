import type { Duration } from '@temporalio/common';
import * as workflow from '@temporalio/workflow';
import { min } from 'ramda';
import type { StripeRefundStatus } from '../activities/helpers/stripePaymentHelpers';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

const FINISHED_STATUSES = new Set<StripeRefundStatus>([
  'failed',
  'canceled',
  'succeeded',
]);
const SLEEP_TIMERS: Duration[] = [
  '1 minute',
  '2 minutes',
  '3 minutes',
  '5 minutes',
  '30 minutes',
  '1 hour',
  '2 hours',
  '6 hours',
  '12 hours',
  '1 day',
];

export interface MonitorStripeRefundStatusWorkflowInput {
  stripeRefundId: string;
}

export interface MonitorStripeRefundStatusWorkflowOutput {
  stripeRefundStatus: StripeRefundStatus;
}

export interface StripeRefundStatusUpdate {
  newStripeRefundStatus: StripeRefundStatus;
}

export const StripeRefundStatusUpdateSignal = workflow.defineSignal<
  [StripeRefundStatusUpdate]
>('stripeRefundStatusUpdateSignal');

export async function MonitorStripeRefundStatusWorkflow({
  stripeRefundId,
}: MonitorStripeRefundStatusWorkflowInput): Promise<MonitorStripeRefundStatusWorkflowOutput> {
  const callbackStatusIsFinishedStatus = new workflow.Trigger<boolean>();

  const { getStripeRefundStatus } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  let polledRefundStatus: StripeRefundStatus = 'pending';
  let callbackRefundStatus: StripeRefundStatus = 'pending';
  let pollingAttempts = 0;

  workflow.setHandler(
    StripeRefundStatusUpdateSignal,

    ({ newStripeRefundStatus }: StripeRefundStatusUpdate) => {
      callbackRefundStatus = newStripeRefundStatus;
      if (FINISHED_STATUSES.has(callbackRefundStatus)) {
        callbackStatusIsFinishedStatus.resolve(true);
      }
    },
  );

  try {
    while (true) {
      await Promise.race([
        callbackStatusIsFinishedStatus,
        workflow.sleep(
          SLEEP_TIMERS[min(pollingAttempts, SLEEP_TIMERS.length - 1)],
        ),
      ]);

      if (FINISHED_STATUSES.has(callbackRefundStatus)) {
        return { stripeRefundStatus: callbackRefundStatus };
      }

      polledRefundStatus =
        ((await getStripeRefundStatus({
          stripeRefundId,
        })) as StripeRefundStatus) ?? 'pending';
      if (FINISHED_STATUSES.has(polledRefundStatus)) {
        return { stripeRefundStatus: polledRefundStatus };
      }

      pollingAttempts++;
    }
  } catch (error) {
    throw workflow.ApplicationFailure.create({
      message: `Failure while monitoring Stripe Refund with ID: ${stripeRefundId}`,
      cause: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
