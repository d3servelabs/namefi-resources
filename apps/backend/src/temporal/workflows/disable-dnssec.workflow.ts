import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { matchAny } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { defineQuery } from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import {
  createWorkflowProgress,
  type WorkflowProgressState,
} from '../shared/workflow-helpers/workflow-progress';

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
export async function disableDnssecWorkflow(
  input: DisableDnssecWorkflowInput,
): Promise<void> {
  // Initialize progress tracking
  const progress = createWorkflowProgress<DisableDnssecStepId>([
    'check-status',
    'remove-ds-record',
    'verify-removal',
    'disable-zone-signing',
  ]);

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
        initialInterval: '2 minute',
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

  const {
    getDnssecStatusDetails,
    disassociateDelegationSigner,
    setZoneSigningFlag,
  } = standardActivities;

  const { pollDsRecordRemovalStatus, pollDsRecordRemovalPropagation } =
    longRunningActivities;

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
      const dsRemovalStatus = await pollDsRecordRemovalStatus({
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

      progress.completeStep('remove-ds-record');

      // Step 3: Verify DS record removal propagation
      progress.startStep('verify-removal', 'Waiting for DNS propagation...');

      const dsPropagationStatus = await pollDsRecordRemovalPropagation(
        input.domainName,
      );

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

    progress.completeStep(
      'disable-zone-signing',
      'DNSSEC disabled successfully',
    );
    progress.complete();
  } catch (e) {
    // Only update progress if not already failed
    if (progress.state.phase !== 'FAILED') {
      progress.fail(e instanceof Error ? e.message : String(e));
    }
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
