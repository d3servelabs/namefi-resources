/*
 * Search Router
 *
 * This router is responsible for handling all search related functionality.
 *
 * First and foremost, it provides a route `search` to get search results based on a query.
 *
 * Secondly, it provides a route `bulkAvailabilityLookup` to bulk lookup availability of a list of products.
 *
 * What powers the query route is a combination of "suggestions" and "bulk availability lookup".
 *
 * Behind the scenes, it will query the database for domain.
 */

import {
  type NamefiNormalizedDomain,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { getTags } from '@namefi/cat';
import { TRPCError } from '@trpc/server';
import { take, uniqBy } from 'ramda';
import {
  adjectives,
  animals,
  colors,
  countries,
  uniqueNamesGenerator,
} from 'unique-names-generator';
import { z } from 'zod';
import { getDomainListInfo } from '#lib/namefi-registry';
import { authedOrPublicProcedure, createTRPCRouter } from '../base';

type Tag = ReturnType<typeof getTags>[number];
type Suggestion = {
  domain: NamefiNormalizedDomain;
  availability: boolean;
  priceInUSD: number | undefined;
  currentOwner: string | undefined;
};
const sanitizedQuerySchema = z.string().transform((val) => {
  return val
    .trim()
    .toLowerCase()
    .replace(/[!$_#@\.\+]/g, '');
});

export const getSuggestions = (
  query: string,
  parentDomain: string,
): NamefiNormalizedDomain[] => {
  // re-write the query by keeping only letters, digits, dash, underscore and dot characters
  const trimmedQuery = query.replace(/[^a-zA-Z0-9-_.]/g, '');

  return [
    `${trimmedQuery}.${parentDomain}`,
    `${trimmedQuery}-good.${parentDomain}`,
    `${trimmedQuery}-great.${parentDomain}`,
    `${trimmedQuery}-fantastic.${parentDomain}`,
    `${trimmedQuery}-wonderful.${parentDomain}`,
    `${trimmedQuery}-incredible.${parentDomain}`,
    `${trimmedQuery}-amazing.${parentDomain}`,
    `${trimmedQuery}-awesome.${parentDomain}`,
    `${trimmedQuery}-fantastic.${parentDomain}`,
    `${trimmedQuery}-wonderful.${parentDomain}`,
  ] as NamefiNormalizedDomain[];
};

export const searchRouter = createTRPCRouter({
  search: authedOrPublicProcedure
    .input(
      z.object({
        query: sanitizedQuerySchema,
        parentDomain: z.string().optional(),
        withSuggestions: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { query } = input;

      const parentDomain = input.parentDomain ?? ctx.thirdPartyOriginHostname;

      if (!parentDomain) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Parent domain is required',
        });
      }

      if (input.withSuggestions) {
        const suggestions = getSuggestions(query, parentDomain);
        const bulkAvailability = await getDomainListInfo(suggestions, ctx.user);

        return { suggestions, bulkAvailability };
      }

      const domain = namefiNormalizedDomainSchema.parse(
        `${query}.${parentDomain}`,
      );
      const availability = await getDomainListInfo([domain], ctx.user);

      return {
        suggestions: [],
        bulkAvailability: availability,
      };
    }),

  isDomainAvailable: authedOrPublicProcedure
    .input(
      z.object({
        domain: namefiNormalizedDomainSchema.describe(
          'The domain to check availability for',
        ),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { domain } = input;

      const availability = await getDomainListInfo([domain], ctx.user);

      if (availability.length !== 1) {
        return {
          domain: domain,
          availability: false,
        };
      }
      return availability[0];
    }),

  getDomainSuggestions: authedOrPublicProcedure
    .input(
      z.object({
        query: sanitizedQuerySchema,
        parentDomain: z.string(),
        onlyAvailable: z.boolean().optional().default(true),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { query } = input;

      const parentDomain = input.parentDomain ?? ctx.thirdPartyOriginHostname;

      if (!parentDomain) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Parent domain is required',
        });
      }

      const domain = namefiNormalizedDomainSchema.parse(
        `${query}.${parentDomain}`,
      );
      const tags = getTags(domain);

      // Rule-based suggestions for clubs
      let suggestions: Suggestion[] = [];

      const startTime = performance.now();
      const maxDuration = 2000;
      const maxRound = 5;
      let round = 0; // Number of rounds to generate suggestions (to avoid infinite loops) this is enabled when onlyAvailable is false
      do {
        // do-while to ensure at least 1 round is generated
        const normalizedSuggestions = await generateSuggestions(
          query,
          parentDomain,
          tags,
          round,
        );
        const bulkAvailability = await getDomainListInfo(
          normalizedSuggestions,
          {
            privyUserId: ctx.user.privyUserId,
          },
        );
        // If we are not filtering by availability, add all suggestions and break
        if (!input.onlyAvailable) {
          suggestions.push(...bulkAvailability);
          break;
        }

        // Add available suggestions
        suggestions.push(...bulkAvailability.filter((d) => d.availability));

        // If we are on the last round, add all unavailable suggestions to not end up with empty suggestions
        if (round === maxRound - 1 && suggestions.length < 20) {
          suggestions.push(
            ...take(
              20 - suggestions.length,
              bulkAvailability.filter((d) => !d.availability),
            ),
          );
        }

        round++;
      } while (
        suggestions.length < 20 &&
        round < maxRound &&
        performance.now() - startTime < maxDuration
      );

      // Remove duplicates and the original domain
      suggestions = uniqBy((d) => d.domain, suggestions);

      return suggestions;
    }),
});

/**
 * Generates natural names
 *
 * @param query - The query to generate suggestions for
 * @param parentDomain - The parent domain to generate suggestions for
 * @param count - The number of suggestions to generate
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
 *
 * @param query - The query to generate suggestions for
 * @param parentDomain - The parent domain to generate suggestions for
 * @param round - The round number to generate suggestions for
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
    }
  }
  return suggestions;
}

/**
 * Generates English word club suggestions
 *
 * @param query - The query to generate suggestions for
 * @param parentDomain - The parent domain to generate suggestions for
 * @param round - The round number to generate suggestions for
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
 *
 * @param query - The query to generate suggestions for
 * @param parentDomain - The parent domain to generate suggestions for
 * @param tags - The tags to generate suggestions for
 * @param privyUserId - The privy user id to generate suggestions for
 * @param round - The round number to generate suggestions for
 */
async function generateSuggestions(
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

function filterNamefiNormalizedDomain(
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
