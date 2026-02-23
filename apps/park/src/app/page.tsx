import { headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Footer } from '@/components/footer';
import { ParkHeader } from '@/components/header';
import { ParkNftCard } from '@/components/nft-card';
import { Button } from '@/components/ui/shadcn/button';
import { getInternalGenerationsByDomain } from '@/lib/ai';
import { config } from '@/lib/env';
import { getDomainQueryParam } from '@/lib/request';
import {
  countDomainsByOwner,
  type DomainDocument,
  getDomainDocument,
  getTagsByDomain,
} from '@/lib/metadata';

type MarketplaceLink = {
  label: string;
  href: string;
  description?: string;
};

interface PageData {
  domainDocument: DomainDocument;
  domainsCountByOwner: number;
  domainTags: string[];
  aiGenerations: Awaited<ReturnType<typeof getInternalGenerationsByDomain>>;
  host: string;
}

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

async function handleDnsRedirect(domain: string) {
  try {
    const records = await fetchDnsTxtRecords(domain);
    const redirectMarker = records.find((record) =>
      record.startsWith('"--nfi-redirect='),
    );
    if (!redirectMarker) {
      return;
    }
    const redirectedUrl = redirectMarker.replace(/(^"|"$)/g, '').split('=')[1];
    if (redirectedUrl) {
      redirect(redirectedUrl);
    }
  } catch {
    // If DNS query fails we simply continue rendering the parking page.
  }
}

function is0xCityDomain(ldh?: string | null): boolean {
  return Boolean(ldh?.endsWith('.0x.city'));
}

function buildFrontendUrl(pathname: string): string {
  try {
    return new URL(pathname, config.FRONTEND_URL).toString();
  } catch {
    return new URL(pathname, 'https://namefi.io').toString();
  }
}

function buildOwnerDomainsUrl(owner?: string | null): string | null {
  if (!owner) return null;
  return buildFrontendUrl(`/owner/${encodeURIComponent(owner)}`);
}

function buildManageDomainUrl(document: DomainDocument): string | null {
  const ldh = document.ldh;
  if (!ldh) return null;
  if (is0xCityDomain(ldh)) {
    return `https://0x.city/domain/${ldh}`;
  }
  return buildFrontendUrl(`/domains/${encodeURIComponent(ldh)}`);
}

function normalizeTokenId(tokenId?: string | null): string | null {
  if (!tokenId) return null;
  try {
    return BigInt(tokenId).toString();
  } catch {
    return tokenId;
  }
}

function buildMarketplaceLinks(document: DomainDocument): MarketplaceLink[] {
  const tokenId = normalizeTokenId(document.tokenId);
  const chain = document.chainName ?? 'ethereum';

  if (!tokenId) {
    return [
      {
        label: 'Manage on Namefi',
        href: buildFrontendUrl('/domains'),
      },
    ];
  }

  const contract = DEFAULT_NAMEFI_NFT_ADDRESS;

  const networkSlug = (() => {
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

  const items: MarketplaceLink[] = [
    {
      label: 'OpenSea',
      href: `https://opensea.io/assets/${networkSlug}/${contract}/${tokenId}`,
    },
    {
      label: 'Magic Eden',
      href: `https://magiceden.io/collections/${networkSlug}/${contract}?evmItemDetailsModal=1%7E${contract}%7E${tokenId}`,
    },
    {
      label: 'Coinbase NFT',
      href: `https://nft.coinbase.com/nft/${networkSlug}/${contract}/${tokenId}`,
    },
    {
      label: 'LooksRare',
      href: `https://looksrare.org/collections/${contract}/${tokenId}`,
    },
    {
      label: 'OKX',
      href: `https://www.okx.com/web3/marketplace/nft/asset/${networkSlug}/${contract}/${tokenId}`,
    },
  ];

  return items;
}

async function loadPageData(host: string): Promise<PageData> {
  await handleDnsRedirect(host);

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
  const manageUrl = buildManageDomainUrl(data.domainDocument);
  const searchUrl = buildFrontendUrl('/');
  const ownerDomainsUrl = buildOwnerDomainsUrl(
    data.domainDocument.currentOwner,
  );
  const marketplaceLinks = buildMarketplaceLinks(data.domainDocument);
  const displayName =
    data.domainDocument.unicode ??
    data.domainDocument.ldh ??
    data.host ??
    'Namefi Domain';

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
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <ParkHeader searchUrl={searchUrl} />
      <main className="flex-1 overflow-x-hidden">
        <section className="park-hero relative isolate px-6 pb-16 pt-10 sm:pb-20 sm:pt-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:gap-12">
            <div className="space-y-7 py-2 text-center sm:space-y-8">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 text-[1.01rem] font-medium leading-relaxed text-foreground/88 sm:text-[1.15rem]">
                <span>This domain is parked free courtesy of</span>
                <Link
                  href="https://namefi.io"
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
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
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
                    <p className="mx-auto max-w-[44rem] text-balance text-[1.02rem] leading-[1.8] text-foreground/90 sm:text-[1.2rem] lg:mx-0">
                      {description}
                    </p>
                    <p className="mx-auto max-w-[44rem] text-[0.98rem] leading-[1.7] text-foreground/63 italic sm:text-[1.08rem] lg:mx-0">
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
                Where to trade {displayName}
              </h2>
              <p className="text-muted-foreground">
                Explore trusted venues curated by Namefi for buying or listing
                this domain.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {marketplaceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group relative flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/80 p-5 transition hover:-translate-y-0.5 hover:border-brand-primary/60 hover:shadow-lg"
                >
                  <span className="text-sm font-semibold text-foreground">
                    {link.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {link.description ??
                      'Open the marketplace listing for this domain.'}
                  </span>
                  <span className="absolute right-5 top-5 text-sm text-muted-foreground transition group-hover:text-brand-primary">
                    ↗
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer className="mt-auto" />
    </div>
  );
}
