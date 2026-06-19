import { toPunycodeDomainName } from '@namefi-astra/registrars/data/validations';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { ApplicationFailure } from '@temporalio/common';
import { secrets } from '#lib/env';

export async function pollDomainParkingResponse({
  domainName,
}: {
  domainName: NamefiNormalizedDomain;
}): Promise<void> {
  const punycodeDomainName = toPunycodeDomainName(domainName);
  // Send the Vercel firewall protection-bypass token (when configured) so the
  // park app doesn't block our propagation probe.
  const headers: Record<string, string> =
    secrets.NAMEFI_PARK_VERCEL_FIREWALL_BYPASS
      ? {
          'x-vercel-protection-bypass':
            secrets.NAMEFI_PARK_VERCEL_FIREWALL_BYPASS,
        }
      : {};
  try {
    const response = await fetch(`https://${punycodeDomainName}`, { headers });

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
