import { CHAINS_IDS, type NamefiNormalizedDomain } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { differenceInHours, getUnixTime } from 'date-fns';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { setExpirationForNamefiNft } from './mint.workflow';

export type FixNftExpirationWorkflowOutput = {
  /** Status of the NFT expiration fix operation - either SUCCESS or FAILURE */
  operationStatus: 'SUCCESS' | 'FAILURE';
  /** Transaction hash of the blockchain transaction, only present if transaction was successful */
  txHash?: string;
  /** The updated expiration time from the registrar */
  updatedExpirationTime?: Date;
  /** Error message if operation failed */
  errorMessage?: string;
};

export type FixNftExpirationWorkflowInput = {
  /** Domain name in LDH (Letter-Digit-Hyphen) format */
  normalizedDomainName: NamefiNormalizedDomain;
  /** Chain ID where the NFT exists */
  chainId: number;
};

/**
 * Temporal workflow that fixes NFT expiration dates by syncing them with the registrar.
 *
 * This workflow:
 * 1. Validates that the NFT exists and there's actually a date mismatch
 * 2. Retrieves the correct expiration date from the registrar
 * 3. Updates the NFT expiration time to match the registrar's expiration
 *
 * The workflow ensures that NFT expiration dates match the source of truth (registrar).
 * It only proceeds if there's an actual mismatch to prevent unnecessary updates.
 *
 * @param input - FixNftExpirationWorkflowInput object containing:
 *   @param input.normalizedDomainName - Domain name in normalized format
 *   @param input.chainId - Chain ID where the NFT exists
 *
 * @returns FixNftExpirationWorkflowOutput object containing:
 *   - operationStatus: Status of the operation ('SUCCESS' | 'FAILURE')
 *   - txHash?: Transaction hash if successful
 *   - updatedExpirationTime?: The new expiration time from registrar
 *   - errorMessage?: Error message if operation failed
 *
 * @throws Will throw if NFT doesn't exist or if there's no actual date mismatch
 */
export async function fixNftExpirationWorkflow({
  normalizedDomainName,
  chainId,
}: FixNftExpirationWorkflowInput): Promise<FixNftExpirationWorkflowOutput> {
  //#region Activities Defs
  const { getEppExpirationTime } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
      retry: {
        maximumAttempts: 3,
      },
    },
  });

  const { getNftExpirationTimeInSeconds } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      ...shortRunningOpts,
      retry: {
        maximumAttempts: 3,
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

  try {
    // 1. Get current NFT expiration time (this will throw if NFT doesn't exist)
    const currentNftExpirationSeconds = await getNftExpirationTimeInSeconds(
      chainId,
      normalizedDomainName,
    );
    const currentNftExpiration = new Date(currentNftExpirationSeconds * 1000);

    // 2. Get correct expiration time from registrar (source of truth)
    const registrarExpirationTime = await getEppExpirationTime({
      normalizedDomainName,
    });
    const registrarExpiration = new Date(registrarExpirationTime);

    // 3. Check if there's actually a mismatch (more than 1 day difference)
    const timeDifferenceInHours = differenceInHours(
      registrarExpiration,
      currentNftExpiration,
    );

    if (timeDifferenceInHours <= 12 /* hours */) {
      /* I would've liked to use a more precise difference, or use isSameDay, but the could be 1 second but it could be on midnight */
      workflow.log.info(
        `No significant date mismatch found (difference <= 12 hours) for ${normalizedDomainName} (chain ${chainId}). Previous: ${currentNftExpiration.toISOString()}, New: ${registrarExpiration.toISOString()}`,
      );
      return {
        operationStatus: 'SUCCESS',
        updatedExpirationTime: registrarExpiration,
        errorMessage:
          'No significant date mismatch found (difference <= 1 day)',
      };
    }

    // 4. Update NFT expiration to match registrar
    const newExpirationTimeInSeconds = getUnixTime(registrarExpiration);

    const txHash = await workflow.executeChild(setExpirationForNamefiNft, {
      taskQueue: TEMPORAL_QUEUES.MINT,
      workflowId: `fix-nft-expiration-${normalizedDomainName}-${chainId}-${newExpirationTimeInSeconds}`,
      args: [chainId, normalizedDomainName, newExpirationTimeInSeconds],
      retry: {
        maximumAttempts: 2,
      },
      workflowIdReusePolicy: 'ALLOW_DUPLICATE',
      parentClosePolicy: 'REQUEST_CANCEL',
    });

    workflow.log.info(
      `Successfully fixed NFT expiration date to match registrar for ${normalizedDomainName} (chain ${chainId}). Previous: ${currentNftExpiration.toISOString()}, New: ${registrarExpiration.toISOString()}, TxHash: ${txHash}`,
    );

    return {
      operationStatus: 'SUCCESS',
      txHash,
      updatedExpirationTime: registrarExpiration,
    };
  } catch (error: any) {
    const info = workflow.workflowInfo();

    // Send alert for failed operation
    try {
      await criticalAlertNamefi({
        title: `Fix NFT Expiration Failed (${info.workflowId})`,
        message: 'Failed to fix NFT expiration date',
        runId: info.runId,
        operation: 'FIX_NFT_EXPIRATION',
        normalizedDomainName,
        error: error.message,
      });
    } catch (alertError: any) {
      workflow.log.error(
        'Failed to send alert for fix NFT expiration failure',
        alertError,
      );
    }

    workflow.log.error(
      `Failed to fix NFT expiration date for ${normalizedDomainName} (chain ${chainId}): ${error.message}`,
    );

    return {
      operationStatus: 'FAILURE',
      errorMessage: error.message || 'Unknown error occurred',
    };
  }
}

fixNftExpirationWorkflow.generateId = (
  input: FixNftExpirationWorkflowInput,
) => {
  return `fix-nft-expiration-[${input.chainId}]-[${input.normalizedDomainName}]`;
};
fixNftExpirationWorkflow.attemptParseId = (id: string) => {
  //first attempt to parse the id as the known format
  let output = null;
  const correctRegex =
    /(admin-)?fix-nft-expiration-\[(?<chainId>\d+)\]-\[(?<domainName>.+?)\](-(?<timestamp>\d+))?/;

  const otherKnownRegex = [
    /admin-fix-nft-expiration-(?<domainName>.+?)-(?<chainId>\d+)(-(?<timestamp>\d+))?/,
  ];

  for (const regex of [correctRegex, ...otherKnownRegex]) {
    const parsedWorkflowId = regex.exec(id);
    if (parsedWorkflowId) {
      const chainId = Number.parseInt(parsedWorkflowId.groups?.chainId || '0');
      if (!Number.isSafeInteger(chainId) || !CHAINS_IDS.includes(chainId)) {
        continue;
      }
      output = {
        chainId: Number.parseInt(parsedWorkflowId.groups?.chainId || '0'),
        normalizedDomainName: parsedWorkflowId.groups?.domainName || '',
      };
      break;
    }
  }

  return output;
};
