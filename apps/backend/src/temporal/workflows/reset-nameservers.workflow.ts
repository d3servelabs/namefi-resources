import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { WorkflowIdReusePolicy } from '@temporalio/common';
import * as workflow from '@temporalio/workflow';
import { defineQuery } from '@temporalio/workflow';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import {
  createWorkflowProgress,
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
export type ResetNameserversStepId = 'change-nameservers' | 'enable-dnssec';

/**
 * Query to get the current progress state of the reset nameservers workflow.
 */
export const getResetNameserversProgressQuery = defineQuery<
  WorkflowProgressState<ResetNameserversStepId>
>('getResetNameserversProgress');

export interface ResetNameserversWorkflowInput {
  domainName: PunycodeDomainName;
}

/**
 * This workflow is used to reset the nameservers for a domain.
 * It will disable dnssec, set the nameservers to the ones from Namefi, and enable dnssec if supported.
 */
export async function resetNameserversWorkflow({
  domainName,
}: ResetNameserversWorkflowInput) {
  // Initialize progress tracking
  const progress = createWorkflowProgress<ResetNameserversStepId>(
    ['change-nameservers', 'enable-dnssec'],
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
    if (domainDetails.supportsDnssec) {
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
