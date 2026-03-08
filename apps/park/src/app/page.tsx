import { headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';
import { Footer } from '@/components/footer';
import { ParkHeader } from '@/components/header';
import { ParkNftCard } from '@/components/nft-card';
import { Button } from '@/components/ui/shadcn/button';
import { getInternalGenerationsByDomain } from '@/lib/ai';
import { config } from '@/lib/env';
import {
  buildFrontendUrl,
  getFrontendBaseUrl,
  resolvePbnApex,
} from '@/lib/frontend-url';
import { getDomainQueryParam } from '@/lib/request';
import {
  countDomainsByOwner,
  type DomainDocument,
  getDomainDocument,
  getTagsByDomain,
} from '@/lib/metadata';

type MarketplaceKey = 'manage' | 'opensea' | 'magiceden' | 'looksrare' | 'okx';

type MarketplaceLink = {
  key: MarketplaceKey;
  label: string;
  href: string;
  logoSrc: string;
  logoMutedSrc?: string;
  logoWidth: number;
  logoHeight: number;
  logoClassName?: string;
};

type PageData =
  | {
      type: 'park_page';
      domainDocument: DomainDocument;
      domainsCountByOwner: number;
      domainTags: string[];
      aiGenerations: Awaited<ReturnType<typeof getInternalGenerationsByDomain>>;
      host: string;
    }
  | {
      type: 'redirect_url';
      redirectUrl: string;
    };

interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DnsResponse {
  Status: number;
  Answer?: DnsAnswer[];
}

const DEFAULT_NAMEFI_NFT_ADDRESS =
  config.NAMEFI_NFT_ADDRESS ?? '0x0000000000cf80e7cf8fa4480907f692177f8e06';

const GOOGLE_DOH_ENDPOINT = 'https://dns.google/resolve';
const MARKETPLACE_META = {
  manage: {
    label: 'Manage on Namefi',
    logoSrc: '/logotype.svg',
    logoMutedSrc: '/logotype.svg',
    logoWidth: 92,
    logoHeight: 30,
    logoClassName: 'h-5 w-auto opacity-85 sm:h-6',
  },
  opensea: {
    label: 'OpenSea',
    logoSrc: '/assets/marketplaces/opensea.svg',
    logoMutedSrc: '/assets/marketplaces/opensea-gray.svg',
    logoWidth: 112,
    logoHeight: 30,
    logoClassName: 'h-7 w-auto sm:h-8',
  },
  magiceden: {
    label: 'Magic Eden',
    logoSrc: '/assets/marketplaces/magiceden.svg',
    logoMutedSrc: '/assets/marketplaces/magiceden-gray.svg',
    logoWidth: 120,
    logoHeight: 30,
    logoClassName: 'h-7 w-auto sm:h-8',
  },
  looksrare: {
    label: 'LooksRare',
    logoSrc: '/assets/marketplaces/looksrare.svg',
    logoMutedSrc: '/assets/marketplaces/looksrare-gray.svg',
    logoWidth: 118,
    logoHeight: 30,
    logoClassName: 'h-7 w-auto sm:h-8',
  },
  okx: {
    label: 'OKX',
    logoSrc: '/assets/marketplaces/okx.svg',
    logoMutedSrc: '/assets/marketplaces/okx-gray.svg',
    logoWidth: 80,
    logoHeight: 30,
    logoClassName: 'h-7 w-auto sm:h-8',
  },
} as const satisfies Record<
  MarketplaceKey,
  Omit<MarketplaceLink, 'key' | 'href'>
>;
const PBN_BRAND_TOKENS = {
  '0x.city': {
    '--brand-primary': 'oklch(51.06% 0.2301 277)',
    '--brand-secondary': 'oklch(58.54% 0.2041 277.1)',
    '--brand-tertiary': 'oklch(68.01% 0.1583 276.9)',
  },
  cv: {
    '--brand-primary': 'oklch(71.4% 0.203 305.504)',
    '--brand-secondary': 'oklch(71.4% 0.203 305.504)',
    '--brand-tertiary': 'oklch(71.4% 0.203 305.504)',
  },
  today: {
    '--brand-primary': 'oklch(78.9% 0.154 211.53)',
    '--brand-secondary': 'oklch(78.9% 0.154 211.53)',
    '--brand-tertiary': 'oklch(78.9% 0.154 211.53)',
  },
} as const;

function stripPort(rawHost: string): string {
  if (rawHost.startsWith('[') && rawHost.endsWith(']')) {
    return rawHost.slice(1, -1);
  }
  return rawHost.split(':')[0] ?? rawHost;
}

async function getRequestHost(domainOverride?: string | null): Promise<string> {
  if (domainOverride) {
    return domainOverride;
  }

  const requestHeaders = await headers();
  const domainFromQuery = getDomainQueryParam(requestHeaders);
  if (domainFromQuery) {
    return domainFromQuery;
  }

  const hostHeader =
    requestHeaders.get('x-original-host') ?? requestHeaders.get('host');
  if (!hostHeader) return 'localhost';
  return stripPort(hostHeader);
}

async function fetchDnsTxtRecords(domain: string): Promise<string[]> {
  const url = new URL(GOOGLE_DOH_ENDPOINT);
  url.searchParams.set('name', domain);
  url.searchParams.set('type', 'TXT');

  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as DnsResponse;
  if (payload.Status !== 0 || !payload.Answer) {
    return [];
  }
  return payload.Answer.map((answer) => answer.data);
}

function stripQuotations(text: string): string {
  return text.trim().replace(/(^"|^'|"$|'$)/g, '');
}

async function detectNamefiRedirectFromDnsRecords(
  domain: string,
): Promise<string | undefined> {
  try {
    const records = await fetchDnsTxtRecords(domain);
    const redirectMarker = records.find((record) =>
      stripQuotations(record).startsWith('--nfi-redirect='),
    );
    if (!redirectMarker) {
      return;
    }
    const redirectUrl = stripQuotations(redirectMarker).replace(
      /^--nfi-redirect=/,
      '',
    );
    return redirectUrl;
  } catch {
    // If DNS query fails we simply continue rendering the parking page.
  }
}

function is0xCityDomain(ldh?: string | null): boolean {
  return Boolean(ldh?.endsWith('.0x.city'));
}

function buildOwnerDomainsUrl(
  owner: string | null | undefined,
  frontendBaseUrl: string,
): string | null {
  if (!owner) return null;
  return buildFrontendUrl(`/owner/${encodeURIComponent(owner)}`, {
    baseUrl: frontendBaseUrl,
  });
}

function buildManageDomainUrl(
  document: DomainDocument,
  frontendBaseUrl: string,
): string | null {
  const ldh = document.ldh;
  if (!ldh) return null;

  if (is0xCityDomain(ldh)) {
    return buildFrontendUrl(`/domain/${encodeURIComponent(ldh)}`, {
      baseUrl: frontendBaseUrl,
    });
  }

  return buildFrontendUrl(`/domains/${encodeURIComponent(ldh)}`, {
    baseUrl: frontendBaseUrl,
  });
}

function normalizeTokenId(tokenId?: string | null): string | null {
  if (!tokenId) return null;
  try {
    return BigInt(tokenId).toString();
  } catch {
    return tokenId;
  }
}

function buildMarketplaceLinks(
  document: DomainDocument,
  frontendBaseUrl: string,
): MarketplaceLink[] {
  const toMarketplaceLink = (
    key: MarketplaceKey,
    href: string,
  ): MarketplaceLink => ({
    key,
    href,
    ...MARKETPLACE_META[key],
  });

  const tokenId = normalizeTokenId(document.tokenId);
  const chain = document.chainName ?? 'ethereum';

  if (!tokenId) {
    const manageDomainUrl =
      buildManageDomainUrl(document, frontendBaseUrl) ??
      buildFrontendUrl('/domains', { baseUrl: frontendBaseUrl });

    return [toMarketplaceLink('manage', manageDomainUrl)];
  }

  const contract = DEFAULT_NAMEFI_NFT_ADDRESS;

  const openSeaNetworkSlug = (() => {
    switch (chain) {
      case 'base':
        return 'base';
      case 'goerli':
        return 'goerli';
      case 'sepolia':
        return 'sepolia';
      default:
        return 'ethereum';
    }
  })();

  const magicEdenNetworkSlug =
    chain === 'base' || chain === 'ethereum' ? chain : null;

  const okxNetworkSlug =
    chain === 'base' ? 'base' : chain === 'ethereum' ? 'eth' : null;

  const items: MarketplaceLink[] = [
    toMarketplaceLink(
      'opensea',
      `https://opensea.io/item/${openSeaNetworkSlug}/${contract}/${tokenId}`,
    ),
  ];

  if (magicEdenNetworkSlug) {
    items.push(
      toMarketplaceLink(
        'magiceden',
        `https://magiceden.io/collections/${magicEdenNetworkSlug}/${contract}?evmItemDetailsModal=1%7E${contract}%7E${tokenId}`,
      ),
    );
  }

  if (chain === 'ethereum') {
    items.push(
      toMarketplaceLink(
        'looksrare',
        `https://looksrare.org/collections/${contract}/${tokenId}`,
      ),
    );
  }

  if (okxNetworkSlug) {
    items.push(
      toMarketplaceLink(
        'okx',
        `https://www.okx.com/web3/nft/asset/${okxNetworkSlug}/${contract}/${tokenId}`,
      ),
    );
  }

  return items;
}

function buildChainExplorerUrl(document: DomainDocument): string | null {
  const chain = document.chainName ?? 'ethereum';
  const tokenId = normalizeTokenId(document.tokenId);
  const contractAddress = DEFAULT_NAMEFI_NFT_ADDRESS;

  const explorerBaseUrl = (() => {
    switch (chain) {
      case 'base':
        return 'https://basescan.org';
      case 'sepolia':
        return 'https://sepolia.etherscan.io';
      case 'goerli':
        return 'https://goerli.etherscan.io';
      case 'robinhood-testnet':
      case 'chain-46630':
        return 'https://explorer.testnet.chain.robinhood.com';
      default:
        return 'https://etherscan.io';
    }
  })();

  if (!tokenId) {
    return `${explorerBaseUrl}/address/${contractAddress}`;
  }

  return `${explorerBaseUrl}/token/${contractAddress}?a=${encodeURIComponent(tokenId)}`;
}

function resolvePbnBrandStyle(
  pbnApex?: string | null,
): CSSProperties | undefined {
  if (!pbnApex) return undefined;
  if (pbnApex === '0x.city') {
    return PBN_BRAND_TOKENS['0x.city'] as CSSProperties;
  }
  if (pbnApex.endsWith('.cv')) {
    return PBN_BRAND_TOKENS.cv as CSSProperties;
  }
  if (pbnApex.endsWith('.today')) {
    return PBN_BRAND_TOKENS.today as CSSProperties;
  }
  return undefined;
}

async function loadPageData(host: string): Promise<PageData> {
  const redirectUrl = await detectNamefiRedirectFromDnsRecords(host);
  if (redirectUrl) {
    return {
      type: 'redirect_url',
      redirectUrl,
    };
  }

  let domainDocument: DomainDocument | null = null;
  let fetchFailed = false;

  try {
    domainDocument = await getDomainDocument(host);
  } catch (error) {
    fetchFailed = true;
    console.warn(
      `Failed to fetch domain document for ${host}:`,
      error instanceof Error ? error.message : error,
    );
  }

  if (!fetchFailed && !domainDocument) {
    redirect(`/api/healthz?domain=${encodeURIComponent(host)}`);
  }

  const resolvedDocument: DomainDocument = domainDocument ?? {
    _id: host,
    ldh: host,
    unicode: host,
    explain: 'This domain is parked with Namefi.',
  };

  const [ownerCountResult, tagsResult, aiGenerations] = await Promise.all([
    (async () => {
      if (fetchFailed || !domainDocument?.currentOwner) return 0;
      try {
        return await countDomainsByOwner(domainDocument.currentOwner);
      } catch {
        return 0;
      }
    })(),
    (async () => {
      if (fetchFailed || !domainDocument?.ldh) return [];
      try {
        return await getTagsByDomain(domainDocument.ldh);
      } catch {
        return [];
      }
    })(),
    fetchFailed
      ? Promise.resolve([])
      : getInternalGenerationsByDomain(domainDocument?.ldh ?? host),
  ]);

  return {
    type: 'park_page',
    domainDocument: resolvedDocument,
    domainsCountByOwner: ownerCountResult,
    domainTags: tagsResult,
    aiGenerations,
    host,
  };
}

interface ParkPageSearchParams {
  domain?: string | string[] | undefined;
}

function coerceSearchParam(value?: string | string[]): string | null {
  if (Array.isArray(value)) {
    const match = value.find((item) => Boolean(item?.trim()));
    return match ? match.trim().toLowerCase() : null;
  }
  const sanitized = value?.trim();
  return sanitized ? sanitized.toLowerCase() : null;
}

export default async function ParkPage({
  searchParams,
}: {
  searchParams?: Promise<ParkPageSearchParams> | ParkPageSearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const domainFromQuery = coerceSearchParam(resolvedSearchParams?.domain);
  const host = await getRequestHost(domainFromQuery);
  const data = await loadPageData(host);
  if (data.type === 'redirect_url') {
    redirect(data.redirectUrl);
    return <></>;
  }
  const pbnApex = resolvePbnApex({
    domain: data.domainDocument.ldh ?? host,
    host,
  });
  const pbnBrandStyle = resolvePbnBrandStyle(pbnApex);
  const frontendBaseUrl = getFrontendBaseUrl({
    domain: data.domainDocument.ldh ?? host,
    host,
  });
  const homeUrl = buildFrontendUrl('/', { baseUrl: frontendBaseUrl });
  const manageUrl = buildManageDomainUrl(data.domainDocument, frontendBaseUrl);
  const searchUrl = homeUrl;
  const ownerDomainsUrl = buildOwnerDomainsUrl(
    data.domainDocument.currentOwner,
    frontendBaseUrl,
  );
  const marketplaceLinks = buildMarketplaceLinks(
    data.domainDocument,
    frontendBaseUrl,
  );
  const chainExplorerUrl = buildChainExplorerUrl(data.domainDocument);
  const description =
    data.domainDocument.explain ??
    'This domain is parked with Namefi. Explore ownership details and marketplace listings.';
  const aiDisclaimer =
    'Powered by Namefi AI™ (beta), could be inaccurate, not financial/trade advice. DYOR.';

  const aiPreview = data.aiGenerations.at(0);

  const insightTags = [
    ...(data.domainDocument.highlights?.filter((item): item is string =>
      Boolean(item?.trim()),
    ) ?? []),
    ...data.domainTags,
  ]
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index)
    .slice(0, 12);

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-foreground"
      style={pbnBrandStyle}
    >
      <ParkHeader homeUrl={homeUrl} searchUrl={searchUrl} />
      <main className="flex-1">
        <section className="park-hero relative isolate px-6 pb-16 pt-10 sm:pb-20 sm:pt-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:gap-12">
            <div className="space-y-4 py-2 text-center sm:space-y-5">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 text-[1.01rem] font-medium leading-relaxed text-foreground/88 sm:text-[1.15rem]">
                <span>This domain is parked free courtesy of</span>
                <Link
                  href={homeUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center transition hover:opacity-90"
                >
                  <Image
                    src="/logotype.svg"
                    alt="Namefi"
                    width={104}
                    height={34}
                    className="h-6 w-auto sm:h-7"
                  />
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-full border border-brand-primary/62 bg-background/72 px-7 text-[0.98rem] font-semibold tracking-[0.01em] text-foreground shadow-none transition hover:border-brand-primary hover:bg-brand-primary/12 sm:h-12 sm:px-9 sm:text-[1.05rem]"
                >
                  <Link href="#marketplaces">Buy this domain</Link>
                </Button>
                {manageUrl ? (
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-full border border-brand-primary/45 bg-background/72 px-7 text-[0.98rem] font-semibold tracking-[0.01em] text-foreground shadow-none transition hover:border-brand-primary/75 hover:bg-brand-primary/10 sm:h-12 sm:px-9 sm:text-[1.05rem]"
                  >
                    <Link
                      href={manageUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Manage domain
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-10 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)] lg:items-start">
              <ParkNftCard
                domain={data.domainDocument}
                domainsCountByOwner={data.domainsCountByOwner}
                ownerUrl={ownerDomainsUrl}
                aiPreviewUrl={aiPreview?.url}
                host={host}
                pbnApex={pbnApex}
                chainExplorerUrl={chainExplorerUrl}
              />
              <div className="flex flex-col gap-8">
                <div className="space-y-6 text-center lg:text-left">
                  <div className="space-y-5">
                    {insightTags.length ? (
                      <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                        {insightTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex h-11 items-center rounded-full border border-brand-primary/50 bg-background/72 px-5 text-[1rem] font-semibold tracking-[0.01em] text-brand-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="mx-auto max-w-[44rem] text-balance text-[1.02rem] leading-[1.8] font-semibold text-foreground/90 sm:text-[1.2rem] lg:mx-0">
                      {description}
                    </p>
                    <p className="mx-auto max-w-[44rem] text-[0.9rem] leading-[1.65] text-foreground/63 italic sm:text-[0.98rem] lg:mx-0">
                      {aiDisclaimer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="marketplaces" className="scroll-mt-28 px-6 pb-16">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-2xl font-semibold">
                Buy or see this domain on
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {marketplaceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-background/80 transition hover:-translate-y-0.5 hover:border-brand-primary/65 hover:bg-background/88 hover:shadow-[0_24px_45px_-36px_color-mix(in_srgb,var(--brand-primary)_56%,transparent)]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_65%_at_18%_0%,color-mix(in_srgb,var(--brand-primary)_16%,transparent),transparent_72%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex h-20 items-center justify-center px-4 sm:h-24 sm:px-5">
                    <span className="sr-only">{`Open ${link.label}`}</span>
                    <div className="relative inline-flex min-w-0 items-center justify-center">
                      <Image
                        src={link.logoMutedSrc ?? link.logoSrc}
                        alt={`${link.label} logo`}
                        width={link.logoWidth}
                        height={link.logoHeight}
                        className={`${link.logoClassName ?? 'h-5 w-auto'} transition-opacity duration-250 ${link.logoMutedSrc ? 'opacity-90 group-hover:opacity-0' : 'opacity-95'}`}
                      />
                      {link.logoMutedSrc ? (
                        <Image
                          src={link.logoSrc}
                          alt=""
                          aria-hidden
                          width={link.logoWidth}
                          height={link.logoHeight}
                          className={`absolute transition-opacity duration-250 ${link.logoClassName ?? 'h-5 w-auto'} opacity-0 group-hover:opacity-100`}
                        />
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer
        className="mt-auto"
        frontendBaseUrl={frontendBaseUrl}
        pbnApex={pbnApex}
      />
    </div>
  );
}
