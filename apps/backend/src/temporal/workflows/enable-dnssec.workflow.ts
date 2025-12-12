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

  const {
    getDnssecStatusDetails,
    associateDelegationSignerWithDefaultKey,
    setZoneSigningFlag,
  } = standardActivities;

  const { pollDsRecordAssociationStatus } = longRunningActivities;

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

    const dsAssociationStatus = await pollDsRecordAssociationStatus({
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
