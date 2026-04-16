import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';
import {
  createTRPCRouter,
  authedOrPublicProcedure,
  baseProcedure,
} from '../../base';
import {
  getDomainListInfo,
  type DomainAvailabilityInfo,
} from '#lib/namefi-registry';
import { generateDomainSuggestions } from '#lib/domain-suggestions';

// ============================================================================
// Output Schemas for OpenAPI
// ============================================================================

// Price with currency schema
const priceWithCurrencySchema = z.object({
  amount: z.number(),
  currency: z.string(),
});

// Pricing details schema (union of PER_YEAR and MULTI_YEAR types)
const pricingDetailsSchema = z.union([
  z.object({
    type: z.literal('PER_YEAR'),
    price: priceWithCurrencySchema,
  }),
  z.object({
    type: z.literal('MULTI_YEAR'),
    price: z.record(z.string(), priceWithCurrencySchema),
  }),
]);

// Domain pricing details schema
const domainPricingDetailsSchema = z.object({
  registrationPrice: pricingDetailsSchema,
  renewalPrice: pricingDetailsSchema,
  importPrice: pricingDetailsSchema,
});

// Domain availability info schema (matches DomainAvailabilityInfo type)
const domainAvailabilityInfoSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  availability: z.boolean(),
  pricingDetails: domainPricingDetailsSchema.optional(),
  currentOwner: z.string().optional(),
  registrarKey: z.string().optional(),
  durationValidationInYears: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .optional(),
  importable: z.boolean(),
  supported: z.boolean(),
});

// Domain suggestions result schema (matches DomainSuggestionsResult type)
const domainSuggestionsResultSchema = z.object({
  domains: z.array(namefiNormalizedDomainSchema),
  page: z.number(),
  totalPages: z.number(),
  nextPage: z.number().nullable(),
  pageSize: z.number(),
});

// ============================================================================
// Router Definition
// ============================================================================

export const searchRouterOrpc = createTRPCRouter({
  /**
   * Check if a domain is available for registration
   */
  checkAvailability: authedOrPublicProcedure
    .meta({
      route: {
        path: '/search/availability',
        method: 'GET',
        tags: ['search'],
        operationId: 'checkAvailability',
        summary: 'Check domain availability',
        description:
          'Check if a domain is available for registration. Returns availability status, pricing details, current owner (if any), and registration constraints.',
      },
    })
    .input(
      z.object({
        domain: namefiNormalizedDomainSchema.describe(
          'The domain to check availability for',
        ),
      }),
    )
    .output(domainAvailabilityInfoSchema)
    .query(async ({ input, ctx }) => {
      const { domain } = input;

      const availability = await getDomainListInfo([domain], ctx.user);

      if (availability.length !== 1) {
        return {
          domain: domain,
          availability: false,
          pricingDetails: undefined,
          currentOwner: undefined,
          durationValidationInYears: undefined,
          importable: false,
          supported: true,
        } satisfies DomainAvailabilityInfo;
      }
      return availability[0];
    }),

  /**
   * Get domain suggestions based on a search query
   */
  getSuggestions: baseProcedure
    .meta({
      route: {
        path: '/search/suggestions',
        method: 'GET',
        tags: ['search'],
        operationId: 'getSuggestions',
        summary: 'Get domain suggestions',
        description:
          'Generate domain suggestions based on a search query. Supports pagination and optional parent domain filtering for third-level domain suggestions.',
      },
    })
    .input(
      z.object({
        query: z
          .string()
          .min(1)
          .describe('Search query for domain suggestions'),
        parentDomain: z
          .string()
          .optional()
          .describe(
            'Optional parent domain for third-level domain suggestions',
          ),
        page: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe('Page number for pagination (starts at 1)'),
        pageSize: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Number of results per page (1-100)'),
      }),
    )
    .output(domainSuggestionsResultSchema)
    .query(async ({ input, ctx }) => {
      const { query, page = 1, pageSize } = input;
      const parentDomain =
        input.parentDomain ?? ctx.poweredByNamefiDomain ?? undefined;
      return generateDomainSuggestions(query, parentDomain, page, pageSize);
    }),
});
