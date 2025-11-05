import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { WorkflowIdReusePolicy } from '@temporalio/common';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { changeNameserversWorkflow } from './change-nameservers.workflow';
import { enableDnssecWorkflow } from './enable-dnssec.workflow';

/**
 * This workflow is used to reset the nameservers for a domain.
 * It will disable dnssec, set the nameservers to the ones from Namefi, and enable dnssec if supported.
 */
export async function resetNameserversWorkflow({
  domainName,
}: {
  domainName: PunycodeDomainName;
}) {
  const {
    checkIfUsingNamefiNameservers,
    getDefaultNameservers,
    getDomainDetails,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
    },
  });

  if (await checkIfUsingNamefiNameservers(domainName)) {
    throw workflow.ApplicationFailure.create({
      message: 'nameservers-already-set-correctly',
      nonRetryable: true,
    });
  }

  const nameservers = await getDefaultNameservers();
  await changeNameserversWorkflow({
    domainName,
    nameservers,
  });

  const domainDetails = await getDomainDetails(domainName);
  if (domainDetails.supportsDnssec) {
    await workflow.executeChild(enableDnssecWorkflow, {
      taskQueue: TEMPORAL_QUEUES.DOMAINS,
      workflowId: `enable-dnssec-${domainName}`,
      workflowIdReusePolicy: WorkflowIdReusePolicy.ALLOW_DUPLICATE,
      args: [
        {
          domainName,
        },
      ],
    });
  }
}
