import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  DEFAULT_MLS_FEED_LIMIT,
  MAX_MLS_FEED_LIMIT,
  type MlsSalesFeedPage,
} from '@/lib/mls/feed';
import { config } from '@/lib/env';

const upstreamFeedSchema = z.object({
  rows: z.array(
    z.object({
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
      sourceTweetUrl: z.string().min(1),
      postedAt: z.string().min(1),
      listedAt: z.string().min(1),
    }),
  ),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  limit: z.number().int().positive(),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limit = clamp(
    parsePositiveInt(
      request.nextUrl.searchParams.get('limit'),
      DEFAULT_MLS_FEED_LIMIT,
    ),
    1,
    MAX_MLS_FEED_LIMIT,
  );
  const cursor = request.nextUrl.searchParams.get('cursor')?.trim();

  const upstreamUrl = new URL(config.MLS_PUBLIC_SALES_LISTINGS_URL);

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
      return NextResponse.json(
        { error: 'Failed to fetch the upstream MLS feed.' },
        { status: 502 },
      );
    }

    const payload = await upstreamResponse.json();
    const parsed = upstreamFeedSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Upstream MLS feed returned an invalid payload.' },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed.data satisfies MlsSalesFeedPage, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load MLS feed right now.' },
      { status: 502 },
    );
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
