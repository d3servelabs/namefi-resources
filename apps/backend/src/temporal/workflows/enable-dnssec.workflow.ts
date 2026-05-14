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
 * Step IDs for the enable DNSSEC workflow.
 * These are minimal identifiers - display labels are mapped on the frontend.
 */
export type EnableDnssecStepId =
  | 'check-support'
  | 'enable-zone-signing'
  | 'associate-ds-record'
  | 'verify-propagation';

/**
 * Query to get the current progress state of the DNSSEC workflow.
 */
export const getEnableDnssecProgressQuery = defineQuery<
  WorkflowProgressState<EnableDnssecStepId>
>('getEnableDnssecProgress');

export interface EnableDnssecWorkflowInput {
  domainName: PunycodeDomainName;
  /**
   * The user who triggered the operation. When present, the workflow
   * emails them + writes an in-app notification on settlement (success
   * or failure). Absent for system-triggered runs — those stay silent.
   */
  userId?: string;
}

/**
 * Workflow to enable DNSSEC for a domain.
 *
 * Steps:
 * 1. Check if domain supports DNSSEC
 * 2. Enable zone signing
 * 3. Associate delegation signer record
 * 4. Verify DS record propagation
 */
export async function enableDnssecWorkflow(
  input: EnableDnssecWorkflowInput,
): Promise<void> {
  // Initialize progress tracking
  const progress = createWorkflowProgress<EnableDnssecStepId>(
    [
      'check-support',
      'enable-zone-signing',
      'associate-ds-record',
      'verify-propagation',
    ],
    { workflowType: 'enableDnssec' },
  );

  // Expose progress state via query
  workflow.setHandler(getEnableDnssecProgressQuery, () => progress.state);

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
        initialInterval: '10 seconds',
        maximumInterval: '1 minute',
        backoffCoefficient: 2,
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
    associateDelegationSignerWithDefaultKey,
    setZoneSigningFlag,
  } = standardActivities;

  const { pollDsRecordAssociationStatus } = longRunningActivities;
  const { updateDomainIndexRows } = indexerActivities;

  // Notification lane — one NOTIFY-queue activity sends the email AND
  // writes the in-app row via its `inAppNotification` carry.
  const { sendStyledEmailNotificationForUser } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.NOTIFY,
    options: { ...shortRunningOpts },
  });

  /**
   * Best-effort settlement notification. No-ops when the run wasn't
   * triggered by a user; never lets a notification failure fail the
   * workflow (mirrors the deferred-DS workflow's `notify()` pattern).
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
          outcome === 'success' ? 'DNSSEC enabled' : 'DNSSEC enable failed',
        subject:
          outcome === 'success'
            ? `DNSSEC enabled for ${input.domainName}`
            : `DNSSEC could not be enabled for ${input.domainName}`,
        showGoToDashboard: true,
        messageMarkdown:
          outcome === 'success'
            ? `DNSSEC is now active for **${input.domainName}**.`
            : `We couldn't enable DNSSEC for **${input.domainName}**.${
                reason ? `\n\nReason: ${reason}` : ''
              }`,
        inAppNotification: {
          relatedResources: [{ type: 'domain', identifier: input.domainName }],
          source: 'workflow:enable-dnssec',
        },
      });
    } catch {
      // Best-effort — the activity logs its own failures.
    }
  };

  const hasCancellationSupport = workflow.patched('cancellation-and-timeout');

  try {
    // Step 1: Check if domain supports DNSSEC
    progress.startStep('check-support');

    const {
      supportsDnssec,
      hasDelegationSigner,
      zoneHasActiveDnssec,
      isUsingNamefiDelegationSigner,
    } = await getDnssecStatusDetails(input.domainName);

    if (!supportsDnssec) {
      progress.failStep('check-support', 'Domain does not support DNSSEC');
      progress.fail('Domain does not support DNSSEC');
      throw workflow.ApplicationFailure.create({
        message: 'Domain does not support DNSSEC',
        nonRetryable: true,
        type: 'dnssec/not-supported',
      });
    }

    if (isUsingNamefiDelegationSigner && zoneHasActiveDnssec) {
      progress.failStep('check-support', 'DNSSEC is already enabled');
      progress.fail('DNSSEC is already enabled');
      throw workflow.ApplicationFailure.create({
        message: 'Domain already has DNSSEC enabled',
        nonRetryable: true,
        type: 'dnssec/enabled',
      });
    }

    if (hasDelegationSigner && !isUsingNamefiDelegationSigner) {
      // TODO: Dissociate other delegation signers
      progress.updateMessage(
        'check-support',
        'Existing DS record will be replaced',
      );
    }

    progress.completeStep('check-support');

    // Step 2: Enable zone signing
    progress.startStep('enable-zone-signing');

    await setZoneSigningFlag(input.domainName, true);

    progress.completeStep('enable-zone-signing');

    // Step 3: Associate DS record with registrar
    progress.startStep('associate-ds-record');

    const registrarOperation = await associateDelegationSignerWithDefaultKey(
      input.domainName,
    );

    if (!registrarOperation.operationId) {
      progress.failStep(
        'associate-ds-record',
        'No operation ID returned from registrar',
      );
      progress.fail('DS record association failed');
      throw workflow.ApplicationFailure.create({
        message: 'DS record association failed, no operation ID returned',
      });
    }

    progress.completeStep('associate-ds-record');

    // Step 4: Wait for DS record propagation
    progress.startStep('verify-propagation', 'Waiting for DNS propagation...');

    const dsAssociationStatus = hasCancellationSupport
      ? await pollWithTimeoutAlert(
          pollDsRecordAssociationStatus({
            registrarOperationId: registrarOperation.operationId,
            domainName: input.domainName,
          }),
          {
            domainName: input.domainName,
            operationLabel: 'DS record association propagation',
          },
        )
      : await pollDsRecordAssociationStatus({
          registrarOperationId: registrarOperation.operationId,
          domainName: input.domainName,
        });

    if (matchAny(dsAssociationStatus, 'FAILED', 'ERROR')) {
      progress.failStep('verify-propagation', 'DS record propagation failed');

      // Rollback: Disable zone DNSSEC
      await setZoneSigningFlag(input.domainName, false);

      progress.fail('DS record association failed');
      throw workflow.ApplicationFailure.create({
        message: 'DS record association failed',
      });
    }

    progress.completeStep('verify-propagation', 'DNSSEC enabled successfully');

    const normalizedDomainName = input.domainName as NamefiNormalizedDomain;
    await catchAndAlertLocally(
      () =>
        updateDomainIndexRows([
          {
            domainName: normalizedDomainName,
            dnssecStatus: {
              supportsDnssec,
              hasDelegationSigner: true,
              isUsingNamefiDelegationSigner: true,
              zoneHasActiveDnssec: true,
            },
          },
        ]),
      {
        message: 'Failed to update DNSSEC metadata after enabling DNSSEC',
        details: {
          domainName: input.domainName,
          workflowId: workflow.workflowInfo().workflowId,
        },
      },
    );

    progress.complete();
    await notify('success');
  } catch (e) {
    // On cancellation during polling/activities, rollback zone signing
    if (hasCancellationSupport && workflow.isCancellation(e)) {
      await workflow.CancellationScope.nonCancellable(async () => {
        try {
          await setZoneSigningFlag(input.domainName, false);
        } catch {
          // Best-effort rollback
        }
      });
      progress.fail('Workflow cancelled');
      // No notification on user-initiated cancellation — the user
      // already knows; they pressed cancel.
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
 * Generate a deterministic workflow ID for enable DNSSEC operations.
 */
enableDnssecWorkflow.generateId = (
  input: EnableDnssecWorkflowInput,
): string => {
  return `enable-dnssec-[${input.domainName}]`;
};

/**
 * The progress query for this workflow.
 */
enableDnssecWorkflow.progressQuery = getEnableDnssecProgressQuery;
