import { PrivyClient } from '@privy-io/server-auth';
import { config, secrets } from '#lib/env';

export const privyClient = new PrivyClient(
  config.PRIVY_APP_ID,
  secrets.PRIVY_APP_SECRET,
);

export const isNormalizedDomainNameAllowedForOriginHostname = (
  normalizedDomainName: string,
  originHostname?: string | null,
) => {
  if (!originHostname) {
    return true;
  }
  const acceptedHostnames = [
    originHostname,
    config.ADDITIONAL_ORIGIN_TO_HOSTNAME_MAP[originHostname],
  ].filter(Boolean);
  return acceptedHostnames.some((hostname) =>
    normalizedDomainName.endsWith(hostname),
  );
};
