import { z } from 'zod';
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { getDomainLevels } from './get-domain-levels';
import { RANKED_TLDS } from './tldRank';
import { getTags } from '@namefi/cat';
import {
  adjectives,
  animals,
  colors,
  countries,
  uniqueNamesGenerator,
} from 'unique-names-generator';
import {
  toPunycodeDomainName,
  toUnicodeDomainName,
  type PunycodeDomainName,
  type UnicodeDomainName,
  domainLabelSchema,
} from '@namefi-astra/registrars/lib/data/validations';
import { verifyNormalized } from '@namefi-astra/zod-dns';

export interface SanitisedDomain {
  ascii: PunycodeDomainName;
  unicode: UnicodeDomainName;
}

export const sanitisedQuerySchema = z
  .string()
  .transform<SanitisedDomain>((raw, ctx) => {
    const cleaned = raw
      .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '') // rm scheme
      .replace(/\/.*$/s, '') // rm path
      .normalize('NFKC')
      .trim()
      .toLowerCase()
      .replace(/\.{2,}/g, '.') // collapse ..
      .replace(/^\.|\.$/g, '') // rm edge dots
      .replace(/[^\p{L}\p{N}\u2010\-.]/gu, ''); // keep letters, numbers, -, …

    if (!cleaned) {
      ctx.addIssue({ code: 'custom', message: 'empty domain' });
      return z.NEVER;
    }

    const asciiLabels: string[] = [];
    for (const lbl of cleaned.split('.')) {
      const ascii = toPunycodeDomainName(lbl); // => xn--…
      // length ≤ 63 & not empty
      if (!domainLabelSchema.safeParse(ascii).success) {
        ctx.addIssue({
          code: 'custom',
          message: `label "${lbl}" is invalid or >63 chars`,
        });
        return z.NEVER;
      }
      asciiLabels.push(ascii);
    }

    const asciiJoined = toPunycodeDomainName(asciiLabels.join('.'));
    // total length ≤ 255, only [a-z0-9-_] etc.
    if (!verifyNormalized(asciiJoined)) {
      ctx.addIssue({
        code: 'custom',
        message: 'violates Namefi rules (lowercase a-z/0-9/-/_, max 255 chars)',
      });
      return z.NEVER;
    }

    return {
      ascii: asciiJoined,
      unicode: toUnicodeDomainName(asciiJoined),
    };
  });

type Tag = ReturnType<typeof getTags>[number];

/**
 * Generates domain suggestions based on query and parentDomain.
 * This function handles both third-party domains (with parentDomain) and general domain searches.
 *
 * @param query - The search query string
 * @param parentDomain - Optional parent domain for third-party searches
 * @returns Array of domain strings to check for availability
 */
export function generateDomainSuggestions(
  query: string,
  parentDomain?: string,
) {
  let domains: PunycodeDomainName[] = [];
  const { ascii: sanitizedQuery } = sanitisedQuerySchema.parse(query);
  if (parentDomain) {
    // For third-party domains, use the 3rd level suggestions logic
    domains = generate3rdLevelDomainSuggestions(
      sanitizedQuery,
      parentDomain,
    ).map(toPunycodeDomainName);
  } else {
    const { levels } = getDomainLevels(sanitizedQuery);

    if (levels.length <= 1) {
      // Check if user provided a TLD (contains a dot) even if not recognized
      if (sanitizedQuery.includes('.')) {
        // User provided a TLD (even if not recognized) - prioritize it
        const userDomain = sanitizedQuery; // Use the complete domain as-is
        sanitizedQuery.split('.').pop() || ''; // Extract TLD

        // Start with user's complete domain, then add all ranked TLDs
        domains = [
          userDomain,
          ...RANKED_TLDS.map((tld) =>
            toPunycodeDomainName(`${userDomain.split('.')[0]}.${tld}`),
          ),
        ];
      } else {
        domains = RANKED_TLDS.map((tld) =>
          toPunycodeDomainName(`${sanitizedQuery}.${tld}`),
        );
      }
    } else {
      // levels > 1

      // User provided a complete domain - prioritize it and add all ranked TLDs
      const validTlds = RANKED_TLDS.filter(
        (tld) => !sanitizedQuery.endsWith(`.${tld}`),
      );
      domains = [
        sanitizedQuery,
        ...validTlds.map((tld) =>
          toPunycodeDomainName(`${sanitizedQuery.split('.')[0]}.${tld}`),
        ),
      ];
    }
  }

  return domains;
}

/**
 * Generates 3rd level domain suggestions
 *
 * @param query - The query to generate suggestions for
 * @param parentDomain - The parent domain to generate suggestions for
 * @returns Array of domain strings
 */
function generate3rdLevelDomainSuggestions(
  query: PunycodeDomainName,
  parentDomain: string,
): string[] {
  // Remove parent domain from end of query if it exists and replace dots with dashes
  const sanitizedQuery = (
    query.endsWith(`.${parentDomain}`)
      ? query.slice(0, -(parentDomain.length + 1))
      : query
  ).replace(/\./g, '-');
  const domain = namefiNormalizedDomainSchema.parse(
    `${sanitizedQuery}.${parentDomain}`,
  );
  const tags = getTags(domain);

  let suggestions: string[] = [];
  const maxRound = 3; // Limit rounds for performance
  const totalSuggestions = new Set<string>();

  for (let round = 0; round < maxRound; round++) {
    const normalizedSuggestions = generateSuggestions(
      sanitizedQuery,
      parentDomain,
      tags,
      round,
    ).filter(
      (d) =>
        !totalSuggestions.has(d) && d !== `${sanitizedQuery}.${parentDomain}`,
    );

    normalizedSuggestions.forEach((d) => totalSuggestions.add(d));
    suggestions.push(...normalizedSuggestions);

    // Stop if we have enough suggestions
    if (suggestions.length >= 20) {
      break;
    }
  }

  // Remove duplicates and the original domain
  suggestions = Array.from(new Set(suggestions)).filter(
    (d) =>
      d.endsWith(`.${parentDomain}`) &&
      d !== `${sanitizedQuery}.${parentDomain}`,
  );

  // Ensure the first suggestion is always the searched query
  const searchedQuery = `${sanitizedQuery}.${parentDomain}`;
  return [searchedQuery, ...suggestions];
}

/**
 * Generates natural names
 */
function generateNaturalNames(
  query: string,
  parentDomain: string,
  count: number,
  initialSeed?: string,
) {
  const suggestions: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate unique name combinations using adjectives and colors
    const shortName = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals, countries],
      length: 1,
      style: 'lowerCase',
      seed: (initialSeed ?? query) + i,
    });
    // Combine generated name with query and parent domain
    const nameParts = [shortName, query];
    if (Math.random() < 0.5) {
      nameParts.reverse();
    }

    suggestions.push(
      `${nameParts.join(Math.random() < 0.5 ? '-' : '')}.${parentDomain}`,
    );
  }
  return suggestions;
}

/**
 * Generates number club suggestions
 */
function generateNumberClubSuggestions(
  query: string,
  parentDomain: string,
  round: number,
) {
  const suggestions: string[] = [];
  // If the query is a number, suggest increment, decrement, repeat, reverse
  if (/^\d+$/.test(query)) {
    const num = Number.parseInt(query, 10);
    const count = 20;
    const start = 1 + round * count;
    for (let i = start; i < start + count; i++) {
      if (!Number.isNaN(num)) {
        const incremented = num + i;
        const decremented = num - i;
        suggestions.push(`${incremented}.${parentDomain}`);
        if (decremented > 0) {
          suggestions.push(`${decremented}.${parentDomain}`);
        }
      }
    }
    if (round === 0) {
      // Add its reverse
      suggestions.push(`${query.split('').reverse().join('')}.${parentDomain}`);
      // add repeated query
      suggestions.push(`${query.repeat(2)}.${parentDomain}`);
      // add all windowed sub strings
      suggestions.push(
        ...windowedSubStrings(query).map((s) => `${s}.${parentDomain}`),
      );
      // add all rotate permutations
      suggestions.push(
        ...stringRotatePermutations(query).map((s) => `${s}.${parentDomain}`),
      );
    }
  }
  return suggestions;
}

/**
 * Generates English word club suggestions
 */
function generateEnglishWordClubSuggestions(
  query: string,
  parentDomain: string,
  round: number,
) {
  const suggestions: string[] = [];

  if (round === 0) {
    // Suggest plural, singular, and affixed forms
    if (!query.endsWith('s')) {
      suggestions.push(`${query}s.${parentDomain}`);
    }
    if (query.endsWith('s')) {
      suggestions.push(`${query.slice(0, -1)}.${parentDomain}`);
    }
    suggestions.push(`the${query}.${parentDomain}`);
    suggestions.push(`${query}ly.${parentDomain}`);
    suggestions.push(`${query}er.${parentDomain}`);
    suggestions.push(`${query}-citizen.${parentDomain}`);
  }
  suggestions.push(
    ...generateNaturalNames(query, parentDomain, 20, `${query}${round}`),
  );
  return suggestions;
}

/**
 * Generates suggestions for a given query
 */
export function generateSuggestions(
  query: string,
  parentDomain: string,
  tags: Tag[],
  round = 0,
) {
  // Rule-based suggestions for clubs
  let suggestions: string[] = [];

  for (const tag of tags) {
    // Number club suggestions
    if (tag.id.startsWith('num_')) {
      suggestions.push(
        ...generateNumberClubSuggestions(query, parentDomain, round),
      );
    }
    // English word club suggestions
    if (tag.id.startsWith('en_')) {
      suggestions.push(
        ...generateEnglishWordClubSuggestions(query, parentDomain, round),
      );
    }
  }

  // If no suggestions, generate 20 natural names
  if (suggestions.length === 0) {
    suggestions = generateNaturalNames(
      query,
      parentDomain,
      20,
      `${query}${round}`,
    );
  }

  // Remove duplicates and the original domain
  suggestions = Array.from(new Set(suggestions)).filter(
    (d) => d.endsWith(`.${parentDomain}`) && d !== `${query}.${parentDomain}`,
  );

  // Validate/normalize suggestions
  return filterNamefiNormalizedDomain(suggestions);
}

export function filterNamefiNormalizedDomain(
  names: string[],
): NamefiNormalizedDomain[] {
  const result: NamefiNormalizedDomain[] = [];
  for (const name of names) {
    const parsed = namefiNormalizedDomainSchema.safeParse(name);
    if (parsed.success) {
      result.push(parsed.data);
    }
  }
  return result;
}

/**
 * Rotates a string n times
 */
export const rotateString = (str: string, n: number) => {
  // this way count is always positive and in the range of the string length and works for negative numbers
  // example: string length is 3, n is -4, count will be 2,
  // example: string length is 3, n is 4, count will be 1
  // example: string length is 3, n is 5, count will be 2
  const count = (n % str.length) + (n < 0 ? str.length : 0);

  return str.slice(count) + str.slice(0, count);
};

/**
 * Generates all unique rotations of a string
 */
export const stringRotatePermutations = (str: string) => {
  const permutations = new Set<string>();
  for (let i = 0; i < str.length; i++) {
    permutations.add(rotateString(str, i));
  }
  return Array.from(permutations);
};

/**
 * Generates all unique windowed sub strings of a string
 */
export const windowedSubStrings = (str: string) => {
  const windows = new Set<string>();
  for (let windowSize = 1; windowSize < str.length; windowSize++) {
    for (let i = 0; i <= str.length - windowSize; i++) {
      windows.add(str.slice(i, i + windowSize));
    }
  }
  return Array.from(windows);
};
