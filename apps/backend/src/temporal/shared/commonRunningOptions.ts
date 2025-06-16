import type * as workflow from '@temporalio/workflow';

export const shortRunningOpts: workflow.ActivityOptions = {
  startToCloseTimeout: '1 minute',
  retry: {
    initialInterval: '2 seconds',
    maximumInterval: '5 minutes',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
};
export const longRunningOpts: workflow.ActivityOptions = {
  startToCloseTimeout: '1 hour',
  retry: {
    initialInterval: '2 seconds',
    maximumInterval: '2 hours',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
};

export const pollingOpts: workflow.ActivityOptions = {
  startToCloseTimeout: '1 minute',
  retry: {
    initialInterval: '2 minutes',
    maximumInterval: '2 minutes',
    maximumAttempts: undefined,
  },
};
