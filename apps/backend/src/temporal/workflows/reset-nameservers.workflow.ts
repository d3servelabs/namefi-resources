import type { PunycodeDomainName } from '@namefi-astra/registrars/data/validations';
import { WorkflowIdReusePolicy } from '@temporalio/common';
import * as workflow from '@temporalio/workflow';
import { defineQuery } from '@temporalio/workflow';
import {
  TEMPORAL_ENUMS,
  TEMPORAL_QUEUES,
  pollingOpts,
  shortRunningOpts,
} from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { pollWithTimeoutAlert } from '../shared/workflow-helpers/poll-with-timeout-alert';
import {
  createWorkflowProgress,
  type WorkflowProgressManager,
  type WorkflowProgressState,
} from '../shared/workflow-helpers/workflow-progress';
import {
  changeNameserversWorkflow,
  getChangeNameserversProgressQuery,
} from './change-nameservers.workflow';
import {
  enableDnssecWorkflow,
  getEnableDnssecProgressQuery,
} from './enable-dnssec.workflow';

/**
 * Step IDs for the reset nameservers workflow.
 */
export type ResetNameserversStepId =
  | 'change-nameservers'
  | 'verify-ns-propagation'
  | 'enable-dnssec';

/**
 * Query to get the current progress state of the reset nameservers workflow.
 */
export const getResetNameserversProgressQuery = defineQuery<
  WorkflowProgressState<ResetNameserversStepId>
>('getResetNameserversProgress');

export interface ResetNameserversWorkflowInput {
  domainName: PunycodeDomainName;
  /**
   * When explicitly `false`, skip enabling DNSSEC even if the domain supports
   * it. Defaults to enabling (current behavior) when omitted, so existing
   * callers and in-flight runs are unaffected.
   */
  enableDnssec?: boolean;
}

/**
 * Poll public DNS until the freshly-set Namefi nameservers resolve, so a DS
 * record is never published against nameservers that aren't serving the zone
 * yet (which would break DNSSEC validation). Tracks the `verify-ns-propagation`
 * progress step. Skips the wait when DNSSEC won't be enabled — there's nothing
 * downstream that requires propagation in that case.
 *
 * The poll itself is unbounded; `pollWithTimeoutAlert` alerts the team after the
 * default threshold and hard-fails the workflow if propagation never completes.
 */
async function verifyNameserverPropagation({
  progress,
  pollDefaultNsPropagated,
  domainName,
  willEnableDnssec,
}: {
  progress: WorkflowProgressManager<ResetNameserversStepId>;
  pollDefaultNsPropagated: (domainName: PunycodeDomainName) => Promise<void>;
  domainName: PunycodeDomainName;
  willEnableDnssec: boolean;
}): Promise<void> {
  if (!willEnableDnssec) {
    progress.skipStep('verify-ns-propagation', 'DNSSEC not being enabled');
    return;
  }

  progress.startStep(
    'verify-ns-propagation',
    'Waiting for nameserver propagation...',
  );
  await pollWithTimeoutAlert(pollDefaultNsPropagated(domainName), {
    domainName,
    operationLabel: 'Nameserver propagation',
  });
  progress.completeStep('verify-ns-propagation', 'Nameservers propagated');
}

/**
 * This workflow is used to reset the nameservers for a domain.
 * It will disable dnssec, set the nameservers to the ones from Namefi, and enable dnssec if supported.
 */
export async function resetNameserversWorkflow({
  domainName,
  enableDnssec,
}: ResetNameserversWorkflowInput) {
  // New runs add an explicit nameserver-propagation poll between changing the
  // nameservers and enabling DNSSEC. Guarded by a patch so in-flight (pre-patch)
  // runs keep the original two-step shape and replay deterministically.
  const verifyNsPropagation = workflow.patched(
    'reset-nameservers-verify-ns-propagation',
  );

  // New runs let the enable-dnssec child outlive this workflow if an ancestor
  // closes early — e.g. the REGISTER domain-setup path, which spawns this
  // workflow as a child and closes at ~4h. With the default TERMINATE policy
  // that close would kill the child's multi-day DS-association decision gate
  // before it can resolve. Patched so in-flight runs keep the original
  // TERMINATE behavior and replay deterministically.
  const abandonEnableDnssecChild = workflow.patched(
    'reset-nameservers-abandon-enable-dnssec-child',
  );

  // Initialize progress tracking
  const progress = createWorkflowProgress<ResetNameserversStepId>(
    verifyNsPropagation
      ? ['change-nameservers', 'verify-ns-propagation', 'enable-dnssec']
      : ['change-nameservers', 'enable-dnssec'],
    { workflowType: 'resetNameservers' },
  );

  // Get current workflow info for embedded workflow references
  const workflowInfo = workflow.workflowInfo();

  // Expose progress state via query
  workflow.setHandler(getResetNameserversProgressQuery, () => progress.state);

  const {
    checkIfUsingNamefiNameservers,
    getDefaultNameservers,
    getDomainDetails,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
    },
  });

  // Unbounded poll (retries forever under `pollingOpts`); bounded at the call
  // site by `pollWithTimeoutAlert`.
  const { pollDefaultNsPropagated } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: pollingOpts,
  });

  try {
    if (await checkIfUsingNamefiNameservers(domainName)) {
      throw workflow.ApplicationFailure.create({
        message: 'nameservers-already-set-correctly',
        nonRetryable: true,
      });
    }

    // Step 1: Change nameservers (embedded workflow with substeps)
    progress.startStep('change-nameservers');
    // For embedded workflows, use the same workflowId/runId as the parent
    progress.setStepNestedWorkflow('change-nameservers', {
      workflowId: workflowInfo.workflowId,
      runId: workflowInfo.firstExecutionRunId,
      progressQueryName: getChangeNameserversProgressQuery.name,
    });
    const nameservers = await getDefaultNameservers();
    await changeNameserversWorkflow({
      domainName,
      nameservers,
    });
    progress.completeStep('change-nameservers');

    // Step 2: Enable DNSSEC (child workflow - optional)
    const domainDetails = await getDomainDetails(domainName);

    // Wait for the freshly-set nameservers to resolve in public DNS before
    // enabling DNSSEC (new runs only). Skipped for in-flight runs via the patch.
    const willEnableDnssec =
      enableDnssec !== false && domainDetails.supportsDnssec;
    if (verifyNsPropagation) {
      await verifyNameserverPropagation({
        progress,
        pollDefaultNsPropagated,
        domainName,
        willEnableDnssec,
      });
    }

    if (enableDnssec === false) {
      progress.skipStep('enable-dnssec', 'DNSSEC disabled for this domain');
    } else if (domainDetails.supportsDnssec) {
      progress.startStep('enable-dnssec');
      const childWorkflowId = `enable-dnssec-${domainName}`;
      // For child workflows, use the child's workflowId
      // Note: We don't have the runId until the child starts, but the workflowId is enough
      progress.setStepNestedWorkflow('enable-dnssec', {
        workflowId: childWorkflowId,
        runId: '', // Will be resolved by the client using the workflowId
        progressQueryName: getEnableDnssecProgressQuery.name,
      });
      await workflow.executeChild(enableDnssecWorkflow, {
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        workflowId: childWorkflowId,
        workflowIdReusePolicy: WorkflowIdReusePolicy.ALLOW_DUPLICATE,
        // Survive an early-closing ancestor so the child's decision gate can
        // still resolve (default is TERMINATE). Guarded for replay determinism.
        ...(abandonEnableDnssecChild && {
          parentClosePolicy: 'ABANDON' as const,
        }),
        args: [
          {
            domainName,
          },
        ],
      });
      progress.completeStep('enable-dnssec');
    } else {
      progress.skipStep('enable-dnssec', 'Domain does not support DNSSEC');
    }

    progress.complete();
  } catch (e) {
    if (progress.state.phase !== 'FAILED') {
      progress.fail(e instanceof Error ? e.message : String(e));
    }
    throw e;
  }
}

/**
 * Generate a deterministic workflow ID for reset nameservers operations.
 */
resetNameserversWorkflow.generateId = (
  input: ResetNameserversWorkflowInput,
): string => {
  return `reset-nameservers-[${input.domainName}]`;
};

/**
 * The progress query for this workflow.
 */
resetNameserversWorkflow.progressQuery = getResetNameserversProgressQuery;
