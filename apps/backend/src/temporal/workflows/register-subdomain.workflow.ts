import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { addYears, getUnixTime } from 'date-fns';
import { shortRunningOpts } from '../shared/commonRunningOptions';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../shared/enums';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { mintNamefiNFT } from './mint.workflow';

export async function registerSubdomainWorkflow({
  normalizedDomainName,
  chainId,
  toAddress,
  durationInYears,
  noExpiration = false,
}: {
  normalizedDomainName: NamefiNormalizedDomain;
  chainId: number;
  toAddress: `0x${string}`;
  durationInYears: number;
  noExpiration?: boolean;
}): Promise<string> {
  const expirationTimeInSeconds = noExpiration
    ? 0
    : getUnixTime(addYears(new Date(), durationInYears));

  await workflow.executeChild(mintNamefiNFT, {
    args: [
      {
        normalizedDomainName,
        chainId,
        toAddress,
        expirationTimeInSeconds,
      },
    ],
    taskQueue: TEMPORAL_QUEUES.MINT,
    workflowId: `mint-${normalizedDomainName}-${chainId}-${toAddress}-${expirationTimeInSeconds}`,
  });

  await workflow.startChild(domainSetupWorkflow, {
    args: [normalizedDomainName],
    parentClosePolicy: 'ABANDON',
    workflowId: `domain-setup-${normalizedDomainName}-${chainId}-${toAddress}-${expirationTimeInSeconds}`,
  });

  // Return a message
  return `Completed greeting workflow for ${normalizedDomainName}`;
}

export async function domainSetupWorkflow(
  normalizedDomainName: NamefiNormalizedDomain,
) {
  // Get reference to activities
  const { parkDomain } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
    },
  });

  await parkDomain(normalizedDomainName);
}
