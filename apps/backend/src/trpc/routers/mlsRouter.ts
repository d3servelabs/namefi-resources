import { TRPCError } from '@trpc/server';
import {
  MAX_MLS_FEED_LIMIT,
  type MlsDomainSearchResponse,
  type MlsListing,
  mlsContract,
  mlsDomainSearchResponseSchema,
  mlsFeedPageSchema,
  mlsHandleListingsPageSchema,
  mlsReportResponseSchema,
} from '@namefi-astra/common/mls-contract';
import { config } from '#lib/env';
import { publicProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';

const REQUEST_TIMEOUT_MS = 5_000;
const TRAILING_SLASHES_PATTERN = /\/+$/;
const LEADING_AT_SYMBOL = /^@/;
const HANDLE_PATTERN = /^[a-z0-9_]+$/i;

export const mlsRouter = createContractTRPCRouter<typeof mlsContract>({
  getFeed: publicProcedure
    .input(mlsContract.getFeed.input)
    .output(mlsContract.getFeed.output)
    .query(async ({ input }) => {
      const upstreamUrl = new URL(config.MLS_PUBLIC_SALES_LISTINGS_URL);
      upstreamUrl.searchParams.set(
        'limit',
        String(clamp(input.limit, 1, MAX_MLS_FEED_LIMIT)),
      );
      if (input.cursor) {
        upstreamUrl.searchParams.set('cursor', input.cursor);
      }

      const upstreamResponse = await fetch(upstreamUrl.toString(), {
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          Accept: 'application/json',
        },
      }).catch(() => null);

      if (!upstreamResponse) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: 'Unable to load MLS feed right now.',
        });
      }

      if (!upstreamResponse.ok) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: 'Failed to fetch the upstream MLS feed.',
        });
      }

      const payload = await upstreamResponse.json();
      const parsed = mlsFeedPageSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: 'Upstream MLS feed returned an invalid payload.',
        });
      }

      return parsed.data;
    }),

  getHandleListings: publicProcedure
    .input(mlsContract.getHandleListings.input)
    .output(mlsContract.getHandleListings.output)
    .query(async ({ input }) => {
      const normalizedHandle = normalizeMlsHandleSlug(input.handle);
      if (!normalizedHandle) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid MLS handle.',
        });
      }

      const upstreamUrl = buildUpstreamHandleUrl(normalizedHandle);
      upstreamUrl.searchParams.set(
        'limit',
        String(clamp(input.limit, 1, MAX_MLS_FEED_LIMIT)),
      );
      if (input.cursor) {
        upstreamUrl.searchParams.set('cursor', input.cursor);
      }

      const upstreamResponse = await fetch(upstreamUrl.toString(), {
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          Accept: 'application/json',
        },
      }).catch(() => null);

      if (!upstreamResponse) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: 'Unable to load MLS handle listings right now.',
        });
      }

      if (!upstreamResponse.ok) {
        const errorMessage = await extractErrorMessage(upstreamResponse);

        if (upstreamResponse.status === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: errorMessage ?? 'Invalid MLS handle.',
          });
        }

        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message:
            errorMessage ?? 'Failed to fetch upstream MLS handle listings.',
        });
      }

      const payload = await upstreamResponse.json();
      const parsed = mlsHandleListingsPageSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: 'Upstream MLS handle listings returned an invalid payload.',
        });
      }

      return parsed.data;
    }),

  reportListing: publicProcedure
    .input(mlsContract.reportListing.input)
    .output(mlsContract.reportListing.output)
    .mutation(async ({ input }) => {
      const details = input.details?.trim();
      const upstreamBody = {
        listingId: input.listingId,
        reason: input.reason,
        ...(details ? { details } : {}),
      };
      const upstreamUrl = buildUpstreamListingReportUrl();

      const upstreamResponse = await fetch(upstreamUrl.toString(), {
        method: 'POST',
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(upstreamBody),
      }).catch(() => null);

      if (!upstreamResponse) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: 'Unable to submit MLS listing report right now.',
        });
      }

      if (!upstreamResponse.ok) {
        const errorMessage = await extractErrorMessage(upstreamResponse);
        if (upstreamResponse.status === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: errorMessage ?? 'Invalid MLS listing report payload.',
          });
        }
        if (upstreamResponse.status === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: errorMessage ?? 'MLS listing not found.',
          });
        }
        if (upstreamResponse.status === 409) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: errorMessage ?? 'MLS listing is already suppressed.',
          });
        }

        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message:
            errorMessage ?? 'Failed to submit MLS listing report upstream.',
        });
      }

      const upstreamPayload = await upstreamResponse.json();
      const parsedUpstreamPayload =
        mlsReportResponseSchema.safeParse(upstreamPayload);

      if (!parsedUpstreamPayload.success) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: 'Upstream MLS report API returned an invalid payload.',
        });
      }

      return parsedUpstreamPayload.data;
    }),

  searchDomainOffers: publicProcedure
    .input(mlsContract.searchDomainOffers.input)
    .output(mlsContract.searchDomainOffers.output)
    .query(async ({ input }) => {
      const upstreamUrl = buildUpstreamListingSearchUrl();
      const domains = uniqueLowercaseStrings(input.domains);

      const upstreamResponse = await fetch(upstreamUrl.toString(), {
        method: 'POST',
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domains,
        }),
      }).catch(() => null);

      if (!upstreamResponse || !upstreamResponse.ok) {
        return {
          offersByDomain: {},
          generatedAt: new Date().toISOString(),
        };
      }

      const payload = await upstreamResponse.json();
      const parsed = mlsDomainSearchResponseSchema.safeParse(payload);
      if (!parsed.success) {
        return {
          offersByDomain: {},
          generatedAt: new Date().toISOString(),
        };
      }

      return normalizeDomainSearchResponse(parsed.data);
    }),
});

function buildUpstreamHandleUrl(handle: string) {
  const upstreamUrl = new URL(config.MLS_PUBLIC_SALES_LISTINGS_URL);
  const normalizedPath = upstreamUrl.pathname.replace(
    TRAILING_SLASHES_PATTERN,
    '',
  );
  const withoutListings = normalizedPath.endsWith('/listings')
    ? normalizedPath.slice(0, -'/listings'.length)
    : normalizedPath;

  upstreamUrl.pathname = `${withoutListings}/handles/${encodeURIComponent(handle)}/listings`;
  return upstreamUrl;
}

function buildUpstreamListingReportUrl() {
  const upstreamUrl = new URL(config.MLS_PUBLIC_SALES_LISTINGS_URL);
  const normalizedPath = upstreamUrl.pathname.replace(
    TRAILING_SLASHES_PATTERN,
    '',
  );

  upstreamUrl.pathname = normalizedPath.endsWith('/listings')
    ? `${normalizedPath}/report`
    : `${normalizedPath}/listings/report`;

  return upstreamUrl;
}

function buildUpstreamListingSearchUrl() {
  const upstreamUrl = new URL(config.MLS_PUBLIC_SALES_LISTINGS_URL);
  const normalizedPath = upstreamUrl.pathname.replace(
    TRAILING_SLASHES_PATTERN,
    '',
  );
  upstreamUrl.pathname = `${normalizedPath}/search`;
  return upstreamUrl;
}

function normalizeMlsHandleSlug(value: string) {
  const normalized = value.trim().replace(LEADING_AT_SYMBOL, '');
  if (!normalized || !HANDLE_PATTERN.test(normalized)) {
    return null;
  }

  return normalized.toLowerCase();
}

function uniqueLowercaseStrings(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)),
  );
}

function normalizeDomainSearchResponse(
  payload: MlsDomainSearchResponse,
): MlsDomainSearchResponse {
  const offersByDomain: Record<string, MlsListing> = {};
  for (const [domain, offer] of Object.entries(payload.offersByDomain)) {
    const normalizedDomain = domain.toLowerCase();
    offersByDomain[normalizedDomain] = {
      ...offer,
      domain: offer.domain.toLowerCase(),
    };
  }

  return {
    offersByDomain,
    generatedAt: payload.generatedAt,
  };
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

async function extractErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    const normalized = payload.error?.trim();
    return normalized && normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}
