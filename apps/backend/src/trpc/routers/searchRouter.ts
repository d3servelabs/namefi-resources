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
import { z } from 'zod';
import {
  getDomainListInfo,
  getPoweredByNamefi3PHostnames,
} from '#lib/namefi-registry';
import { authedOrPublicProcedure, createTRPCRouter } from '../base';

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
  search: authedOrPublicProcedure
    .input(
      z.object({
        query: z.string(),
        parentDomain: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { query } = input;

      // TODO: this will be replaced when we implement AI suggestions
      const poweredByNamefiHostnames = await getPoweredByNamefi3PHostnames();

      // Determine parent domain using fallback chain:
      // 1. Use input.parentDomain if provided
      // 2. Otherwise use ctx.thirdPartyOriginHostname if request is from a third-party domain
      // 3. Finally fall back to first domain in poweredByNamefiOrigins
      const parentDomain =
        input.parentDomain ??
        ctx.thirdPartyOriginHostname ??
        poweredByNamefiHostnames[0];

      const suggestions = getSuggestions(query, parentDomain);
      const bulkAvailability = await getDomainListInfo(suggestions, ctx.user);

      return { suggestions, bulkAvailability };
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
});
