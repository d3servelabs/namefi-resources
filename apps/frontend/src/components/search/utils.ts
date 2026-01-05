import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import type { ImportQuery } from './types';

export const parseCSVDomains = (csvText: string): ImportQuery[] => {
  // Try different splitting strategies
  let lines: string[];

  if (csvText.includes('\n') || csvText.includes('\r')) {
    // Has actual newlines
    lines = csvText.trim().split(/[\n\r]+/);
  } else if (csvText.includes(' ')) {
    // Might be space-separated domains (no commas)
    lines = csvText.trim().split(/\s+/);
  } else {
    // Single line
    lines = [csvText.trim()];
  }

  const result: {
    domain: NamefiNormalizedDomain;
    eppAuthorizationCode?: string;
  }[] = [];

  // Helper to check if a string looks like a domain (contains a dot)
  const looksLikeDomain = (str: string): boolean => {
    const trimmed = str.trim();
    return trimmed.includes('.') && trimmed.split('.').length >= 2;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Handle multiple formats:
    // 1. "domain" (single domain)
    // 2. "domain, auth" (domain with auth code)
    // 3. "domain1, domain2" (multiple domains with space)
    // 4. "domain1,domain2" (multiple domains without space)

    if (trimmed.includes(',')) {
      // Split by comma and process each part
      const parts = trimmed
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const nextPart = parts[i + 1];

        // Check if this part looks like a domain
        if (looksLikeDomain(part)) {
          // This is a domain
          const domain = part.toLowerCase();

          // Check if the next part is an auth code (doesn't look like a domain)
          let eppAuthorizationCode: string | undefined;
          if (nextPart && !looksLikeDomain(nextPart)) {
            // Next part is likely an auth code
            eppAuthorizationCode = nextPart;
            i++; // Skip the next part since we've used it as auth code
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
        } else {
        }
      }
    } else {
      // Single domain without comma
      const domain = trimmed.toLowerCase().trim();

      // Basic domain validation using namefiNormalizedDomainSchema
      try {
        const normalizedDomain = namefiNormalizedDomainSchema.parse(domain);
        result.push({
          domain: normalizedDomain,
        });
      } catch (error) {
        // Skip invalid domains
        console.warn(`Invalid domain format: ${domain}`, error);
      }
    }
  }

  return result;
};
