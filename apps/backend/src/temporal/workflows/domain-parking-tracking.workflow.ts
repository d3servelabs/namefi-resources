import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TEMPORAL_ENUMS, pollingOpts, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import * as workflow from '@temporalio/workflow';

export interface DomainParkingTrackingWorkflowInput {
  domainName: NamefiNormalizedDomain;
  userId: string;
  orderId?: string;
  orderItemId?: string;
  registrar?: string;
  dnsProvider?: 'NAMEFI' | 'OTHER';
  gaEventTracking?: {
    trackGaEvents: boolean;
    reason?: string;
  };
}

const pollingActivities = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: pollingOpts,
});
const standardActivities = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: shortRunningOpts,
});

const { pollDomainParkingResponse, pollDefaultNsPropagated } =
  pollingActivities;
const {
  getNonUserSpecificDomainPreferencesAndConfig,
  gaEventDnsRecordsPropagated,
  gaEventParkingFinished,
} = standardActivities;

const { parseDomainName: parseDomainNameActivity } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: shortRunningOpts,
});

export async function domainParkingTrackingWorkflow(
  input: DomainParkingTrackingWorkflowInput,
): Promise<void> {
  if (workflow.patched('toggle-tracking')) {
    const trackGaEvents = input.gaEventTracking?.trackGaEvents ?? true;
    const gaEventTrackingReason = input.gaEventTracking?.reason ?? 'DEFAULT';

    if (!trackGaEvents) {
      workflow.log.info(
        'Skipping parking and DNS GA tracking because tracking is disabled',
        {
          domainName: input.domainName,
          orderId: input.orderId,
          orderItemId: input.orderItemId,
          gaEventTrackingReason,
        },
      );
      return;
    }
  }

  await Promise.allSettled([
    _parkingPropagated(input),
    _dnsRecordsPropagated(input),
  ]);
}

async function _parkingPropagated(input: DomainParkingTrackingWorkflowInput) {
  const { autoParkEnabled } =
    await getNonUserSpecificDomainPreferencesAndConfig(input.domainName);

  if (!autoParkEnabled) {
    await gaEventParkingFinished({
      userId: input.userId,
      orderId: input.orderId,
      orderItemId: input.orderItemId,
      normalizedDomainName: input.domainName,
      registrarKey: input.registrar,
      optOut: true,
      status: 'SUCCESS',
    });
    return;
  }

  await pollDomainParkingResponse({ domainName: input.domainName });

  await gaEventParkingFinished({
    userId: input.userId,
    orderId: input.orderId,
    orderItemId: input.orderItemId,
    normalizedDomainName: input.domainName,
    registrarKey: input.registrar,
    optOut: false,
    status: 'SUCCESS',
  });
}
async function _dnsRecordsPropagated(
  input: DomainParkingTrackingWorkflowInput,
): Promise<void> {
  if (!workflow.patched('fix-dns-records-propagated')) {
    await pollDefaultNsPropagated(input.domainName as PunycodeDomainName);

    await gaEventDnsRecordsPropagated({
      userId: input.userId,
      orderId: input.orderId,
      orderItemId: input.orderItemId,
      normalizedDomainName: input.domainName,
      dnsProvider: input.dnsProvider || 'NAMEFI',
    });
  } else {
    if (input.dnsProvider === 'OTHER') {
      await gaEventDnsRecordsPropagated({
        userId: input.userId,
        orderId: input.orderId,
        orderItemId: input.orderItemId,
        normalizedDomainName: input.domainName,
        dnsProvider: input.dnsProvider,
      });
      return;
    }
    const parsedDomainName = workflow.patched('parse-domain-name-as-activity')
      ? await parseDomainNameActivity(input.domainName)
      : parseDomainName(input.domainName);
    if (parsedDomainName.valid) {
      if (parsedDomainName.registryType === 'traditional') {
        await pollDefaultNsPropagated(input.domainName as PunycodeDomainName);
      }
      await gaEventDnsRecordsPropagated({
        userId: input.userId,
        orderId: input.orderId,
        orderItemId: input.orderItemId,
        normalizedDomainName: input.domainName,
        dnsProvider: input.dnsProvider || 'NAMEFI',
      });
    }
  }
}

domainParkingTrackingWorkflow.generateId = (
  input: DomainParkingTrackingWorkflowInput,
): string => {
  return `domain-parking-tracking-[${input.domainName}]`;
};
