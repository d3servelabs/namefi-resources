import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import punycode from 'punycode';
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

function buildManageDomainUrl(document: DomainDocument): string | null {
  const ldh = document.ldh;
  if (!ldh) return null;
  if (is0xCityDomain(ldh)) {
    return `https://0x.city/domain/${ldh}`;
  }
  return `https://app.namefi.io/dashboard/domains/${ldh}`;
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
        href: 'https://app.namefi.io/dashboard/domains',
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

function buildNftSvgUrl(
  document: DomainDocument,
  host?: string | null,
): string | null {
  const base = config.NAMEFI_MD_API_ENDPOINT;
  if (!base) return null;

  const raw = document.ldh ?? host ?? document.unicode ?? null;
  if (!raw) return null;

  let ascii: string;
  try {
    ascii = punycode.toASCII(raw.toLowerCase());
  } catch {
    ascii = raw.toLowerCase();
  }

  try {
    const url = new URL(base);
    const chainSegment = document.chainName
      ? `${document.chainName.toLowerCase()}/`
      : '';
    url.pathname = `${chainSegment}svg/${ascii}/image.svg`;
    return url.toString();
  } catch {
    return null;
  }
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
  const marketplaceLinks = buildMarketplaceLinks(data.domainDocument);
  const displayName =
    data.domainDocument.unicode ??
    data.domainDocument.ldh ??
    data.host ??
    'Namefi Domain';

  const description =
    data.domainDocument.explain ??
    'This domain is parked with Namefi. Explore ownership details and marketplace listings.';

  const aiPreview = data.aiGenerations.at(0);
  const nftSvgUrl = buildNftSvgUrl(data.domainDocument, host);

  const aiGallery = data.aiGenerations
    .filter((generation) => Boolean(generation.url))
    .slice(0, 6);

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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ParkHeader host={host} />
      <main className="flex-1">
        <section className="park-hero relative isolate px-6 pb-20 pt-16 sm:pt-24">
          <div className="mx-auto flex max-w-6xl flex-col gap-12">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
              <ParkNftCard
                domain={data.domainDocument}
                domainsCountByOwner={data.domainsCountByOwner}
                manageUrl={manageUrl}
                aiPreviewUrl={aiPreview?.url}
                nftSvgUrl={nftSvgUrl}
                host={host}
              />
              <div className="flex flex-col gap-10">
                <div className="space-y-6 text-center lg:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.24em] text-muted-foreground/80 lg:justify-start">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[0.68rem] font-semibold text-muted-foreground">
                      Parked by Namefi
                    </span>
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
                      {displayName}
                    </h1>
                    {insightTags.length ? (
                      <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                        {insightTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg lg:mx-0">
                      {description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                    <Button
                      asChild
                      className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-none transition hover:bg-primary/90"
                    >
                      <Link href="#marketplaces">Buy this domain</Link>
                    </Button>
                    {manageUrl ? (
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-full border-border/70 bg-background/70 px-8 py-3 text-sm font-semibold text-foreground shadow-none transition hover:border-brand-primary/60 hover:bg-background"
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
              </div>
            </div>
          </div>
        </section>

        {aiGallery.length ? (
          <section className="px-6 pb-16">
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">AI gallery</h2>
                  <p className="text-sm text-muted-foreground">
                    Visual explorations crafted by Namefi AI. Each render opens
                    the original high-resolution preview.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {aiGallery.map((generation) => (
                  <Link
                    key={generation.id ?? generation.url}
                    href={generation.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/80 p-3 transition hover:-translate-y-0.5 hover:border-brand-primary/60 hover:shadow-lg"
                  >
                    {/* biome-ignore lint/performance/noImgElement: remote AI images are served without Next image optimisation */}
                    <img
                      src={generation.url}
                      alt={`Namefi AI preview ${generation.id ?? ''}`}
                      loading="lazy"
                      className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-border/60 object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Namefi AI render</span>
                      <span className="transition group-hover:text-brand-primary">
                        View ↗
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section id="marketplaces" className="px-6 pb-16">
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
