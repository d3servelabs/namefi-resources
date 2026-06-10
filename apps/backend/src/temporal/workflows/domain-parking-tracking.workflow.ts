import type { PunycodeDomainName } from '@namefi-astra/registrars/data/validations';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TEMPORAL_ENUMS, pollingOpts, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import * as workflow from '@temporalio/workflow';
import {
  resolveWorkflowCheckoutTracking,
  type WorkflowCheckoutTrackingIdentity,
  type WorkflowCheckoutTrackingInput,
} from '../shared/workflow-helpers/checkout-tracking';

export interface DomainParkingTrackingWorkflowInput {
  domainName: NamefiNormalizedDomain;
  userId: string;
  orderId?: string;
  orderItemId?: string;
  registrar?: string;
  dnsProvider?: 'NAMEFI' | 'OTHER';
  gaEventTracking?: WorkflowCheckoutTrackingInput;
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
  const gaTracking = resolveWorkflowCheckoutTracking(input.gaEventTracking, {
    toggleTrackingPatch: 'active',
  });

  if (!gaTracking.trackGaEvents) {
    workflow.log.info(
      'Skipping parking and DNS GA tracking because tracking is disabled',
      {
        domainName: input.domainName,
        orderId: input.orderId,
        orderItemId: input.orderItemId,
        gaEventTrackingReason: gaTracking.reason,
      },
    );
    return;
  }

  await Promise.allSettled([
    _parkingPropagated(input, gaTracking.identity),
    _dnsRecordsPropagated(input, gaTracking.identity),
  ]);
}

async function _parkingPropagated(
  input: DomainParkingTrackingWorkflowInput,
  gaEventIdentity: WorkflowCheckoutTrackingIdentity,
) {
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
      identity: gaEventIdentity,
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
    identity: gaEventIdentity,
  });
}
async function _dnsRecordsPropagated(
  input: DomainParkingTrackingWorkflowInput,
  gaEventIdentity: WorkflowCheckoutTrackingIdentity,
): Promise<void> {
  if (!workflow.patched('fix-dns-records-propagated')) {
    await pollDefaultNsPropagated(input.domainName as PunycodeDomainName);

    await gaEventDnsRecordsPropagated({
      userId: input.userId,
      orderId: input.orderId,
      orderItemId: input.orderItemId,
      normalizedDomainName: input.domainName,
      dnsProvider: input.dnsProvider || 'NAMEFI',
      identity: gaEventIdentity,
    });
  } else {
    if (input.dnsProvider === 'OTHER') {
      await gaEventDnsRecordsPropagated({
        userId: input.userId,
        orderId: input.orderId,
        orderItemId: input.orderItemId,
        normalizedDomainName: input.domainName,
        dnsProvider: input.dnsProvider,
        identity: gaEventIdentity,
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
        identity: gaEventIdentity,
      });
    }
  }
}

domainParkingTrackingWorkflow.generateId = (
  input: DomainParkingTrackingWorkflowInput,
): string => {
  const trackingScope =
    input.orderItemId ??
    (input.orderId ? `${input.orderId}-${input.domainName}` : input.domainName);
  return `domain-parking-tracking-[${trackingScope}]`;
};
