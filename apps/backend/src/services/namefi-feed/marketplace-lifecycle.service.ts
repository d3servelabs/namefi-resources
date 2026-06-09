import type {
  MlsRecordNamefiMarketplaceListingCancelledInput,
  MlsRecordNamefiMarketplaceListingCreatedInput,
} from '@namefi-astra/common/contract/mls-contract';
import {
  db,
  namefiFeedListingReportsTable,
  namefiFeedListingsTable,
  namefiFeedPostsTable,
  namefiNftOwnersCte,
  namefiNftOwnersView,
} from '@namefi-astra/db';
import {
  getTokenIdFromDomainName,
  NAMEFI_NFT_CONTRACT_ADDRESS,
} from '@namefi-astra/utils';
import { and, eq, sql } from 'drizzle-orm';
import type { Json } from 'drizzle-zod';
import { normalizeOptionalText, normalizePublicHttpUrl } from './normalization';
import { NAMEFI_MARKETPLACE_FEED_SOURCE_ID } from './sources';

type MarketplaceListingIdentityInput =
  MlsRecordNamefiMarketplaceListingCancelledInput;

type MarketplaceLifecycleAuthContext = {
  linkedWalletAddresses: readonly string[];
};

const MARKETPLACE_LABELS: Record<
  MlsRecordNamefiMarketplaceListingCreatedInput['marketplaceId'],
  string
> = {
  opensea: 'OpenSea',
  rarible: 'Rarible',
  okx: 'OKX',
};

const MARKETPLACE_ALLOWED_HOSTS: Record<
  MlsRecordNamefiMarketplaceListingCreatedInput['marketplaceId'],
  string[]
> = {
  opensea: ['opensea.io', 'testnets.opensea.io'],
  rarible: ['rarible.com', 'testnet.rarible.com'],
  okx: ['web3.okx.com'],
};

const NAMEFI_FEED_FALLBACK_URL = 'https://namefi.io/feed';
const MAX_EVENT_FUTURE_DRIFT_MS = 5 * 60 * 1000;
const MAX_LISTING_ID_LENGTH = 512;
const RAW_PRICE_PATTERN = /^\d+$/;
const DECIMAL_PRICE_PATTERN = /^\d+(\.\d+)?$/;
const NON_ZERO_DECIMAL_PATTERN = /[1-9]/;
const CURRENCY_SYMBOL_PATTERN = /^[A-Z0-9]{2,24}$/;

export class NamefiFeedMarketplaceListingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NamefiFeedMarketplaceListingValidationError';
  }
}

export class NamefiFeedMarketplaceListingForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NamefiFeedMarketplaceListingForbiddenError';
  }
}

export class NamefiFeedMarketplaceListingDomainNotFoundError extends Error {
  constructor(message = 'Domain NFT not found') {
    super(message);
    this.name = 'NamefiFeedMarketplaceListingDomainNotFoundError';
  }
}

export async function recordNamefiMarketplaceListingCreated({
  input,
  linkedWalletAddresses,
}: {
  input: MlsRecordNamefiMarketplaceListingCreatedInput;
} & MarketplaceLifecycleAuthContext): Promise<{ synced: boolean }> {
  await assertMarketplaceListingCreateAllowed(input, linkedWalletAddresses);

  const now = new Date();
  const listedAt = parseEventDateOrThrow(input.listedAt, now);
  assertDateNotTooFarInFuture(listedAt, now, 'Marketplace listing date');
  const expiresAt = parseOptionalDateOrThrow(input.expiresAt);
  if (expiresAt && expiresAt <= listedAt) {
    throw new NamefiFeedMarketplaceListingValidationError(
      'Marketplace listing expiry must be after the listing date.',
    );
  }

  const listingUrl = normalizeMarketplaceListingUrl(
    input.marketplaceId,
    input.listingUrl,
  );
  normalizeListingId(input.listingId);
  normalizePriceRaw(input.priceRaw);
  const askingPrice = normalizePriceDecimal(input.priceDecimal);
  const askingCurrency = normalizeCurrencySymbol(input.currencySymbol);

  const marketplaceLabel = MARKETPLACE_LABELS[input.marketplaceId];
  const sellerLabel = shortenAddress(input.sellerAddress);
  const postText = `${input.domainName} listed on ${marketplaceLabel} via Namefi`;
  const externalPostId = buildMarketplaceListingExternalPostId(input);
  const rawPayload = buildMarketplaceListingRawPayload(
    input,
    'created',
  ) as Json;

  await db.transaction(async (tx) => {
    const [post] = await tx
      .insert(namefiFeedPostsTable)
      .values({
        externalSource: NAMEFI_MARKETPLACE_FEED_SOURCE_ID,
        externalPostId,
        externalConversationId: null,
        externalAuthorId: input.sellerAddress.toLowerCase(),
        authorUsername: null,
        authorDisplayName: sellerLabel,
        text: postText,
        source: 'system',
        status: 'processed',
        rawPayload,
        postedAt: listedAt,
        processedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          namefiFeedPostsTable.externalSource,
          namefiFeedPostsTable.externalPostId,
        ],
        set: {
          externalAuthorId: input.sellerAddress.toLowerCase(),
          authorDisplayName: sellerLabel,
          text: postText,
          source: 'system',
          status: 'processed',
          rawPayload,
          postedAt: listedAt,
          processedAt: now,
          failureReason: null,
          skipReason: null,
          updatedAt: now,
        },
      })
      .returning({ id: namefiFeedPostsTable.id });

    if (!post) {
      throw new Error('Failed to upsert Namefi marketplace feed post.');
    }

    await tx
      .insert(namefiFeedListingsTable)
      .values({
        postId: post.id,
        domain: input.domainName,
        askingPrice,
        askingCurrency,
        purchaseUrl: listingUrl,
        sellerUsername: null,
        sellerDisplayName: sellerLabel,
        sourceUrl: listingUrl,
        messageText: postText,
        listedAt,
        postedAt: listedAt,
        expiresAt,
        endedAt: null,
        endReason: null,
      })
      .onConflictDoUpdate({
        target: [
          namefiFeedListingsTable.postId,
          namefiFeedListingsTable.domain,
        ],
        set: {
          askingPrice: sql`excluded.asking_price`,
          askingCurrency: sql`excluded.asking_currency`,
          purchaseUrl: sql`excluded.purchase_url`,
          sellerDisplayName: sql`excluded.seller_display_name`,
          sourceUrl: sql`excluded.source_url`,
          messageText: sql`excluded.message_text`,
          listedAt: sql`excluded.listed_at`,
          postedAt: sql`excluded.posted_at`,
          expiresAt: sql`excluded.expires_at`,
          endedAt: sql`CASE WHEN ${namefiFeedListingsTable.endedAt} IS NOT NULL AND ${namefiFeedListingsTable.endedAt} >= excluded.listed_at THEN ${namefiFeedListingsTable.endedAt} ELSE NULL END`,
          endReason: sql`CASE WHEN ${namefiFeedListingsTable.endedAt} IS NOT NULL AND ${namefiFeedListingsTable.endedAt} >= excluded.listed_at THEN ${namefiFeedListingsTable.endReason} ELSE NULL END`,
          updatedAt: now,
        },
      });
  });

  return { synced: true };
}

export async function recordNamefiMarketplaceListingCancelled({
  input,
  linkedWalletAddresses,
}: {
  input: MlsRecordNamefiMarketplaceListingCancelledInput;
} & MarketplaceLifecycleAuthContext): Promise<{ synced: boolean }> {
  const owner = await assertMarketplaceListingCancelAllowed(
    input,
    linkedWalletAddresses,
  );

  const now = new Date();
  const cancelledAt = deriveMarketplaceCancellationDate({
    clientCancelledAt: input.cancelledAt,
    now,
  });
  const listingUrl = input.listingUrl
    ? normalizeMarketplaceListingUrl(input.marketplaceId, input.listingUrl)
    : NAMEFI_FEED_FALLBACK_URL;

  normalizeListingId(input.listingId);
  const marketplaceLabel = MARKETPLACE_LABELS[input.marketplaceId];
  const seller = deriveMarketplaceCancellationSeller(owner.ownerAddress);
  const postText = `${input.domainName} listing on ${marketplaceLabel} cancelled via Namefi`;
  const externalPostId = buildMarketplaceListingExternalPostId(input);
  const rawPayload = buildMarketplaceListingRawPayload(
    input,
    'cancelled',
  ) as Json;

  const rows = await db.transaction(async (tx) => {
    const [post] = await tx
      .insert(namefiFeedPostsTable)
      .values({
        externalSource: NAMEFI_MARKETPLACE_FEED_SOURCE_ID,
        externalPostId,
        externalConversationId: null,
        externalAuthorId: seller.externalAuthorId,
        authorUsername: null,
        authorDisplayName: seller.displayName,
        text: postText,
        source: 'system',
        status: 'processed',
        rawPayload,
        postedAt: cancelledAt,
        processedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          namefiFeedPostsTable.externalSource,
          namefiFeedPostsTable.externalPostId,
        ],
        set: {
          externalAuthorId: seller.externalAuthorId,
          authorDisplayName: seller.displayName,
          text: postText,
          source: 'system',
          status: 'processed',
          rawPayload,
          postedAt: cancelledAt,
          processedAt: now,
          failureReason: null,
          skipReason: null,
          updatedAt: now,
        },
      })
      .returning({ id: namefiFeedPostsTable.id });

    if (!post) {
      throw new Error('Failed to upsert Namefi marketplace feed post.');
    }

    const updatedRows = await tx
      .insert(namefiFeedListingsTable)
      .values({
        postId: post.id,
        domain: input.domainName,
        askingPrice: null,
        askingCurrency: null,
        purchaseUrl: null,
        sellerUsername: null,
        sellerDisplayName: seller.displayName,
        sourceUrl: listingUrl,
        messageText: postText,
        listedAt: cancelledAt,
        postedAt: cancelledAt,
        expiresAt: null,
        endedAt: cancelledAt,
        endReason: 'cancelled',
      })
      .onConflictDoUpdate({
        target: [
          namefiFeedListingsTable.postId,
          namefiFeedListingsTable.domain,
        ],
        set: {
          sellerDisplayName: sql`excluded.seller_display_name`,
          sourceUrl: sql`excluded.source_url`,
          messageText: sql`excluded.message_text`,
          endedAt: sql`CASE WHEN ${namefiFeedListingsTable.endedAt} IS NULL OR ${namefiFeedListingsTable.endedAt} < excluded.ended_at THEN excluded.ended_at ELSE ${namefiFeedListingsTable.endedAt} END`,
          endReason: sql`CASE WHEN ${namefiFeedListingsTable.endedAt} IS NULL OR ${namefiFeedListingsTable.endedAt} < excluded.ended_at THEN 'cancelled' ELSE ${namefiFeedListingsTable.endReason} END`,
          updatedAt: now,
        },
      })
      .returning({ id: namefiFeedListingsTable.id });

    for (const row of updatedRows) {
      await tx
        .update(namefiFeedListingReportsTable)
        .set({
          status: 'resolved',
          resolution: 'dismissed',
          resolvedAt: now,
        })
        .where(
          and(
            eq(namefiFeedListingReportsTable.listingId, row.id),
            eq(namefiFeedListingReportsTable.status, 'active'),
          ),
        );
    }

    return updatedRows;
  });

  return { synced: rows.length > 0 };
}

export function deriveMarketplaceCancellationDate({
  now,
}: {
  clientCancelledAt: string | undefined;
  now: Date;
}) {
  // Cancellation requests do not carry trusted chain time; use backend receipt
  // time so feed ordering cannot be controlled by browser clocks.
  return new Date(now);
}

export function deriveMarketplaceCancellationSeller(ownerAddress: string) {
  return {
    externalAuthorId: ownerAddress.toLowerCase(),
    displayName: shortenAddress(ownerAddress),
  };
}

function buildMarketplaceListingExternalPostId(
  input: MlsRecordNamefiMarketplaceListingCancelledInput,
) {
  return [
    'listing',
    input.marketplaceId,
    String(input.chainId),
    input.tokenAddress.toLowerCase(),
    input.tokenId,
    encodeURIComponent(normalizeListingId(input.listingId)),
  ].join(':');
}

function buildMarketplaceListingRawPayload(
  input: MlsRecordNamefiMarketplaceListingCancelledInput,
  event: 'created' | 'cancelled',
) {
  return {
    source: NAMEFI_MARKETPLACE_FEED_SOURCE_ID,
    event,
    marketplaceId: input.marketplaceId,
    chainId: input.chainId,
    tokenAddress: input.tokenAddress,
    tokenId: input.tokenId,
    listingId: input.listingId,
    sellerAddress: input.sellerAddress,
    priceRaw: 'priceRaw' in input ? input.priceRaw : null,
    priceDecimal: 'priceDecimal' in input ? input.priceDecimal : null,
    currencySymbol: 'currencySymbol' in input ? input.currencySymbol : null,
    currencyAddress: 'currencyAddress' in input ? input.currencyAddress : null,
    listingUrl: input.listingUrl ?? null,
    listedAt: 'listedAt' in input ? (input.listedAt ?? null) : null,
    expiresAt: 'expiresAt' in input ? (input.expiresAt ?? null) : null,
    cancelledAt: input.cancelledAt ?? null,
  };
}

async function assertMarketplaceListingCreateAllowed(
  input: MlsRecordNamefiMarketplaceListingCreatedInput,
  linkedWalletAddresses: readonly string[],
) {
  const owner = await getMarketplaceDomainOwner(input);
  if (owner.ownerAddress.toLowerCase() !== input.sellerAddress.toLowerCase()) {
    throw new NamefiFeedMarketplaceListingForbiddenError(
      'Marketplace listing seller does not match the current domain owner.',
    );
  }

  assertLinkedWalletIncludes(
    linkedWalletAddresses,
    input.sellerAddress,
    'Marketplace listing seller wallet must be linked to the current user.',
  );
}

async function assertMarketplaceListingCancelAllowed(
  input: MlsRecordNamefiMarketplaceListingCancelledInput,
  linkedWalletAddresses: readonly string[],
) {
  const owner = await getMarketplaceDomainOwner(input);
  assertLinkedWalletIncludes(
    linkedWalletAddresses,
    owner.ownerAddress,
    'Current domain owner wallet must be linked to the current user.',
  );

  return owner;
}

async function getMarketplaceDomainOwner(
  input: MarketplaceListingIdentityInput,
) {
  if (
    input.tokenAddress.toLowerCase() !==
    NAMEFI_NFT_CONTRACT_ADDRESS.toLowerCase()
  ) {
    throw new NamefiFeedMarketplaceListingValidationError(
      'Marketplace listing token address does not match the Namefi NFT contract.',
    );
  }

  const expectedTokenId = getTokenIdFromDomainName(input.domainName);
  if (!expectedTokenId || expectedTokenId !== input.tokenId) {
    throw new NamefiFeedMarketplaceListingValidationError(
      'Marketplace listing token id does not match the domain.',
    );
  }

  const [owner] = await db
    .with(namefiNftOwnersCte)
    .select({
      ownerAddress: namefiNftOwnersView.ownerAddress,
    })
    .from(namefiNftOwnersView)
    .where(
      and(
        eq(namefiNftOwnersView.normalizedDomainName, input.domainName),
        eq(namefiNftOwnersView.chainId, input.chainId),
      ),
    )
    .limit(1);

  if (!owner) {
    throw new NamefiFeedMarketplaceListingDomainNotFoundError();
  }

  return owner;
}

function assertLinkedWalletIncludes(
  linkedWalletAddresses: readonly string[],
  expectedAddress: string,
  message: string,
) {
  const normalizedExpected = expectedAddress.toLowerCase();
  const hasLinkedWallet = linkedWalletAddresses.some(
    (walletAddress) => walletAddress.toLowerCase() === normalizedExpected,
  );

  if (!hasLinkedWallet) {
    throw new NamefiFeedMarketplaceListingForbiddenError(message);
  }
}

function parseEventDateOrThrow(value: string | undefined, fallback: Date) {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new NamefiFeedMarketplaceListingValidationError(
      'Marketplace listing date is invalid.',
    );
  }

  return parsed;
}

function parseOptionalDateOrThrow(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new NamefiFeedMarketplaceListingValidationError(
      'Marketplace listing expiry is invalid.',
    );
  }

  return parsed;
}

function assertDateNotTooFarInFuture(date: Date, now: Date, label: string) {
  if (date.getTime() > now.getTime() + MAX_EVENT_FUTURE_DRIFT_MS) {
    throw new NamefiFeedMarketplaceListingValidationError(
      `${label} cannot be in the future.`,
    );
  }
}

function normalizeMarketplaceListingUrl(
  marketplaceId: MlsRecordNamefiMarketplaceListingCreatedInput['marketplaceId'],
  value: string,
) {
  const trimmed = normalizeOptionalText(value);
  if (!trimmed || trimmed.length > 2048) {
    throw new NamefiFeedMarketplaceListingValidationError(
      'Marketplace listing URL must be an HTTP(S) URL.',
    );
  }

  const normalizedUrl = normalizePublicHttpUrl(trimmed);
  if (!normalizedUrl) {
    throw new NamefiFeedMarketplaceListingValidationError(
      'Marketplace listing URL must be an HTTP(S) URL.',
    );
  }

  const parsedUrl = new URL(normalizedUrl);
  const hostname = parsedUrl.hostname.toLowerCase();
  const allowedHosts = MARKETPLACE_ALLOWED_HOSTS[marketplaceId] ?? [];
  const isAllowedHost = allowedHosts.some(
    (allowedHost) =>
      hostname === allowedHost || hostname.endsWith(`.${allowedHost}`),
  );

  if (!isAllowedHost) {
    throw new NamefiFeedMarketplaceListingValidationError(
      'Marketplace listing URL host does not match the marketplace.',
    );
  }

  return normalizedUrl;
}

function normalizeListingId(value: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_LISTING_ID_LENGTH) {
    throw new NamefiFeedMarketplaceListingValidationError(
      'Marketplace listing id is invalid.',
    );
  }

  return normalized;
}

function normalizePriceRaw(value: string) {
  const normalized = value.trim();
  if (!RAW_PRICE_PATTERN.test(normalized)) {
    throw new NamefiFeedMarketplaceListingValidationError(
      'Marketplace listing raw price is invalid.',
    );
  }

  if (BigInt(normalized) <= 0n) {
    throw new NamefiFeedMarketplaceListingValidationError(
      'Marketplace listing price must be positive.',
    );
  }

  return normalized;
}

function normalizePriceDecimal(value: string) {
  const normalized = value.trim();
  if (
    !DECIMAL_PRICE_PATTERN.test(normalized) ||
    !NON_ZERO_DECIMAL_PATTERN.test(normalized)
  ) {
    throw new NamefiFeedMarketplaceListingValidationError(
      'Marketplace listing price is invalid.',
    );
  }

  return normalized;
}

function normalizeCurrencySymbol(value: string) {
  const normalized = normalizeOptionalText(value)?.toUpperCase();
  if (!normalized || !CURRENCY_SYMBOL_PATTERN.test(normalized)) {
    throw new NamefiFeedMarketplaceListingValidationError(
      'Marketplace listing currency symbol is invalid.',
    );
  }

  return normalized;
}

function shortenAddress(value: string) {
  const normalized = value.trim();
  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
}
