import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { matchAny } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export async function enableDnssecWorkflow(input: {
  domainName: PunycodeDomainName;
}): Promise<void> {
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

  // Check if domain supports DNSSEC
  const {
    supportsDnssec,
    hasDelegationSigner,
    zoneHasActiveDnssec,
    isUsingNamefiDelegationSigner,
  } = await getDnssecStatusDetails(input.domainName);

  if (!supportsDnssec) {
    throw workflow.ApplicationFailure.create({
      message: 'Domain does not support DNSSEC',
      nonRetryable: true,
      type: 'dnssec/not-supported',
    });
  }

  if (isUsingNamefiDelegationSigner && zoneHasActiveDnssec) {
    throw workflow.ApplicationFailure.create({
      message: 'Domain already has DNSSEC enabled',
      nonRetryable: true,
      type: 'dnssec/enabled',
    });
  }

  if (hasDelegationSigner && !isUsingNamefiDelegationSigner) {
    // TODO: Dissociate other delegation signers
  }

  // Enable zone DNSSEC
  await setZoneSigningFlag(input.domainName, true);

  const registrarOperation = await associateDelegationSignerWithDefaultKey(
    input.domainName,
  );
  if (!registrarOperation.operationId) {
    throw workflow.ApplicationFailure.create({
      message: 'DS record association failed, no operation ID returned',
    });
  }

  // Wait for DS record association
  const dsAssociationStatus = await pollDsRecordAssociationStatus({
    registrarOperationId: registrarOperation.operationId,
    domainName: input.domainName,
  });

  if (matchAny(dsAssociationStatus, 'FAILED', 'ERROR')) {
    // Disable zone DNSSEC
    await setZoneSigningFlag(input.domainName, false);
    throw workflow.ApplicationFailure.create({
      message: 'DS record association failed',
    });
  }
}
