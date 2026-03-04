import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { config } from '@/lib/env';
import {
  DEFAULT_MLS_FEED_LIMIT,
  MAX_MLS_FEED_LIMIT,
  type MlsSalesByHandlePage,
} from '@/lib/mls/feed';
import { normalizeMlsHandleSlug } from '@/lib/mls/handles';

const upstreamListingSchema = z.object({
  id: z.string().min(1),
  domain: z.string().min(1),
  askingPrice: z.string().nullable(),
  askingCurrency: z.string().nullable(),
  purchaseUrl: z.string().nullable(),
  messageText: z.string().nullable(),
  seller: z.object({
    username: z.string().nullable(),
    displayName: z.string().nullable(),
  }),
  otherDomainsCount: z.number().int().nonnegative().optional().default(0),
  sourceTweetUrl: z.string().min(1),
  postedAt: z.string().min(1),
  listedAt: z.string().min(1),
});

const upstreamHandleFeedSchema = z.object({
  handle: z.string().min(1),
  seller: z.object({
    authorId: z.string().nullable(),
    username: z.string().nullable(),
    displayName: z.string().nullable(),
  }),
  rows: z.array(upstreamListingSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  limit: z.number().int().positive(),
  totalDomains: z.number().int().nonnegative(),
});
const TRAILING_SLASHES_PATTERN = /\/+$/;

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const limit = clamp(
    parsePositiveInt(
      request.nextUrl.searchParams.get('limit'),
      DEFAULT_MLS_FEED_LIMIT,
    ),
    1,
    MAX_MLS_FEED_LIMIT,
  );
  const cursor = request.nextUrl.searchParams.get('cursor')?.trim();

  const resolvedParams = await params;
  const normalizedHandle = normalizeMlsHandleSlug(resolvedParams.handle ?? '');

  if (!normalizedHandle) {
    return NextResponse.json({ error: 'Invalid MLS handle.' }, { status: 400 });
  }

  const upstreamUrl = buildUpstreamHandleUrl(normalizedHandle);
  upstreamUrl.searchParams.set('limit', String(limit));
  if (cursor) {
    upstreamUrl.searchParams.set('cursor', cursor);
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!upstreamResponse.ok) {
      const errorMessage = await extractErrorMessage(upstreamResponse);

      if (upstreamResponse.status === 400) {
        return NextResponse.json(
          { error: errorMessage ?? 'Invalid MLS handle.' },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          error:
            errorMessage ?? 'Failed to fetch upstream MLS handle listings.',
        },
        { status: 502 },
      );
    }

    const payload = await upstreamResponse.json();
    const parsed = upstreamHandleFeedSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Upstream MLS handle listings returned an invalid payload.' },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed.data satisfies MlsSalesByHandlePage, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load MLS handle listings right now.' },
      { status: 502 },
    );
  }
}

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

async function extractErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error;
  } catch {
    return null;
  }
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}
