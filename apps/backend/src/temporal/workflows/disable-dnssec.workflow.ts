import type { PunycodeDomainName } from '@namefi-astra/registrars/data/validations';
import type { OperationStatus } from '@namefi-astra/registrars/data/types/operation-status';
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
import { runWithTestHarness } from '../shared/workflow-helpers/test-harness';
import { operationStatusSchema } from '@namefi-astra/common/contract/admin/decision-gate-response-schemas';

/**
 * Decision-gate timeouts for the DS-record polls. `ACTION_TIMEOUT` bounds the
 * (unbounded) poll — the gate cancels it on deadline and opens for an admin;
 * `DECISION_TIMEOUT` is the admin window once the gate is open.
 */
const DNSSEC_POLL_ACTION_TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 hours
const DNSSEC_POLL_DECISION_TIMEOUT_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

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
    isNonProductionEnvironment,
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

  // The `cancellation-and-timeout` patch is fully rolled out; deprecate it so
  // new runs unconditionally take the cancellation-aware path (the old unbounded
  // poll branches are gone).
  workflow.deprecatePatch('cancellation-and-timeout');
  // New runs wrap the (timeout-bounded) DS polls in a decision gate: a poll
  // timeout means the operation is still queued at the registrar, so alert +
  // wait for an admin to verify and RETRY (re-poll) / RESPOND (verified status) /
  // CANCEL. In-flight (pre-patch) runs keep the original path.
  // Explicit prefix so this never collides with a host workflow's own registry
  // when disable-dnssec runs embedded (e.g. inside change-nameservers step 1).
  const pollGateRegistry = workflow.patched('disable-dnssec-poll-decision-gate')
    ? createDecisionGateRegistry({ prefix: 'disable-dnssec' })
    : undefined;

  // In non-production only, allow an operator to force a gated poll to fail via a
  // signal (to exercise the decision gate without waiting for a real timeout).
  // Computed once, on the gated path only, so pre-patch runs add no history.
  let testHarnessEnabled = false;
  try {
    if (pollGateRegistry) {
      testHarnessEnabled = await isNonProductionEnvironment();
    }
  } catch (error) {
    workflow.log.warn('isNonProductionEnvironment failed', { data: { error } });
  }

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
      const registrarOperationId = registrarOperation.operationId;

      // Wait for DS record removal at registrar. The poll is unbounded.
      const pollDsRemoval = () =>
        pollDsRecordRemovalStatus({
          registrarOperationId,
          domainName: input.domainName,
        });

      let dsRemovalStatus: OperationStatus;
      if (pollGateRegistry) {
        // Newest runs: the gate bounds the poll by its own action deadline.
        dsRemovalStatus = await runWithDecisionGate({
          registry: pollGateRegistry,
          interactionId: 'ds-removal-status-poll',
          action: () =>
            runWithTestHarness(pollDsRemoval, {
              enabled: testHarnessEnabled,
              signalName: 'test-harness:disable-dnssec:ds-removal-status',
              delayMs: 300_000,
            }),
          actionTimeoutMs: DNSSEC_POLL_ACTION_TIMEOUT_MS,
          allowedActors: ['ADMIN'],
          allowedActions: ['RETRY', 'RESPOND', 'CANCEL'],
          validateResponse: (raw) => operationStatusSchema.parse(raw),
          timeoutMs: DNSSEC_POLL_DECISION_TIMEOUT_MS,
          onTimeout: { kind: 'throw' },
          alertMessage: `DS removal poll exceeded its deadline for ${input.domainName} (operationId=${registrarOperationId}); verify registrar state`,
          alertDetails: {
            domainName: input.domainName,
            registrarOperationId,
          },
        });
      } else {
        // Intermediate runs (cancellation patch, pre-gate): bounded poll that
        // throws on timeout. Kept for replay determinism of in-flight runs.
        dsRemovalStatus = await pollWithTimeoutAlert(pollDsRemoval(), {
          domainName: input.domainName,
          operationLabel: 'DS record removal at registrar',
        });
      }

      // Only a SUCCESSFUL terminal status means removal is done; a non-terminal
      // status (which an admin RESPOND can supply) must NOT count as removed.
      if (dsRemovalStatus !== 'SUCCESSFUL') {
        progress.failStep(
          'remove-ds-record',
          `DS record removal not complete (status: ${dsRemovalStatus})`,
        );
        progress.fail('DS record removal failed');
        throw workflow.ApplicationFailure.create({
          message: `DS record removal failed (status: ${dsRemovalStatus})`,
        });
      }

      dsWasRemoved = true;
      progress.completeStep('remove-ds-record');

      // Step 3: Verify DS record removal propagation
      progress.startStep('verify-removal', 'Waiting for DNS propagation...');

      // Unbounded poll waiting for the DS record removal to propagate.
      const pollDsPropagation = () =>
        pollDsRecordRemovalPropagation(input.domainName);

      let dsPropagationStatus: OperationStatus;
      if (pollGateRegistry) {
        // Newest runs: the gate bounds the poll by its own action deadline.
        dsPropagationStatus = await runWithDecisionGate({
          registry: pollGateRegistry,
          interactionId: 'ds-removal-propagation-poll',
          action: () =>
            runWithTestHarness(pollDsPropagation, {
              enabled: testHarnessEnabled,
              signalName: 'test-harness:disable-dnssec:ds-removal-propagation',
              delayMs: 300_000,
            }),
          actionTimeoutMs: DNSSEC_POLL_ACTION_TIMEOUT_MS,
          allowedActors: ['ADMIN'],
          allowedActions: ['RETRY', 'RESPOND', 'CANCEL'],
          validateResponse: (raw) => operationStatusSchema.parse(raw),
          timeoutMs: DNSSEC_POLL_DECISION_TIMEOUT_MS,
          onTimeout: { kind: 'throw' },
          alertMessage: `DS removal propagation poll exceeded its deadline for ${input.domainName}; verify DS record is gone`,
          alertDetails: { domainName: input.domainName },
        });
      } else {
        // Intermediate runs (cancellation patch, pre-gate): bounded poll that
        // throws on timeout. Kept for replay determinism of in-flight runs.
        dsPropagationStatus = await pollWithTimeoutAlert(pollDsPropagation(), {
          domainName: input.domainName,
          operationLabel: 'DS record removal propagation',
        });
      }

      if (dsPropagationStatus !== 'SUCCESSFUL') {
        progress.failStep(
          'verify-removal',
          `DS record removal not propagated (status: ${dsPropagationStatus})`,
        );
        progress.fail('DS record propagation failed');
        throw workflow.ApplicationFailure.create({
          message: `DS record propagation failed (status: ${dsPropagationStatus})`,
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
    if (workflow.isCancellation(e)) {
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
