import type { OperationStatus } from '@namefi-astra/registrars/lib/abstract-registrar/data/operation-status';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { sldRegistrar } from '#lib/namefi-registry';

/**
 * Poll the removal status of the DS record
 * @param input - The input object containing the registrar operation ID and domain name
 * @returns {Promise<OperationStatus>} - The operation status
 */
export async function pollRegistrarOperationStatus({
  registrarOperationId,
  domainName,
}: {
  registrarOperationId: string;
  domainName: PunycodeDomainName;
}): Promise<OperationStatus> {
  const lrOperation = await sldRegistrar.getOperationStatus(
    domainName,
    registrarOperationId,
  );
  switch (lrOperation.status) {
    case 'SUBMITTED':
    case 'IN_PROGRESS':
      throw new Error('Still IN_PROGRESS');
    default:
      return lrOperation.status;
  }
}

export async function getDomainDetails(domainName: PunycodeDomainName) {
  return await sldRegistrar.getDomainDetails(domainName);
}
