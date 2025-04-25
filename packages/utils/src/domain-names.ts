// TODO(samishal1998): Improve this function to account for missing edge cases
// (multi-level subdomains, invalid formats, etc)
export function getSubDomainAndParentDomainFromNormalizedDomainName(
  normalizedDomainName: string,
): { subdomain: string; parentDomain: string } {
  const [subdomain, ...parentDomain] = normalizedDomainName.split('.');
  return {
    subdomain,
    parentDomain: parentDomain.join('.'),
  };
}
