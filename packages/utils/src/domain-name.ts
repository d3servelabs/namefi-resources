import punycode from 'node:punycode';

export const normalizeDomainName = (domainNameToNormalize: string) => {
  const possibleNormalized = punycode
    .toASCII(domainNameToNormalize)
    .toLowerCase()
    .replace(/\.+$/, ''); // Remove trailing dots
  // assert regex validation
  return possibleNormalized;
};

// TODO: Sid - This is a temporary regex to verify the domain name. It needs to tested
export const verifyNormalized = (domainName: string) => {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i.test(
    domainName,
  );
};
