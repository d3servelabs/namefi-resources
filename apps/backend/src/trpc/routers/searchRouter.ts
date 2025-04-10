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
import {
  getDomainListInfo,
  getPoweredByNamefi3POrigins,
} from '#services/namefi-registry';
import { createTRPCRouter, publicProcedure } from '../base';

export const getSuggestions = (
  query: string,
  parentDomain: string,
): NamefiNormalizedDomain[] => {
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
  ] as NamefiNormalizedDomain[];
};

export const searchRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        parentDomain: z
          .string()
          .optional()
          .describe(
            'only pass it if request is sent from a first party domain',
          ),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { query } = input;

      // TODO: this will be replaced when we implement AI suggestions
      const poweredByNamefiOrigins = await getPoweredByNamefi3POrigins();

      // if the request is coming from a selling SLD like `0x.city` then it will be `ctx.thirdPartyOrigin`,
      // but if that's null then this request is from main-page, so either take in the passed option,
      // or fallback to first domain in poweredByNamefiOrigins (hardcoded for the time being)
      const parentDomain =
        ctx.thirdPartyOrigin ?? input.parentDomain ?? poweredByNamefiOrigins[0];

      const suggestions = getSuggestions(query, parentDomain);
      const bulkAvailability = await getDomainListInfo(suggestions);

      return { suggestions, bulkAvailability };
    }),
});
