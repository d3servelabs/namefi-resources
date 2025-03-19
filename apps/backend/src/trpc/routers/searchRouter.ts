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

import { createHash } from 'node:crypto';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../base';

export const getSuggestions = (
  query: string,
  parentDomain: '0x.city' | 'defi.build',
) => {
  // re-write the query by keeping only letters, digits, dash, underscore and dot characters
  const trimmedQuery = query.replace(/[^a-zA-Z0-9-_.]/g, '');

  return [
    trimmedQuery,
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
  ];
};

const getDeterministicRandomAvailability = (domainLdh: string) => {
  // use the domainLdh to generate a deterministic random number
  const hash = createHash('sha256').update(domainLdh).digest('hex');
  const randomNumber = Number.parseInt(hash.slice(0, 8), 16) % 100;
  return randomNumber > 50;
};

const getBulkAvailabilityAndPricing = async (domainLdhs: string[]) => {
  // MOCK response. Respond the query term as is, plus 2 variations of it.
  return domainLdhs.map((domainLdh) => ({
    domainLdh,
    availability: getDeterministicRandomAvailability(domainLdh),
    priceInUSD: 5, // always 5 USD
  }));
};

export const searchRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        parentDomain: z.enum(['0x.city', 'defi.build']),
      }),
    )
    .query(async ({ input }) => {
      const { query, parentDomain } = input;

      const suggestions = getSuggestions(query, parentDomain);
      const bulkAvailability = await getBulkAvailabilityAndPricing(suggestions);

      return { suggestions, bulkAvailability };
    }),
});
