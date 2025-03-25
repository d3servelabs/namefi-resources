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

import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { z } from 'zod';
import { getDomainInfo } from '#services/namefi-registry';
import { createTRPCRouter, publicProcedure } from '../base';

export const getSuggestions = (
  query: string,
  parentDomain: '0x.city' | 'defi.build',
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
      const bulkAvailability = await getDomainInfo(suggestions);

      return { suggestions, bulkAvailability };
    }),
});
