import type { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import type {
  ChecksumWalletAddress,
  NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { addYears, getUnixTime } from 'date-fns';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';
import { getDomainLevels } from '#lib/get-domain-levels';
import {
  TEMPORAL_ENUMS,
  TEMPORAL_QUEUES,
  shortRunningOpts,
} from '../../shared';
import { mintNamefiNFT } from '../mint.workflow';
import { domainSetupWorkflow } from './domain-setup.workflow';
import { sldRegisterOrImportWorkflow } from './sld-register-or-import.workflow';

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
}

const { generalAlertNamefi } = typedProxyActivities({
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
): Promise<void> {
  if (input.operationType !== 'REGISTER' && input.operationType !== 'IMPORT') {
    throw workflow.ApplicationFailure.create({
      message: `Invalid operation type "${input.operationType}"`,
      nonRetryable: true,
    });
  }

  const { levels, parentDomain } = getDomainLevels(input.normalizedDomainName);

  let expirationTimeInSeconds: number;
  if (levels.length === 2) {
    const details = await _acquireSldDomain(input);
    expirationTimeInSeconds = Math.floor(
      new Date(details.expirationTime).getTime() / 1000,
    );
  } else if (levels.length === 3) {
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
    expirationTimeInSeconds = getUnixTime(
      addYears(new Date(), input.durationInYears),
    );
  } else {
    throw workflow.ApplicationFailure.create({
      message: `Invalid domain name "${input.normalizedDomainName}", unsupported number of levels: ${levels.length}`,
      nonRetryable: true,
    });
  }

  try {
    await Promise.all([
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
      // TODO: different workflow for sld and 3ld
      workflow.startChild(domainSetupWorkflow, {
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        args: [
          {
            operationType: input.operationType,
            normalizedDomainName: input.normalizedDomainName,
            userId: input.userId,
            recipientWalletAddress: input.recipientWalletAddress,
            registrarKey: input.registrarKey,
          },
        ],
        workflowId: `domain-setup-${input.normalizedDomainName}`,
      }),
    ]);
  } catch (error: any) {
    workflow.log.error(error);

    const info = workflow.workflowInfo();

    await generalAlertNamefi({
      title: `Workflow Failed (${info.workflowId})`,
      message: `Post Domain ${input.operationType} And Import Not Successful`,
      runId: info.runId,
      operation: 'DOMAIN_REGISTER_AND_IMPORT',
      input,
      error,
    });
  }
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
        },
      ],
      workflowId: `domain-acquire-${input.normalizedDomainName}`,
      workflowRunTimeout: isImport ? '21 days' : /* REGISTER */ '4 hours',
    });

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
