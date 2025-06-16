import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { matchAny } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { disableDnssecWorkflow } from './disable-dnssec.workflow';

/**
 * This workflow is used to reset the nameservers for a domain.
 * It will disable dnssec, set the nameservers to the ones from Namefi, and enable dnssec if supported.
 */
export async function resetNameserversWorkflow({
  domainName,
}: { domainName: PunycodeDomainName }) {
  const {
    setNameserversForDomain,
    checkIfUsingNamefiNameservers,
    getDefaultNameservers,
    getDomainDetails,
    enableAutoDnssecForDomain,
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

  try {
    await disableDnssecWorkflow({
      domainName,
    });
  } catch (error: any) {
    workflow.log.error(error.message);
    if (
      !(
        error instanceof workflow.ApplicationFailure &&
        matchAny(error.type, 'dnssec/not-supported', 'dnssec/disabled')
      )
    ) {
      throw error;
    }
  }

  const nameservers = await getDefaultNameservers();
  await setNameserversForDomain({
    domainName,
    nameservers,
  });

  const domainDetails = await getDomainDetails(domainName);
  if (domainDetails.supportsDnssec) {
    await enableAutoDnssecForDomain(domainName);
  }
}
