import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { ApplicationFailure } from '@temporalio/common';

export async function pollDomainParkingResponse({
  domainName,
}: {
  domainName: NamefiNormalizedDomain;
}): Promise<void> {
  const punycodeDomainName = toPunycodeDomainName(domainName);
  try {
    const response = await fetch(`https://${punycodeDomainName}`);

    if (!response.ok) {
      throw new ApplicationFailure(
        `Parking response not ready for domain "${domainName}" (status ${response.status})`,
      );
    }
  } catch (error) {
    throw new ApplicationFailure(
      `Parking response not ready for domain "${domainName}" (no response)`,
    );
  }
  // TODO: Add response content checks for parking readiness.
}
