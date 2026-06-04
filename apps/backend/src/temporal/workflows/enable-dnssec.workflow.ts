import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { OperationStatus } from '@namefi-astra/registrars/lib/abstract-registrar/data/operation-status';
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
import {
  createDecisionGateRegistry,
  runWithDecisionGate,
} from '../shared/workflow-helpers/decision-gate';
import { operationStatusSchema } from '@namefi-astra/common/contract/admin/decision-gate-response-schemas';

/**
 * Decision-gate timeouts for the DS-record poll. `ACTION_TIMEOUT` bounds the
 * (unbounded) poll — the gate cancels it on deadline and opens for an admin;
 * `DECISION_TIMEOUT` is the admin window once the gate is open.
 */
const DNSSEC_POLL_ACTION_TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 hours
const DNSSEC_POLL_DECISION_TIMEOUT_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

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
          priority: outcome === 'failure' ? 'high' : 'normal',
          relatedResources: [{ type: 'domain', identifier: input.domainName }],
          source: 'workflow:enable-dnssec',
        },
      });
    } catch {
      // Best-effort — the activity logs its own failures.
    }
  };

  // The `cancellation-and-timeout` patch is fully rolled out; deprecate it so
  // new runs unconditionally take the cancellation-aware path (the old unbounded
  // poll branch is gone).
  workflow.deprecatePatch('cancellation-and-timeout');
  // New runs wrap the (timeout-bounded) DS poll in a decision gate: if the poll
  // times out, the operation is still queued at the registrar — alert + wait for
  // an admin to verify and RETRY (re-poll) / RESPOND (verified status) / CANCEL,
  // instead of dead-ending. In-flight (pre-patch) runs keep the original path.
  // Explicit prefix so this never collides with a host workflow's own registry
  // when enable-dnssec runs embedded (e.g. inside reset/change-nameservers).
  const pollGateRegistry = workflow.patched('enable-dnssec-poll-decision-gate')
    ? createDecisionGateRegistry({ prefix: 'enable-dnssec' })
    : undefined;

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
    const registrarOperationId = registrarOperation.operationId;

    progress.completeStep('associate-ds-record');

    // Step 4: Wait for DS record propagation
    progress.startStep('verify-propagation', 'Waiting for DNS propagation...');

    // `pollDsRecordAssociationStatus` is an unbounded poll (retries forever).
    const pollDsAssociation = () =>
      pollDsRecordAssociationStatus({
        registrarOperationId,
        domainName: input.domainName,
      });

    let dsAssociationStatus: OperationStatus;
    if (pollGateRegistry) {
      // Newest runs: the gate bounds the poll by its own action deadline,
      // cancels it on expiry, and opens for an admin to verify / RETRY / RESPOND.
      dsAssociationStatus = await runWithDecisionGate({
        registry: pollGateRegistry,
        interactionId: 'ds-association-poll',
        action: pollDsAssociation,
        actionTimeoutMs: DNSSEC_POLL_ACTION_TIMEOUT_MS,
        allowedActors: ['ADMIN'],
        allowedActions: ['RETRY', 'RESPOND', 'CANCEL'],
        validateResponse: (raw) => operationStatusSchema.parse(raw),
        timeoutMs: DNSSEC_POLL_DECISION_TIMEOUT_MS,
        onTimeout: { kind: 'throw' },
        alertMessage: `DS association poll exceeded its deadline for ${input.domainName} (operationId=${registrarOperationId}); verify registrar state`,
        alertDetails: {
          domainName: input.domainName,
          registrarOperationId,
        },
      });
    } else {
      // Intermediate runs (cancellation patch, pre-gate): bounded poll that
      // throws on timeout. Kept for replay determinism of in-flight runs.
      dsAssociationStatus = await pollWithTimeoutAlert(pollDsAssociation(), {
        domainName: input.domainName,
        operationLabel: 'DS record association propagation',
      });
    }

    // Only a SUCCESSFUL terminal status means propagation is done. Anything else
    // — FAILED/ERROR, or a non-terminal SUBMITTED/IN_PROGRESS/REQUIRES_ACTION
    // (which an admin RESPOND can supply) — must NOT mark DNSSEC enabled.
    if (dsAssociationStatus !== 'SUCCESSFUL') {
      progress.failStep(
        'verify-propagation',
        `DS record association not complete (status: ${dsAssociationStatus})`,
      );

      // Rollback: Disable zone DNSSEC
      await setZoneSigningFlag(input.domainName, false);

      progress.fail('DS record association failed');
      throw workflow.ApplicationFailure.create({
        message: `DS record association failed (status: ${dsAssociationStatus})`,
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
    if (workflow.isCancellation(e)) {
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
