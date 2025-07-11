import { OperationStatus } from '@namefi-astra/registrars/lib/abstract-registrar/data/operation-status';
import type {
  ChecksumWalletAddress,
  NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import {
  addYears,
  differenceInMonths,
  fromUnixTime,
  getUnixTime,
} from 'date-fns';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';
import { catchAndAlertLocally } from '../../shared/workflow-helpers/catch-and-alert-locally';
import { getDomainLevels } from '#lib/get-domain-levels';
import {
  TEMPORAL_ENUMS,
  TEMPORAL_QUEUES,
  pollingOpts,
  shortRunningOpts,
} from '../../shared';
import { setExpirationForNamefiNft } from '../mint.workflow';
import { determineDurationLimitsForRenewItems } from '#lib/domains/domainsDurationConstraints';

export type ExtendDomainRegistrationWorkflowOutput = {
  /** Status of the EPP (Extensible Provisioning Protocol) operation - either SUCCESS or FAILURE */
  eppOperationStatus: 'SUCCESS' | 'FAILURE';
  /** Transaction hash of the blockchain transaction, only present if transaction was successful */
  txHash?: string;
  /** Status of the blockchain transaction - either SUCCESS or FAILURE */
  txStatus: 'SUCCESS' | 'FAILURE';
};

export type ExtendDomainRegistrationWorkflowInput = {
  /** Ethereum address of the domain owner */
  ownerAddress: ChecksumWalletAddress;
  /** Domain name in LDH (Letter-Digit-Hyphen) format */
  normalizedDomainName: NamefiNormalizedDomain;
  /** Number of years to extend the registration */
  durationInYears: number;
  /** User ID */
  userId: string;
  /** Whether to update the domain index after extension */
  updateDomainIndex?: boolean;
};

const { submitOperationToExtendRegistrationToRegistrar, getEppExpirationTime } =
  typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
      retry: {
        maximumAttempts: 1,
      },
    },
  });

const { updateDomainIndexRows, triggerUpdateDomainIndex } =
  typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.INDEXERS,
    options: {
      ...shortRunningOpts,
      startToCloseTimeout: '2m',
    },
  });

/**
 * Temporal workflow that handles domain registration extension process.
 * This workflow coordinates the extension of domain registration period on both:
 * 1. The domain registrar side
 * 2. The corresponding NFT metadata update
 *
 * The workflow does NOT handle any payment processing - payments should be handled separately.
 *
 * Flow:
 * 1. Creates and submits extension operation to registrar via createAndSubmitOperationToExtendRegistration
 * 2. Polls for operation completion using checkExtendRegistrationOperationsStatus with retry logic
 *    - Initial retry interval: 1 minute
 *    - Maximum retry interval: 8 minutes
 *    - Maximum attempts: 10
 * 3. On success:
 *    - Retrieves new expiration time
 *    - Updates NFT expiration via child workflow (setExpirationForNamefiNft)
 *    - Marks operation as successful
 *    - Optionally notifies user
 * 4. On NFT update failure:
 *    - Sends alert via generalAlertNamefi
 *    - Operation remains marked as successful
 * 5. On operation failure:
 *    - Marks operation as failed
 *    - Optionally notifies user
 *
 * @param input - ExtendDomainRegistrationWorkflowInput object containing:
 *   @param input.ownerAddress - Ethereum address of the domain owner
 *   @param input.normalizedDomainName - Domain name in LDH (Letter-Digit-Hyphen) format
 *   @param input.durationInYears - Number of years to extend the registration
 *   @param input.notifyUser - Whether to notify the user about operation outcome
 *
 * @returns ExtendDomainRegistrationWorkflowOutput object containing:
 *   - eppOperationStatus: Status of the EPP operation ('SUCCESS' | 'FAILURE')
 *   - txHash?: Transaction hash of the blockchain transaction (if successful)
 *   - txStatus: Status of the blockchain transaction ('SUCCESS' | 'FAILURE')
 *
 * @throws Will throw if NFT expiration update fails, but registrar operation will still be marked as successful
 */
export async function extendDomainRegistrationWorkflow({
  durationInYears,
  normalizedDomainName,
  ownerAddress,
  userId,
  updateDomainIndex = true,
}: ExtendDomainRegistrationWorkflowInput): Promise<ExtendDomainRegistrationWorkflowOutput> {
  //#region Activities Defs
  const { getDomainChain, getPoweredByNamefi3PDomains } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
      retry: {
        initialInterval: '10 seconds',
        maximumInterval: '1 minutes',
        backoffCoefficient: 2,
        maximumAttempts: 10,
      },
    },
  });

  const { criticalAlertNamefi } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  //#endregion Activities Defs

  const chainId = await getDomainChain(normalizedDomainName);

  const { levels, parentDomain } = getDomainLevels(normalizedDomainName);

  let nextExpirationTime: string | Date;
  if (levels.length === 2) {
    nextExpirationTime = await _extendSldDomainAndReturnNewExpirationTime({
      normalizedDomainName,
      ownerAddress,
      durationInYears,
      chainId,
      userId,
    });
  } else if (levels.length === 3) {
    const allowedParentDomains = await getPoweredByNamefi3PDomains();
    if (
      !(
        parentDomain &&
        allowedParentDomains.includes(parentDomain as NamefiNormalizedDomain)
      )
    ) {
      throw workflow.ApplicationFailure.create({
        message: `Invalid domain name "${normalizedDomainName}", parent domain "${parentDomain}" is not allowed`,
        nonRetryable: true,
      });
    }
    nextExpirationTime = await _extend3ldDomainAndReturnNewExpirationTime({
      normalizedDomainName,
      ownerAddress,
      durationInYears,
      chainId,
      userId,
    });
  } else {
    throw workflow.ApplicationFailure.create({
      message: `Invalid domain name "${normalizedDomainName}", parent domain "${parentDomain}" is not allowed`,
      nonRetryable: true,
    });
  }
  const nextExpirationTimeInSeconds = getUnixTime(nextExpirationTime);

  try {
    const txHash = await workflow.executeChild(setExpirationForNamefiNft, {
      taskQueue: TEMPORAL_QUEUES.MINT,
      // TODO(sami -> victor): should this id be deteminstinc based on [chainId,normalizedDomainName,expirationTimeInUnix]?
      workflowId: `set-expiration-for-namefi-nft-${normalizedDomainName}-${chainId}-${nextExpirationTimeInSeconds}`,
      args: [chainId, normalizedDomainName, nextExpirationTimeInSeconds],
      retry: {
        maximumAttempts: 2,
      },
      workflowIdReusePolicy: 'ALLOW_DUPLICATE',
      workflowIdConflictPolicy: 'FAIL',
      parentClosePolicy: 'REQUEST_CANCEL',
    });

    if (updateDomainIndex) {
      await _updateDomainIndexAfterExtension({
        normalizedDomainName,
        nextExpirationTime,
      });
    }

    return {
      eppOperationStatus: 'SUCCESS',
      txHash,
      txStatus: 'SUCCESS',
    };
  } catch (_error: any) {
    const info = workflow.workflowInfo();
    try {
      await criticalAlertNamefi({
        title: `Workflow Failed (${info.workflowId})`,
        message: 'Extend NFT Expiration Not Successful',
        runId: info.runId,
        nextExpirationTimeInSeconds,
        operation: 'DOMAIN_RENEW',
        normalizedDomainName,
      });
    } catch (error: any) {
      workflow.log.error('Failed to send alert', error);
    }

    if (updateDomainIndex) {
      await _updateDomainIndexAfterExtension({
        normalizedDomainName,
        nextExpirationTime,
      });
    }

    return {
      eppOperationStatus: 'SUCCESS',
      txStatus: 'FAILURE',
    };
  }
}

async function _updateDomainIndexAfterExtension({
  normalizedDomainName,
  nextExpirationTime,
}: {
  normalizedDomainName: NamefiNormalizedDomain;
  nextExpirationTime: string | Date;
}) {
  // Update domain index after successful extension
  await catchAndAlertLocally(
    () =>
      updateDomainIndexRows([
        {
          domainName: normalizedDomainName,
          expirationTime: new Date(nextExpirationTime),
        },
      ]),
    {
      message: 'Failed to update domain index after domain extension',
      details: {
        domainName: normalizedDomainName,
        workflowId: workflow.workflowInfo().workflowId,
      },
    },
  );

  // Trigger full index update after domain extension
  await catchAndAlertLocally(triggerUpdateDomainIndex, {
    message:
      'Failed to trigger full domain index update after domain extension',
    details: {
      domainName: normalizedDomainName,
      workflowId: workflow.workflowInfo().workflowId,
    },
  });
}

async function _extendSldDomainAndReturnNewExpirationTime({
  normalizedDomainName,
  ownerAddress,
  durationInYears,
  chainId,
}: Exclude<ExtendDomainRegistrationWorkflowInput, 'updateDomainIndex'> & {
  chainId: number;
}) {
  const { pollEppExtendRegistrationStatus } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      startToCloseTimeout: '10 seconds',
      retry: {
        initialInterval: '1 minute',
        maximumInterval: '8 minutes',
        backoffCoefficient: 2,
        maximumAttempts: 20,
      },
    },
  });

  const { pollAndExpectExpirationChange } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...pollingOpts,
      retry: {
        ...pollingOpts.retry,
        initialInterval: '10 seconds',
        maximumInterval: '2 minutes',
        maximumAttempts: 30,
      },
    },
  });

  const previousExpirationTime = await getEppExpirationTime({
    normalizedDomainName,
  });
  const { operationId: externalOperationId } =
    await submitOperationToExtendRegistrationToRegistrar({
      normalizedDomainName,
      durationInYears,
    });
  if (!externalOperationId) {
    throw workflow.ApplicationFailure.create({
      nonRetryable: true,
      message: 'Failed to submit operation to extend registration',
    });
  }
  // This will keep polling until status is either SUCCESS or FAILURE
  const { status } = await pollEppExtendRegistrationStatus({
    normalizedDomainName,
    externalOperationId,
  });

  if (status !== OperationStatus.SUCCESSFUL) {
    throw workflow.ApplicationFailure.create({
      nonRetryable: true,
      message: `Renew Operation Failed From Registrar Side (Status: ${status})`,
      details: [
        {
          ownerAddress,
          normalizedDomainName,
          durationInYears,
          externalOperationId,
          chainId,
        },
      ],
    });
  }
  const nextExpirationTime = await pollAndExpectExpirationChange({
    normalizedDomainName,
    durationInYears,
    previousExpirationTime,
  });
  return nextExpirationTime;
}

async function _extend3ldDomainAndReturnNewExpirationTime({
  chainId,
  normalizedDomainName,
  durationInYears,
}: Exclude<ExtendDomainRegistrationWorkflowInput, 'updateDomainIndex'> & {
  chainId: number;
}): Promise<string | Date> {
  const { getNftExpirationTimeInSeconds } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      ...shortRunningOpts,
    },
  });
  const { getDomainDurationConstraints } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
    },
  });
  const { minYears, maxYears } =
    await getDomainDurationConstraints(normalizedDomainName);
  const nftExpirationTime = await getNftExpirationTimeInSeconds(
    chainId,
    normalizedDomainName,
  );
  const {
    minimumPossibleRenewalYears,
    maxAdditionalYears,
    activeRegistrationYears,
  } = determineDurationLimitsForRenewItems(fromUnixTime(nftExpirationTime), {
    minYears,
    maxYears,
  });

  if (maxAdditionalYears <= 0) {
    throw workflow.ApplicationFailure.create({
      nonRetryable: true,
      message: `NFT Registration Duration is currently ${maxYears} years, cannot extend registration`,
    });
  }
  if (durationInYears < minimumPossibleRenewalYears) {
    throw workflow.ApplicationFailure.create({
      nonRetryable: true,
      message: `you are trying to extend the registration for ${durationInYears} years, which is not allowed. the min additional years is ${minimumPossibleRenewalYears} years. the active registration years are ${activeRegistrationYears} years. the max total years is ${maxYears} years`,
    });
  }
  if (durationInYears > maxAdditionalYears) {
    throw workflow.ApplicationFailure.create({
      nonRetryable: true,
      message: `you are trying to extend the registration for ${durationInYears} years, which is not allowed. the max additional years is ${maxAdditionalYears} years. the active registration years are ${activeRegistrationYears} years. the max total years is ${maxYears} years`,
    });
  }
  return addYears(fromUnixTime(nftExpirationTime), durationInYears);
}
