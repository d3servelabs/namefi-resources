import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import type { RefreshIndexResult } from '../../lib/epp-registrars/centralnic-ote2-index';

const { refreshCentralnicOte2Index } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    ...shortRunningOpts,
    startToCloseTimeout: '10m',
  },
});

export async function refreshCentralnicOte2IndexWorkflow(): Promise<RefreshIndexResult> {
  workflow.log.info('Starting CentralNic OTE2 index refresh');
  const result = await refreshCentralnicOte2Index();
  workflow.log.info('CentralNic OTE2 index refresh finished', {
    checked: result.checked,
    removed: result.removed,
    aborted: result.aborted,
  });
  return result;
}
