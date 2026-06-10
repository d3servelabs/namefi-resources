import { toUnicodeDomainName } from '@namefi-astra/registrars/data/validations';

const DOMAIN_MARK_CHARACTER_PATTERN = /[\p{L}\p{N}]/u;

export interface MlsDomainDisplayParts {
  full: string;
  label: string;
  tld: string | null;
}

export function getMlsDomainDisplayParts(
  domain: string,
): MlsDomainDisplayParts {
  const normalizedDomain = safeToUnicodeDomainName(domain);
  const splitIndex = normalizedDomain.indexOf('.');

  if (splitIndex <= 0 || splitIndex === normalizedDomain.length - 1) {
    return { full: normalizedDomain, label: normalizedDomain, tld: null };
  }

  return {
    full: normalizedDomain,
    label: normalizedDomain.slice(0, splitIndex),
    tld: normalizedDomain.slice(splitIndex + 1),
  };
}

export function getMlsDomainMark(label: string) {
  const character = Array.from(label).find((value) =>
    DOMAIN_MARK_CHARACTER_PATTERN.test(value),
  );

  return character?.toUpperCase() ?? '?';
}

function safeToUnicodeDomainName(domain: string) {
  const normalizedDomain = domain.trim();

  try {
    return toUnicodeDomainName(normalizedDomain);
  } catch {
    return normalizedDomain;
  }
}
