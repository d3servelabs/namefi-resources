import type { Nameserver } from '@namefi-astra/registrars/lib/abstract-registrar/data/nameservers';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { matchAny } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, pollingOpts, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { disableDnssecWorkflow } from './disable-dnssec.workflow';

/**
 * This workflow is used to change the nameservers for a domain.
 * It will disable dnssec, set the nameservers to the ones from Namefi
 */
export async function changeNameserversWorkflow({
  domainName,
  nameservers,
}: { domainName: PunycodeDomainName; nameservers: Nameserver[] }) {
  // Long-running activities configuration
  const pollingActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: pollingOpts,
  });

  // Standard activities configuration
  const standardActivities = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: shortRunningOpts,
  });
  const { setNameserversForDomain } = standardActivities;
  const { pollRegistrarOperationStatus } = pollingActivities;

  try {
    await disableDnssecWorkflow({ domainName });
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

  const registrarOperation = await setNameserversForDomain({
    domainName,
    nameservers,
  });

  if (!registrarOperation.operationId) {
    throw workflow.ApplicationFailure.create({
      message: 'Nameservers change failed, no operation ID returned',
    });
  }

  const nameserversChangeStatus = await pollRegistrarOperationStatus({
    domainName,
    registrarOperationId: registrarOperation.operationId,
  });

  if (matchAny(nameserversChangeStatus, 'FAILED', 'ERROR')) {
    throw workflow.ApplicationFailure.create({
      message: 'Nameservers change failed',
    });
  }
}
