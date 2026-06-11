import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import { ParkShareMenu } from '@/components/share-menu';
import { ParkWalletAvatarImage } from '@/components/wallet-avatar-image';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@namefi-astra/ui/components/shadcn/card';
import { getEnsDataAvatarUrl } from '@namefi-astra/utils/wallet-avatar';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { DomainDocument } from '@/lib/metadata';

const LEADING_SLASHES_PATTERN = /^\/+/;

const CHAIN_BADGE_BY_NAME = {
  base: {
    label: 'Base',
    icon: '/assets/chains/base-badge.svg',
  },
  ethereum: {
    label: 'Ethereum',
    icon: '/assets/chains/ethereum-badge.svg',
  },
  sepolia: {
    label: 'Sepolia',
    icon: '/assets/chains/ethereum-badge.svg',
  },
  goerli: {
    label: 'Goerli',
    icon: '/assets/chains/ethereum-badge.svg',
  },
  'robinhood-testnet': {
    label: 'Robinhood Testnet',
    icon: '/assets/chains/robinhood-testnet-badge.svg',
  },
  'chain-46630': {
    label: 'Robinhood Testnet',
    icon: '/assets/chains/robinhood-testnet-badge.svg',
  },
} as const satisfies Record<string, { label: string; icon: string }>;

const PBN_BACKGROUND_BY_APEX: Partial<Record<string, string>> = {
  '0x.city': '/assets/pbn/0x-city.png',
};

const PBN_MARK_BY_APEX: Partial<Record<string, string>> = {
  '0x.city': '/assets/pbn/powered-by-namefi-0xcity.svg',
};

function formatExpiry(expiration?: string | null): string | null {
  if (!expiration) return null;

  const parsed = new Date(expiration);
  if (Number.isNaN(parsed.getTime())) return expiration;

  return parsed.toISOString().slice(0, 10);
}

function formatOwner(address?: string | null): string {
  if (!address) return 'Unassigned';
  if (address.startsWith('0x') && address.length > 12) {
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }
  return address;
}

function getChainBadge(chainName?: DomainDocument['chainName']) {
  if (!chainName) return null;
  return CHAIN_BADGE_BY_NAME[chainName] ?? null;
}

const ACTION_BUTTON_CLASS =
  'h-11 w-full min-w-0 justify-center rounded-[1rem] border border-white/[0.08] bg-white/[0.045] px-3.5 text-[0.82rem] font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/15 hover:bg-white/[0.075] sm:text-sm';

function splitDomainForPbnOverlay(
  domainName: string,
  pbnApex?: string | null,
): { primary: string; secondary: string | null } {
  const sanitized = domainName.trim();
  if (!sanitized) {
    return { primary: 'this domain', secondary: null };
  }

  if (pbnApex) {
    const pbnSuffix = `.${pbnApex}`;
    if (sanitized.toLowerCase().endsWith(pbnSuffix.toLowerCase())) {
      const withoutSuffix = sanitized.slice(0, -pbnSuffix.length).trim();
      if (withoutSuffix) {
        return { primary: withoutSuffix, secondary: pbnSuffix };
      }
    }
  }

  const [label, ...rest] = sanitized.split('.');
  if (!rest.length || !label) {
    return { primary: sanitized, secondary: null };
  }

  return { primary: label, secondary: `.${rest.join('.')}` };
}

interface ParkPbnArtworkContentProps {
  domainName: string;
  pbnApex: string;
}

function ParkPbnArtworkContent({
  domainName,
  pbnApex,
}: ParkPbnArtworkContentProps) {
  const pbnBackground = PBN_BACKGROUND_BY_APEX[pbnApex] ?? null;
  const pbnMark = PBN_MARK_BY_APEX[pbnApex] ?? null;
  const pbnDomainLabel = splitDomainForPbnOverlay(domainName, pbnApex);

  return (
    <>
      {pbnBackground ? (
        <Image
          src={pbnBackground}
          alt=""
          aria-hidden={true}
          fill={true}
          className="object-cover opacity-42"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.34),transparent_56%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.28),transparent_62%)]" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(15,23,42,0.14)_0%,rgba(0,0,0,0.38)_70%)]" />
      <div className="absolute left-4 top-4 z-10 inline-flex items-center rounded-[0.38rem] bg-black/52 px-1.5 py-1 backdrop-blur-sm">
        {pbnMark ? (
          <Image
            src={pbnMark}
            alt="Powered by Namefi"
            width={82}
            height={32}
            className="h-5 w-auto"
          />
        ) : (
          <Image
            src="/powered-by-namefi.svg"
            alt="Powered by Namefi"
            width={127}
            height={24}
            className="h-4 w-auto"
          />
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-[3] h-[28%] bg-gradient-to-t from-black/68 via-black/22 to-transparent" />
      <div className="absolute bottom-2 left-4 right-28 z-[4] text-white">
        <p className="line-clamp-2 break-all text-[1.62rem] font-semibold leading-tight text-white/95 sm:text-[1.84rem]">
          {pbnDomainLabel.primary}
        </p>
        {pbnDomainLabel.secondary ? (
          <p className="line-clamp-1 break-all text-[1.02rem] font-medium text-white/84 sm:text-[1.14rem]">
            {pbnDomainLabel.secondary}
          </p>
        ) : null}
      </div>
    </>
  );
}

interface ParkDefaultArtworkContentProps {
  domainName: string;
  primaryImage: string | null;
}

function ParkDefaultArtworkContent({
  domainName,
  primaryImage,
}: ParkDefaultArtworkContentProps) {
  return (
    <>
      {primaryImage ? (
        <div className="absolute inset-0 overflow-hidden">
          {/* biome-ignore lint/performance/noImgElement: remote artwork URLs are served outside Next.js image optimization */}
          <img
            src={primaryImage}
            alt={`Artwork for ${domainName}`}
            loading="lazy"
            className="block h-full w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-black p-6 text-center">
          <p className="max-w-[84%] break-all text-[1.32rem] font-semibold tracking-[0.02em] text-brand-primary/90 sm:text-[1.58rem]">
            {domainName}
          </p>
        </div>
      )}
      <div className="absolute left-4 top-4 z-10 inline-flex items-center rounded-[0.38rem] bg-black/52 px-1.5 py-1 backdrop-blur-sm">
        <Image
          src="/logotype.svg"
          alt="Namefi logo"
          width={68}
          height={22}
          className="h-4 w-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]"
        />
      </div>
    </>
  );
}

interface ParkOwnerBlockProps {
  ownerAddress?: string | null;
  ownerDisplay: string;
  ownerLink: string | null;
  domainsCountByOwner: number;
}

function ParkOwnerBlock({
  ownerAddress,
  ownerDisplay,
  ownerLink,
  domainsCountByOwner,
}: ParkOwnerBlockProps) {
  const walletAvatarSrc = getEnsDataAvatarUrl(ownerAddress);

  return (
    <div className="flex items-center gap-3 rounded-[1.15rem] border border-white/[0.05] bg-white/[0.035] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="relative size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/25">
        <ParkWalletAvatarImage
          src={walletAvatarSrc}
          className="h-full w-full object-cover"
          fallbackClassName="absolute inset-0"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
          Wallet
        </p>
        {ownerLink ? (
          <Link
            href={ownerLink}
            target="_blank"
            rel="noreferrer noopener"
            title={ownerAddress ?? ownerDisplay}
            className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-foreground transition hover:text-primary"
          >
            <span className="truncate">{ownerDisplay}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </Link>
        ) : (
          <span
            className="block truncate text-sm font-medium text-foreground"
            title={ownerDisplay}
          >
            {ownerDisplay}
          </span>
        )}
        {ownerLink ? (
          <Link
            href={ownerLink}
            target="_blank"
            rel="noreferrer noopener"
            className="block text-xs text-muted-foreground transition hover:text-primary"
          >
            Domains owned by this wallet
          </Link>
        ) : (
          <span className="block text-xs text-muted-foreground">
            Wallet owner profile unavailable
          </span>
        )}
      </div>
      <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.72rem] font-medium text-muted-foreground">
        {domainsCountByOwner.toLocaleString()}{' '}
        {domainsCountByOwner === 1 ? 'domain' : 'domains'}
      </span>
    </div>
  );
}

interface ParkArtworkPreviewProps {
  primaryImage: string | null;
  domainName: string;
  chainName?: DomainDocument['chainName'];
  expiration?: string | null;
  pbnApex?: string | null;
  chainExplorerUrl?: string | null;
}

function ParkArtworkPreview({
  primaryImage,
  domainName,
  chainName,
  expiration,
  pbnApex,
  chainExplorerUrl,
}: ParkArtworkPreviewProps) {
  const chainBadge = getChainBadge(chainName);
  const expiry = formatExpiry(expiration);
  const expiryBadgeClassName =
    'absolute bottom-4 right-4 z-[4] inline-flex items-center gap-1.5 rounded-[0.9rem] bg-black/72 px-2 py-1.5 ring-1 ring-white/20 backdrop-blur';
  const expiryBadgeContent = (
    <>
      {chainBadge ? (
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-black/65 ring-1 ring-white/20">
          <Image
            src={chainBadge.icon}
            alt=""
            aria-hidden={true}
            width={16}
            height={16}
            className="size-4"
          />
        </span>
      ) : null}
      <div className="leading-tight">
        <p className="text-[0.52rem] uppercase tracking-[0.12em] text-white/64">
          Expires on
        </p>
        <p className="text-[0.72rem] font-medium text-white/92">{expiry}</p>
      </div>
    </>
  );

  return (
    <div className="park-nft-asset-shell rounded-[1.3rem] p-[1px]">
      <div className="relative aspect-square w-full overflow-hidden rounded-[calc(1.3rem-1px)] bg-black">
        {pbnApex ? (
          <ParkPbnArtworkContent domainName={domainName} pbnApex={pbnApex} />
        ) : (
          <ParkDefaultArtworkContent
            domainName={domainName}
            primaryImage={primaryImage}
          />
        )}
        {expiry ? (
          chainExplorerUrl ? (
            <Link
              href={chainExplorerUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={cn(
                expiryBadgeClassName,
                'transition hover:bg-black/82 hover:ring-white/32',
              )}
              aria-label={
                chainBadge
                  ? `Open ${chainBadge.label} explorer`
                  : 'Open block explorer'
              }
              title={
                chainBadge ? `Open ${chainBadge.label} explorer` : undefined
              }
            >
              {expiryBadgeContent}
            </Link>
          ) : (
            <div className={expiryBadgeClassName}>{expiryBadgeContent}</div>
          )
        ) : null}
      </div>
    </div>
  );
}

export interface ParkNftCardProps {
  domain: DomainDocument;
  domainsCountByOwner: number;
  ownerUrl: string | null;
  aiPreviewUrl?: string;
  host?: string;
  pbnApex?: string | null;
  chainExplorerUrl?: string | null;
}

export function ParkNftCard({
  domain,
  domainsCountByOwner,
  ownerUrl,
  aiPreviewUrl,
  host,
  pbnApex,
  chainExplorerUrl,
}: ParkNftCardProps) {
  const owner = domain.currentOwner ?? null;
  const ownerDisplay = formatOwner(owner);
  const ownerLink = ownerUrl;
  const followLink = owner ? `https://ethfollow.xyz/${owner}` : null;

  const domainName =
    domain.unicode ?? domain.ldh ?? domain._id ?? host ?? 'this domain';
  const shareBase = domain.ldh ?? host ?? domain.unicode ?? 'namefi.io';
  const shareTarget = shareBase.startsWith('http')
    ? shareBase
    : `https://${shareBase.replace(LEADING_SLASHES_PATTERN, '')}`;

  const primaryImage = aiPreviewUrl ?? null;
  const cardShellStyle = pbnApex
    ? {
        boxShadow:
          '0px 34px 78px -58px color-mix(in srgb, var(--brand-primary) 62%, rgba(0,0,0,0.5)), 0px 0px 48px -38px color-mix(in srgb, var(--brand-secondary) 58%, transparent)',
      }
    : undefined;

  return (
    <div
      className={cn(
        'group relative mx-auto w-full max-w-[27.5rem] overflow-hidden rounded-[1.625rem] border',
        pbnApex
          ? 'border-brand-primary/40 bg-background/74'
          : 'border-border/55 bg-background/70 shadow-[0px_34px_78px_-58px_rgba(0,0,0,0.88)]',
      )}
      style={cardShellStyle}
    >
      <Card className="relative w-full gap-0 overflow-hidden !rounded-[1.55rem] border-0 bg-background/86 p-0 shadow-none">
        <div className="pointer-events-none absolute inset-x-4 top-4 h-44 rounded-full bg-gradient-to-b from-brand-primary/18 via-transparent to-transparent blur-3xl" />
        <CardHeader className="relative rounded-none px-4 pb-0 pt-4 sm:px-5 sm:pt-5">
          <ParkOwnerBlock
            ownerAddress={owner}
            ownerDisplay={ownerDisplay}
            ownerLink={ownerLink}
            domainsCountByOwner={domainsCountByOwner}
          />
        </CardHeader>
        <CardContent className="relative space-y-5 px-4 pb-4 pt-5 sm:px-5 sm:pb-5">
          <ParkArtworkPreview
            primaryImage={primaryImage}
            domainName={domainName}
            chainName={domain.chainName}
            expiration={domain.expiration}
            pbnApex={pbnApex}
            chainExplorerUrl={chainExplorerUrl}
          />

          <div
            className={cn(
              'grid gap-2.5 pt-1',
              followLink ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1',
            )}
          >
            {followLink ? (
              <Button
                render={
                  <Link
                    href={followLink}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="min-w-0"
                  />
                }
                nativeButton={false}
                variant="outline"
                className={ACTION_BUTTON_CLASS}
              >
                <Image
                  src="/assets/logos/efp-logo.svg"
                  alt=""
                  aria-hidden={true}
                  width={16}
                  height={16}
                  className="size-4 rounded-[2px]"
                />
                Follow on ethfollow
              </Button>
            ) : null}
            <ParkShareMenu
              domainName={domainName}
              shareTarget={shareTarget}
              fullWidth={true}
              className="h-11"
              buttonClassName={ACTION_BUTTON_CLASS}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
