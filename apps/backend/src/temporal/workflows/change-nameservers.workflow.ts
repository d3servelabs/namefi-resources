import type { Nameserver } from '@namefi-astra/registrars/lib/abstract-registrar/data/nameservers';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { matchAny } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { defineQuery } from '@temporalio/workflow';
import { TEMPORAL_ENUMS, pollingOpts, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';
import { pollWithTimeoutAlert } from '../shared/workflow-helpers/poll-with-timeout-alert';

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
  /**
   * The user who triggered the operation. When present, the workflow
   * emails them + writes an in-app notification on settlement (success
   * or failure). Absent for system-triggered runs — those stay silent.
   */
  userId?: string;
}

/**
 * This workflow is used to change the nameservers for a domain.
 * It will disable dnssec, set the nameservers to the ones from Namefi
 */
export async function changeNameserversWorkflow({
  domainName,
  nameservers,
  userId,
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

  const hasCancellationSupport = workflow.patched('cancellation-and-timeout');

  const { updateDomainIndexRows } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.INDEXERS,
    options: {
      ...shortRunningOpts,
      startToCloseTimeout: '2m',
    },
  });

  // Notification lane — one NOTIFY-queue activity sends the email AND
  // writes the in-app row via its `inAppNotification` carry.
  const { sendStyledEmailNotificationForUser } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.NOTIFY,
    options: { ...shortRunningOpts },
  });

  /**
   * Best-effort settlement notification. No-ops when the run wasn't
   * triggered by a user; never lets a notification failure fail the
   * workflow. The embedded `disableDnssecWorkflow` is invoked WITHOUT a
   * `userId` so only this top-level workflow notifies (no double-send).
   */
  const notify = async (
    outcome: 'success' | 'failure',
    reason?: string,
  ): Promise<void> => {
    if (!userId) return;
    try {
      await sendStyledEmailNotificationForUser({
        userId,
        title:
          outcome === 'success'
            ? 'Nameservers updated'
            : 'Nameserver update failed',
        subject:
          outcome === 'success'
            ? `Nameservers updated for ${domainName}`
            : `Nameservers could not be updated for ${domainName}`,
        showGoToDashboard: true,
        messageMarkdown:
          outcome === 'success'
            ? `The nameservers for **${domainName}** were updated successfully.`
            : `We couldn't update the nameservers for **${domainName}**.${
                reason ? `\n\nReason: ${reason}` : ''
              }`,
        inAppNotification: {
          relatedResources: [{ type: 'domain', identifier: domainName }],
          source: 'workflow:change-nameservers',
        },
      });
    } catch {
      // Best-effort — the activity logs its own failures.
    }
  };

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
    const nameserversChangeStatus = hasCancellationSupport
      ? await pollWithTimeoutAlert(
          pollRegistrarOperationStatus({
            domainName,
            registrarOperationId: registrarOperation.operationId,
          }),
          {
            domainName,
            operationLabel: 'Nameservers change verification',
          },
        )
      : await pollRegistrarOperationStatus({
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
    if (hasCancellationSupport && workflow.isCancellation(e)) {
      // No compensation needed: DNSSEC rollback handled by embedded workflow,
      // nameserver change can't be rolled back once submitted to registrar.
      progress.fail('Workflow cancelled');
      // No notification on user-initiated cancellation.
      throw e;
    }
    if (progress.state.phase !== 'FAILED') {
      progress.fail(e instanceof Error ? e.message : String(e));
    }
    await notify('failure', e instanceof Error ? e.message : String(e));
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

  await notify('success');
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
