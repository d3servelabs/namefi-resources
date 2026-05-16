import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { matchAny } from '@namefi-astra/utils';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { defineQuery } from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import {
  createWorkflowProgress,
  type WorkflowProgressState,
} from '../shared/workflow-helpers/workflow-progress';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';
import { pollWithTimeoutAlert } from '../shared/workflow-helpers/poll-with-timeout-alert';

/**
 * Step IDs for the disable DNSSEC workflow.
 * These are minimal identifiers - display labels are mapped on the frontend.
 */
export type DisableDnssecStepId =
  | 'check-status'
  | 'remove-ds-record'
  | 'verify-removal'
  | 'disable-zone-signing';

/**
 * Query to get the current progress state of the disable DNSSEC workflow.
 */
export const getDisableDnssecProgressQuery = defineQuery<
  WorkflowProgressState<DisableDnssecStepId>
>('getDisableDnssecProgress');

export interface DisableDnssecWorkflowInput {
  domainName: PunycodeDomainName;
  /**
   * The user who triggered the operation. When present, the workflow
   * emails them + writes an in-app notification on settlement (success
   * or failure). Absent for system-triggered runs and when invoked as a
   * child of `changeNameserversWorkflow` (the parent notifies instead).
   */
  userId?: string;
}

/**
 * Workflow to disable DNSSEC for a domain.
 *
 * Steps:
 * 1. Check current DNSSEC status
 * 2. Remove DS record from registrar
 * 3. Verify DS record removal propagation
 * 4. Disable zone signing
 */
export async function disableDnssecWorkflow(input: DisableDnssecWorkflowInput) {
  // Initialize progress tracking
  const progress = createWorkflowProgress<DisableDnssecStepId>(
    [
      'check-status',
      'remove-ds-record',
      'verify-removal',
      'disable-zone-signing',
    ],
    { workflowType: 'disableDnssec' },
  );

  // Expose progress state via query
  workflow.setHandler(getDisableDnssecProgressQuery, () => progress.state);

  // Set search attributes for querying
  workflow.upsertSearchAttributes({
    domainName: [input.domainName],
  });

  // Long-running activities configuration
  const longRunningActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      startToCloseTimeout: '1 minute',
      retry: {
        initialInterval: '30 seconds',
        backoffCoefficient: 1.5,
        maximumInterval: '2 minutes',
        maximumAttempts: undefined,
      },
    },
  });

  // Standard activities configuration
  const standardActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
    },
  });
  const indexerActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.INDEXERS,
    options: {
      ...shortRunningOpts,
      startToCloseTimeout: '2m',
    },
  });

  const {
    getDnssecStatusDetails,
    disassociateDelegationSigner,
    associateDelegationSignerWithDefaultKey,
    setZoneSigningFlag,
  } = standardActivities;

  const { pollDsRecordRemovalStatus, pollDsRecordRemovalPropagation } =
    longRunningActivities;
  const { updateDomainIndexRows } = indexerActivities;

  // Notification lane — one NOTIFY-queue activity sends the email AND
  // writes the in-app row via its `inAppNotification` carry.
  const { sendStyledEmailNotificationForUser } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.NOTIFY,
    options: { ...shortRunningOpts },
  });

  /**
   * Best-effort settlement notification. No-ops when the run wasn't
   * triggered by a user (e.g. invoked as a child of change-nameservers);
   * never lets a notification failure fail the workflow.
   */
  const notify = async (
    outcome: 'success' | 'failure',
    reason?: string,
  ): Promise<void> => {
    if (!input.userId) return;
    try {
      await sendStyledEmailNotificationForUser({
        userId: input.userId,
        title:
          outcome === 'success' ? 'DNSSEC disabled' : 'DNSSEC disable failed',
        subject:
          outcome === 'success'
            ? `DNSSEC disabled for ${input.domainName}`
            : `DNSSEC could not be disabled for ${input.domainName}`,
        showGoToDashboard: true,
        messageMarkdown:
          outcome === 'success'
            ? `DNSSEC has been turned off for **${input.domainName}**.`
            : `We couldn't disable DNSSEC for **${input.domainName}**.${
                reason ? `\n\nReason: ${reason}` : ''
              }`,
        inAppNotification: {
          priority: outcome === 'failure' ? 'high' : 'normal',
          relatedResources: [{ type: 'domain', identifier: input.domainName }],
          source: 'workflow:disable-dnssec',
        },
      });
    } catch {
      // Best-effort — the activity logs its own failures.
    }
  };

  const hasCancellationSupport = workflow.patched('cancellation-and-timeout');

  // Track whether DS was removed (for rollback on cancellation)
  let dsWasRemoved = false;

  try {
    // Step 1: Check current DNSSEC status
    progress.startStep('check-status');

    const { supportsDnssec, hasDelegationSigner, zoneHasActiveDnssec } =
      await getDnssecStatusDetails(input.domainName);

    if (!supportsDnssec) {
      progress.failStep('check-status', 'Domain does not support DNSSEC');
      progress.fail('Domain does not support DNSSEC');
      throw workflow.ApplicationFailure.create({
        message: 'Domain does not support DNSSEC',
        nonRetryable: true,
        type: 'dnssec/not-supported',
      });
    }

    if (!(hasDelegationSigner || zoneHasActiveDnssec)) {
      progress.failStep('check-status', 'DNSSEC is not enabled');
      progress.fail('DNSSEC is not enabled');
      throw workflow.ApplicationFailure.create({
        message: 'Domain does not have DNSSEC enabled',
        nonRetryable: true,
        type: 'dnssec/disabled',
      });
    }

    progress.completeStep('check-status');

    // Step 2: Remove DS record from registrar
    if (hasDelegationSigner) {
      progress.startStep('remove-ds-record');

      const registrarOperation = await disassociateDelegationSigner(
        input.domainName,
      );

      if (!registrarOperation.operationId) {
        progress.failStep(
          'remove-ds-record',
          'No operation ID returned from registrar',
        );
        progress.fail('DS record removal failed');
        throw workflow.ApplicationFailure.create({
          message: 'DS record removal failed, no operation ID returned',
        });
      }

      // Wait for DS record removal at registrar
      const dsRemovalStatus = hasCancellationSupport
        ? await pollWithTimeoutAlert(
            pollDsRecordRemovalStatus({
              registrarOperationId: registrarOperation.operationId,
              domainName: input.domainName,
            }),
            {
              domainName: input.domainName,
              operationLabel: 'DS record removal at registrar',
            },
          )
        : await pollDsRecordRemovalStatus({
            registrarOperationId: registrarOperation.operationId,
            domainName: input.domainName,
          });

      if (matchAny(dsRemovalStatus, 'FAILED', 'ERROR')) {
        progress.failStep('remove-ds-record', 'DS record removal failed');
        progress.fail('DS record removal failed');
        throw workflow.ApplicationFailure.create({
          message: 'DS record removal failed',
        });
      }

      dsWasRemoved = true;
      progress.completeStep('remove-ds-record');

      // Step 3: Verify DS record removal propagation
      progress.startStep('verify-removal', 'Waiting for DNS propagation...');

      const dsPropagationStatus = hasCancellationSupport
        ? await pollWithTimeoutAlert(
            pollDsRecordRemovalPropagation(input.domainName),
            {
              domainName: input.domainName,
              operationLabel: 'DS record removal propagation',
            },
          )
        : await pollDsRecordRemovalPropagation(input.domainName);

      if (matchAny(dsPropagationStatus, 'FAILED', 'ERROR')) {
        progress.failStep('verify-removal', 'DS record propagation failed');
        progress.fail('DS record propagation failed');
        throw workflow.ApplicationFailure.create({
          message: 'DS record propagation failed',
        });
      }

      progress.completeStep('verify-removal');
    } else {
      // No DS record to remove, skip these steps
      progress.skipStep('remove-ds-record', 'No DS record to remove');
      progress.skipStep('verify-removal', 'No DS record to verify');
    }

    // Step 4: Disable zone signing
    progress.startStep('disable-zone-signing');

    await setZoneSigningFlag(input.domainName, false);

    const normalizedDomainName = input.domainName as NamefiNormalizedDomain;
    await catchAndAlertLocally(
      () =>
        updateDomainIndexRows([
          {
            domainName: normalizedDomainName,
            dnssecStatus: {
              supportsDnssec,
              hasDelegationSigner: false,
              isUsingNamefiDelegationSigner: false,
              zoneHasActiveDnssec: false,
            },
          },
        ]),
      {
        message: 'Failed to update DNSSEC metadata after disabling DNSSEC',
        details: {
          domainName: input.domainName,
          workflowId: workflow.workflowInfo().workflowId,
        },
      },
    );

    progress.completeStep(
      'disable-zone-signing',
      'DNSSEC disabled successfully',
    );
    progress.complete();
    await notify('success');
    return progress.state;
  } catch (e) {
    // On cancellation, rollback: re-associate DS if it was removed
    if (hasCancellationSupport && workflow.isCancellation(e)) {
      await workflow.CancellationScope.nonCancellable(async () => {
        if (dsWasRemoved) {
          try {
            await associateDelegationSignerWithDefaultKey(input.domainName);
          } catch {
            // Best-effort rollback
          }
        }
      });
      progress.fail('Workflow cancelled');
      // No notification on user-initiated cancellation.
      throw e;
    }
    // Only update progress if not already failed
    if (progress.state.phase !== 'FAILED') {
      progress.fail(e instanceof Error ? e.message : String(e));
    }
    await notify('failure', e instanceof Error ? e.message : String(e));
    throw e;
  }
}

/**
 * Generate a deterministic workflow ID for disable DNSSEC operations.
 */
disableDnssecWorkflow.generateId = (
  input: DisableDnssecWorkflowInput,
): string => {
  return `disable-dnssec-[${input.domainName}]`;
};

/**
 * The progress query for this workflow.
 */
disableDnssecWorkflow.progressQuery = getDisableDnssecProgressQuery;
