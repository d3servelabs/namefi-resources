import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { config } from '@/lib/env';
import {
  MLS_LISTING_REPORT_REASONS,
  type MlsCreateListingReportInput,
  type MlsCreateListingReportResponse,
} from '@/lib/mls/feed';

const createMlsListingReportSchema = z.object({
  listingId: z.string().uuid(),
  reason: z.enum(MLS_LISTING_REPORT_REASONS),
  details: z.string().trim().max(1_000).optional(),
});

const upstreamCreateReportResponseSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['active', 'resolved']),
});

const TRAILING_SLASHES_PATTERN = /\/+$/;

export async function POST(request: NextRequest) {
  const requestPayload = await readRequestPayload(request);
  if (requestPayload === null) {
    return NextResponse.json(
      { error: 'Invalid JSON payload.' },
      { status: 400 },
    );
  }

  const parsedRequest = createMlsListingReportSchema.safeParse(requestPayload);
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: 'Invalid MLS listing report payload.' },
      { status: 400 },
    );
  }

  const details = parsedRequest.data.details?.trim();
  const upstreamBody: MlsCreateListingReportInput = {
    listingId: parsedRequest.data.listingId,
    reason: parsedRequest.data.reason,
    ...(details ? { details } : {}),
  };
  const upstreamUrl = buildUpstreamListingReportUrl();

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(upstreamBody),
    });

    if (!upstreamResponse.ok) {
      const errorMessage = await extractErrorMessage(upstreamResponse);
      if (
        upstreamResponse.status === 400 ||
        upstreamResponse.status === 404 ||
        upstreamResponse.status === 409
      ) {
        return NextResponse.json(
          {
            error:
              errorMessage ?? getClientErrorFallbackMessage(upstreamResponse),
          },
          { status: upstreamResponse.status },
        );
      }

      return NextResponse.json(
        {
          error:
            errorMessage ?? 'Failed to submit MLS listing report upstream.',
        },
        { status: 502 },
      );
    }

    const upstreamPayload = await upstreamResponse.json();
    const parsedUpstreamPayload =
      upstreamCreateReportResponseSchema.safeParse(upstreamPayload);

    if (!parsedUpstreamPayload.success) {
      return NextResponse.json(
        { error: 'Upstream MLS report API returned an invalid payload.' },
        { status: 502 },
      );
    }

    return NextResponse.json(
      parsedUpstreamPayload.data satisfies MlsCreateListingReportResponse,
      { status: upstreamResponse.status },
    );
  } catch {
    return NextResponse.json(
      { error: 'Unable to submit MLS listing report right now.' },
      { status: 502 },
    );
  }
}

function buildUpstreamListingReportUrl() {
  const upstreamUrl = new URL(config.MLS_PUBLIC_SALES_LISTINGS_URL);
  const normalizedPath = upstreamUrl.pathname.replace(
    TRAILING_SLASHES_PATTERN,
    '',
  );

  if (normalizedPath.endsWith('/listings/report')) {
    upstreamUrl.pathname = normalizedPath;
    return upstreamUrl;
  }

  upstreamUrl.pathname = normalizedPath.endsWith('/listings')
    ? `${normalizedPath}/report`
    : `${normalizedPath}/listings/report`;

  return upstreamUrl;
}

async function readRequestPayload(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function extractErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error;
  } catch {
    return null;
  }
}

function getClientErrorFallbackMessage(response: Response) {
  if (response.status === 404) {
    return 'MLS listing not found.';
  }

  if (response.status === 409) {
    return 'MLS listing is already suppressed.';
  }

  return 'Invalid MLS listing report payload.';
}
