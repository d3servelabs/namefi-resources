import type { PostProcessOrderItem } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export interface PostProcessOrderItemWorkflowInput {
  orderId: string;
  orderItemId: string;
  userId: string;
  normalizedDomainName: NamefiNormalizedDomain;
  postProcessOrderItem: PostProcessOrderItem;
}

export async function postProcessOrderItemWorkflow(
  input: PostProcessOrderItemWorkflowInput,
): Promise<void> {
  const {
    addDnsRecordsForZone,
    setDnsRecordsForZone,
    updateDomainPreferencesAndConfig,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
    },
  });

  const { normalizedDomainName, postProcessOrderItem } = input;

  workflow.log.info('Post-processing order item', {
    orderItemId: input.orderItemId,
    domain: normalizedDomainName,
  });
  const shouldUnpark = postProcessOrderItem.actions.some(
    (action) => action.scope === 'dns-records',
  );

  if (shouldUnpark) {
    await updateDomainPreferencesAndConfig(normalizedDomainName, input.userId, {
      autoParkEnabled: false,
    });
  }

  for (const action of postProcessOrderItem.actions) {
    if (action.scope !== 'dns-records') {
      workflow.log.warn('Skipping unsupported post-process scope', {
        orderItemId: input.orderItemId,
        scope: action.scope,
      });
      continue;
    }

    const records = action.records.map(
      (record: PostProcessOrderItem['actions'][number]['records'][number]) => ({
        name: record.name,
        type: record.type,
        rdata: record.rdata,
        ttl: record.ttl ?? 30,
      }),
    );

    if (action.action === 'add') {
      await addDnsRecordsForZone(normalizedDomainName, records);
    } else if (action.action === 'set') {
      await setDnsRecordsForZone(normalizedDomainName, records);
    } else {
      workflow.log.warn('Skipping unsupported post-process action', {
        orderItemId: input.orderItemId,
        action: action.action,
      });
    }
  }
}
