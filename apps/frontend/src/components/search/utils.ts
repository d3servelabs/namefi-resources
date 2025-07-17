import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import type { ImportQuery } from './types';

export const parseCSVDomains = (csvText: string): ImportQuery[] => {
  // Try different splitting strategies
  let lines: string[];

  if (csvText.includes('\n') || csvText.includes('\r')) {
    // Has actual newlines
    lines = csvText.trim().split(/[\n\r]+/);
  } else if (csvText.includes(' ')) {
    // Might be space-separated
    lines = csvText.trim().split(/\s+/);
  } else {
    // Single line
    lines = [csvText.trim()];
  }

  const result: {
    domain: NamefiNormalizedDomain;
    eppAuthorizationCode?: string;
  }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Handle two specific formats:
    // 1. "domain" (single domain per line)
    // 2. "domain, auth" (domain with auth code)

    let domain: string;
    let eppAuthorizationCode: string;

    if (trimmed.includes(',')) {
      // Format: "domain, auth"
      const parts = trimmed.split(',');
      domain = parts[0].toLowerCase().trim();
      eppAuthorizationCode = parts[1]?.trim() || '';
    } else {
      // Format: "domain" (single domain)
      domain = trimmed.toLowerCase().trim();
      eppAuthorizationCode = '';
    }

    // Basic domain validation using namefiNormalizedDomainSchema
    try {
      const normalizedDomain = namefiNormalizedDomainSchema.parse(domain);
      const resultItem: {
        domain: NamefiNormalizedDomain;
        eppAuthorizationCode?: string;
      } = {
        domain: normalizedDomain,
      };

      // Only add eppAuthorizationCode if it's not empty
      if (eppAuthorizationCode) {
        resultItem.eppAuthorizationCode = eppAuthorizationCode;
      }

      result.push(resultItem);
    } catch (error) {
      // Skip invalid domains
      console.warn(`Invalid domain format: ${domain}`, error);
    }
  }

  return result;
};
