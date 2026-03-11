import type { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import type {
  ChecksumWalletAddress,
  NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { addDays, addYears, getUnixTime } from 'date-fns';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';
import { getDomainLevels } from '#lib/get-domain-levels';
import {
  TEMPORAL_ENUMS,
  TEMPORAL_QUEUES,
  shortRunningOpts,
} from '../../shared';
import { catchAndAlertLocally } from '../../shared/workflow-helpers/catch-and-alert-locally';
import { mintNamefiNFT } from '../mint.workflow';
import { domainSetupWorkflow } from './domain-setup.workflow';
import { sldRegisterOrImportWorkflow } from './sld-register-or-import.workflow';
import { resolve } from '../../../utils/resolve';
import { eppRegisterOrImportWorkflow } from './epp-register-or-import.workflow';
import { domainParkingTrackingWorkflow } from '../domain-parking-tracking.workflow';

export interface AcquireDomainWorkflowInput {
  operationType: 'REGISTER' | 'IMPORT';
  userId: string;
  recipientWalletAddress: ChecksumWalletAddress;
  chainId: number;
  normalizedDomainName: NamefiNormalizedDomain;
  durationInYears: number;
  registrarKey: Registrars;
  encryptedEppAuthorizationCode?: string | null;
  encryptionKeyId?: string | null;
  orderId?: string;
  orderItemId?: string;
  gaEventTracking?: {
    trackGaEvents: boolean;
    reason?: string;
  };
}

export type AcquireDomainWorkflowOutput = {
  mintTxHash?: string;
};

const {
  generalAlertNamefi,
  criticalAlertNamefi,
  getConfig,
  triggerSyncPonderIndex,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    ...shortRunningOpts,
    retry: {
      maximumInterval: '1 minute',
    },
  },
});

const { getPoweredByNamefi3PDomains } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: {
    ...shortRunningOpts,
  },
});
export async function acquireDomainWorkflow(
  input: AcquireDomainWorkflowInput,
): Promise<AcquireDomainWorkflowOutput> {
  if (input.operationType !== 'REGISTER' && input.operationType !== 'IMPORT') {
    throw workflow.ApplicationFailure.create({
      message: `Invalid operation type "${input.operationType}"`,
      nonRetryable: true,
    });
  }

  const { levels, parentDomain } = getDomainLevels(input.normalizedDomainName);

  let registrarKey: string;
  let expirationTimeInSeconds: number;
  let failOnMintingError = false;
  if (levels.length === 2) {
    const details = await _acquireSldDomain(input);
    registrarKey = details.registrarKey;
    expirationTimeInSeconds = getUnixTime(details.expirationTime);
  } else if (levels.length >= 3) {
    failOnMintingError = true; // Subdomains require NFT minting to be successful
    const allowedParentDomains = await getPoweredByNamefi3PDomains();

    if (
      !(
        parentDomain &&
        allowedParentDomains.includes(parentDomain as NamefiNormalizedDomain)
      )
    ) {
      throw workflow.ApplicationFailure.create({
        message: `Invalid domain name "${input.normalizedDomainName}", parent domain "${parentDomain}" is not allowed`,
        nonRetryable: true,
      });
    }
    const expirationTime =
      input.durationInYears === 0
        ? addDays(
            new Date(),
            await getConfig('ZERO_PAYMENT_REGISTRATION_TRIAL_DAYS'),
          )
        : addYears(new Date(), input.durationInYears);
    expirationTimeInSeconds = getUnixTime(expirationTime);
    registrarKey = 'namefi';
  } else {
    throw workflow.ApplicationFailure.create({
      message: `Invalid domain name "${input.normalizedDomainName}", unsupported number of levels: ${levels.length}`,
      nonRetryable: true,
    });
  }

  const results = await Promise.all([
    resolve(
      workflow.executeChild(mintNamefiNFT, {
        taskQueue: TEMPORAL_QUEUES.MINT,
        args: [
          {
            chainId: input.chainId,
            toAddress: input.recipientWalletAddress,
            normalizedDomainName: input.normalizedDomainName,
            expirationTimeInSeconds,
          },
        ],
        workflowId: `mint-namefi-nft-${input.normalizedDomainName}`,
      }),
    ),
    resolve(
      workflow.startChild(domainSetupWorkflow, {
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        args: [
          {
            operationType: input.operationType,
            normalizedDomainName: input.normalizedDomainName,
            userId: input.userId,
            recipientWalletAddress: input.recipientWalletAddress,
            registrarKey: input.registrarKey,
            options: {
              autoPark: true,
            },
          },
        ],
        workflowId: `domain-setup-${input.normalizedDomainName}`,
      }),
    ),
  ]);

  const analyticsWorkflowStart = await resolve(
    workflow.startChild(domainParkingTrackingWorkflow, {
      taskQueue: TEMPORAL_QUEUES.DOMAINS,
      args: [
        {
          domainName: input.normalizedDomainName,
          userId: input.userId,
          orderId: input.orderId,
          orderItemId: input.orderItemId,
          registrar: registrarKey,
          dnsProvider: input.operationType === 'REGISTER' ? 'NAMEFI' : 'OTHER',
          gaEventTracking: input.gaEventTracking,
        },
      ],
      workflowId: `domain-parking-dns-analytics-${input.normalizedDomainName}`,
      parentClosePolicy: 'ABANDON',
    }),
  );
  if (analyticsWorkflowStart.failed) {
    await criticalAlertNamefi({
      title: `Workflow Failed (domainParkingAnalytics) (${input.normalizedDomainName})`,
      message: `Post Domain ${input.operationType} And Import Not Successful`,
    });
  }

  const mintResult = results[0];
  const errors = results
    .filter(({ failed }) => failed)
    .map(({ error }) => error);
  const mintingError = mintResult.error;

  const info = workflow.workflowInfo();

  if (errors.length > 0) {
    await criticalAlertNamefi({
      title: `Workflow Failed (${info.workflowId})`,
      message: `Post Domain ${input.operationType} And Import Not Successful`,
      runId: info.runId,
      operation: 'DOMAIN_REGISTER_AND_IMPORT',
      input,
      errors,
    });
  }

  // For subdomains, NFT minting is critical - if it fails, the entire workflow should fail
  // For traditional domains, minting failure can be handled gracefully as domain registration still succeeded
  if (failOnMintingError && mintingError) {
    workflow.log.error(
      `Subdomain ${input.normalizedDomainName} acquisition failed - minting is critical for subdomains`,
    );
    throw workflow.ApplicationFailure.create({
      message: `Failed to acquire subdomain ${input.normalizedDomainName}: NFT minting is required but failed`,
      nonRetryable: true,
      cause: mintingError,
    });
  }

  const mintTxHash = mintResult.success ? mintResult.result : undefined;
  if (workflow.patched('trigger-managed-index-update')) {
    const isManagedIndexEnabled = await getConfig('PONDER_INDEXER_URL');
    if (isManagedIndexEnabled && mintTxHash) {
      void catchAndAlertLocally(triggerSyncPonderIndex, {
        message:
          'Failed to trigger update Namefi NFT index schedule after successful mint',
        details: {
          normalizedDomainName: input.normalizedDomainName,
          mintTxHash,
          workflowId: info.workflowId,
        },
      });
    }
  }

  return { mintTxHash };
}

async function _acquireSldDomain(input: AcquireDomainWorkflowInput) {
  const isImport = input.operationType === 'IMPORT';

  if (
    isImport &&
    !(input.encryptedEppAuthorizationCode && input.encryptionKeyId)
  ) {
    throw workflow.ApplicationFailure.create({
      message: 'Authorization code is required for domain import operations',
      nonRetryable: true,
    });
  }

  let details: Awaited<ReturnType<typeof sldRegisterOrImportWorkflow>>;
  try {
    if (workflow.patched('use-new-epp-workflow')) {
      const useNewEppWorkflow = true;

      details = await workflow.executeChild(
        useNewEppWorkflow
          ? eppRegisterOrImportWorkflow
          : sldRegisterOrImportWorkflow,
        {
          args: [
            {
              operationType: input.operationType,
              recipientWalletAddress: input.recipientWalletAddress,
              chainId: input.chainId,
              normalizedDomainName: input.normalizedDomainName,
              durationInYears: input.durationInYears,
              registrarKey: input.registrarKey,
              encryptedEppAuthorizationCode: isImport
                ? input.encryptedEppAuthorizationCode
                : undefined,
              encryptionKeyId: isImport ? input.encryptionKeyId : undefined,
              orderId: input.orderId,
              orderItemId: input.orderItemId,
              userId: input.userId,
            },
          ],
          workflowId: `eppRegisterOrImport-[${input.normalizedDomainName}]`,
          workflowRunTimeout: isImport ? '21 days' : /* REGISTER */ '4 hours',
        },
      );
    } else {
      details = await workflow.executeChild(sldRegisterOrImportWorkflow, {
        args: [
          {
            operationType: input.operationType,
            recipientWalletAddress: input.recipientWalletAddress,
            chainId: input.chainId,
            normalizedDomainName: input.normalizedDomainName,
            durationInYears: input.durationInYears,
            registrarKey: input.registrarKey,
            encryptedEppAuthorizationCode: isImport
              ? input.encryptedEppAuthorizationCode
              : undefined,
            encryptionKeyId: isImport ? input.encryptionKeyId : undefined,
            orderId: input.orderId,
            orderItemId: input.orderItemId,
            userId: input.userId,
          },
        ],
        workflowId: `eppRegisterOrImport-[${input.normalizedDomainName}]`,
        workflowRunTimeout: isImport ? '21 days' : /* REGISTER */ '4 hours',
      });
    }

    return details;
  } catch (error: any) {
    workflow.log.error(error);

    const info = workflow.workflowInfo();

    await generalAlertNamefi({
      title: `Workflow Failed (${info.workflowId})`,
      message: `Domain ${input.operationType} And Import Not Successful`,
      runId: info.runId,
      operation: 'DOMAIN_REGISTER_AND_IMPORT',
      input,
      error,
    });

    throw error;
  }
}

acquireDomainWorkflow.generateId = (input: AcquireDomainWorkflowInput) => {
  return `acquire-domain-[${input.normalizedDomainName}]`;
};

acquireDomainWorkflow.attemptParseId = (id: string) => {
  const parsedWorkflowId = /acquire-domain-\[?(?<domainName>.+)\]?/.exec(id);
  if (parsedWorkflowId) {
    return {
      normalizedDomainName: parsedWorkflowId.groups?.domainName || '',
    };
  }
  return null;
};
