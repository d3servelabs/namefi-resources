import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { matchAny } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export async function disableDnssecWorkflow(input: {
  domainName: PunycodeDomainName;
}): Promise<void> {
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

  // Check if domain supports DNSSEC
  const { supportsDnssec, hasDelegationSigner, zoneHasActiveDnssec } =
    await getDnssecStatusDetails(input.domainName);
  if (!supportsDnssec) {
    throw workflow.ApplicationFailure.create({
      message: 'Domain does not support DNSSEC',
      nonRetryable: true,
      type: 'dnssec/not-supported',
    });
  }
  if (!(hasDelegationSigner || zoneHasActiveDnssec)) {
    throw workflow.ApplicationFailure.create({
      message: 'Domain does not have DNSSEC enabled',
      nonRetryable: true,
      type: 'dnssec/disabled',
    });
  }

  if (hasDelegationSigner) {
    // Dissociate DS record
    const registrarOperation = await disassociateDelegationSigner(
      input.domainName,
    );
    if (!registrarOperation.operationId) {
      throw workflow.ApplicationFailure.create({
        message: 'DS record removal failed, no operation ID returned',
      });
    }

    // Wait for DS record removal
    const dsRemovalStatus = await pollDsRecordRemovalStatus({
      registrarOperationId: registrarOperation.operationId,
      domainName: input.domainName,
    });

    if (matchAny(dsRemovalStatus, 'FAILED', 'ERROR')) {
      throw workflow.ApplicationFailure.create({
        message: 'DS record removal failed',
      });
    }

    // Wait for DS record propagation
    const dsPropagationStatus = await pollDsRecordRemovalPropagation(
      input.domainName,
    );
    if (matchAny(dsPropagationStatus, 'FAILED', 'ERROR')) {
      throw workflow.ApplicationFailure.create({
        message: 'DS record propagation failed',
      });
    }
  }
  // Disable zone DNSSEC
  await setZoneSigningFlag(input.domainName, false);
}
