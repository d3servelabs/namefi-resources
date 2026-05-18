import { getCentralnicOte2Registrar } from '#lib/epp-registrars/centralnic';
import {
  refreshIndex,
  type RefreshIndexResult,
} from '#lib/epp-registrars/centralnic-ote2-index';
import { createLogger } from '#lib/logger';

const logger = createLogger({ module: 'refresh-centralnic-ote2-index' });

export async function refreshCentralnicOte2Index(): Promise<RefreshIndexResult> {
  const registrar = getCentralnicOte2Registrar();
  const result = await refreshIndex(registrar);
  logger.info(
    {
      checked: result.checked,
      removed: result.removed,
      aborted: result.aborted,
    },
    'CentralNic OTE2 index refresh complete',
  );
  return result;
}
