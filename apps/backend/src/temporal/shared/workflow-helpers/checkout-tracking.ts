import * as workflow from '@temporalio/workflow';

export type WorkflowCheckoutTrackingInput = {
  trackGaEvents: boolean;
  reason?: string;
  clientId?: string;
  sessionId?: number;
  eventSource?: 'api';
};

export type WorkflowCheckoutTrackingIdentity = {
  clientId?: string;
  sessionId?: number;
  eventSource?: 'api';
};

export type WorkflowCheckoutTracking = {
  trackGaEvents: boolean;
  reason: string;
  identity: WorkflowCheckoutTrackingIdentity;
};

export function resolveWorkflowCheckoutTracking(
  input?: WorkflowCheckoutTrackingInput,
  options: {
    toggleTrackingPatch?: 'deprecated' | 'active';
  } = {},
): WorkflowCheckoutTracking {
  const toggleTrackingPatch = options.toggleTrackingPatch ?? 'deprecated';
  const canUseTrackingFlag =
    toggleTrackingPatch === 'active'
      ? workflow.patched('toggle-tracking')
      : true;

  if (toggleTrackingPatch === 'deprecated') {
    workflow.deprecatePatch('toggle-tracking');
  }

  return {
    trackGaEvents: canUseTrackingFlag ? (input?.trackGaEvents ?? true) : true,
    reason: input?.reason ?? 'DEFAULT',
    identity: workflow.patched('ga-client-id-propagation-v1')
      ? {
          clientId: input?.clientId,
          sessionId: input?.sessionId,
          eventSource: input?.eventSource,
        }
      : {},
  };
}
