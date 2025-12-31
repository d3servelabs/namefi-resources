import type { Nameserver } from '@namefi-astra/registrars/lib/abstract-registrar/data/nameservers';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { matchAny } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { defineQuery } from '@temporalio/workflow';
import { TEMPORAL_ENUMS, pollingOpts, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';

import {
  createWorkflowProgress,
  type WorkflowProgressState,
} from '../shared/workflow-helpers/workflow-progress';
import {
  disableDnssecWorkflow,
  getDisableDnssecProgressQuery,
} from './disable-dnssec.workflow';

/**
 * Step IDs for the change nameservers workflow.
 */
export type ChangeNameserversStepId =
  | 'disable-dnssec'
  | 'set-nameservers'
  | 'verify-change';

/**
 * Query to get the current progress state of the change nameservers workflow.
 */
export const getChangeNameserversProgressQuery = defineQuery<
  WorkflowProgressState<ChangeNameserversStepId>
>('getChangeNameserversProgress');

export interface ChangeNameserversWorkflowInput {
  domainName: PunycodeDomainName;
  nameservers: Nameserver[];
}

/**
 * This workflow is used to change the nameservers for a domain.
 * It will disable dnssec, set the nameservers to the ones from Namefi
 */
export async function changeNameserversWorkflow({
  domainName,
  nameservers,
}: ChangeNameserversWorkflowInput) {
  // Initialize progress tracking
  const progress = createWorkflowProgress<ChangeNameserversStepId>(
    ['disable-dnssec', 'set-nameservers', 'verify-change'],
    { workflowType: 'changeNameservers' },
  );

  // Get current workflow info for embedded workflow references
  const workflowInfo = workflow.workflowInfo();

  // Expose progress state via query
  workflow.setHandler(getChangeNameserversProgressQuery, () => progress.state);

  // Long-running activities configuration
  const pollingActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: pollingOpts,
  });

  // Standard activities configuration
  const standardActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: shortRunningOpts,
  });
  const {
    setNameserversForDomain,
    checkIfNameserversAreNamefiNameserversActivity,
  } = standardActivities;
  const { pollRegistrarOperationStatus } = pollingActivities;
  const { updateDomainIndexRows } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.INDEXERS,
    options: {
      ...shortRunningOpts,
      startToCloseTimeout: '2m',
    },
  });

  try {
    // Step 1: Disable DNSSEC (embedded workflow with substeps)
    progress.startStep('disable-dnssec');
    // Set nested workflow info so client can query substeps directly
    // For embedded workflows, use the same workflowId/runId as the parent
    progress.setStepNestedWorkflow('disable-dnssec', {
      workflowId: workflowInfo.workflowId,
      runId: workflowInfo.firstExecutionRunId,
      progressQueryName: getDisableDnssecProgressQuery.name,
    });
    try {
      await disableDnssecWorkflow({ domainName });
      progress.completeStep('disable-dnssec');
    } catch (error: unknown) {
      const err = error as Error & { type?: string };
      workflow.log.error(err.message);
      if (
        !(
          error instanceof workflow.ApplicationFailure &&
          matchAny(err.type, 'dnssec/not-supported', 'dnssec/disabled')
        )
      ) {
        progress.failStep('disable-dnssec', err.message);
        progress.fail(err.message);
        throw error;
      }
      // DNSSEC not supported or already disabled - skip this step
      progress.skipStep(
        'disable-dnssec',
        'DNSSEC not enabled or not supported',
      );
    }

    // Step 2: Set nameservers
    progress.startStep('set-nameservers');
    const registrarOperation = await setNameserversForDomain({
      domainName,
      nameservers,
    });

    if (!registrarOperation.operationId) {
      progress.failStep('set-nameservers', 'No operation ID returned');
      progress.fail('Nameservers change failed, no operation ID returned');
      throw workflow.ApplicationFailure.create({
        message: 'Nameservers change failed, no operation ID returned',
      });
    }
    progress.completeStep('set-nameservers');

    // Step 3: Verify change
    progress.startStep('verify-change');
    const nameserversChangeStatus = await pollRegistrarOperationStatus({
      domainName,
      registrarOperationId: registrarOperation.operationId,
    });

    if (matchAny(nameserversChangeStatus, 'FAILED', 'ERROR')) {
      progress.failStep(
        'verify-change',
        'Nameservers change verification failed',
      );
      progress.fail('Nameservers change failed');
      throw workflow.ApplicationFailure.create({
        message: 'Nameservers change failed',
      });
    }
    progress.completeStep('verify-change');

    progress.complete();
  } catch (e) {
    if (progress.state.phase !== 'FAILED') {
      progress.fail(e instanceof Error ? e.message : String(e));
    }
    throw e;
  }

  const normalizedDomainName = domainName as NamefiNormalizedDomain;
  const isUsingNamefiNameservers =
    await checkIfNameserversAreNamefiNameserversActivity(nameservers);

  await catchAndAlertLocally(
    () =>
      updateDomainIndexRows([
        {
          domainName: normalizedDomainName,
          nameservers,
          isUsingNamefiNameservers,
        },
      ]),
    {
      message: 'Failed to update domain index after nameservers change',
      details: {
        domainName,
        workflowId: workflow.workflowInfo().workflowId,
      },
    },
  );
}

/**
 * Generate a deterministic workflow ID for change nameservers operations.
 */
changeNameserversWorkflow.generateId = (
  input: ChangeNameserversWorkflowInput,
): string => {
  return `change-nameservers-[${input.domainName}]`;
};

/**
 * The progress query for this workflow.
 */
changeNameserversWorkflow.progressQuery = getChangeNameserversProgressQuery;
