import Link from 'next/link';
import { ExternalLink, ImageIcon, Share2 } from 'lucide-react';

import type { DomainDocument } from '@/lib/metadata';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardHeader } from '@/components/ui/shadcn/card';
import { cn } from '@/lib/cn';

function formatOwner(address?: string | null): string {
  if (!address) return 'Unassigned';
  if (address.startsWith('0x') && address.length > 12) {
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }
  return address;
}

export interface ParkNftCardProps {
  domain: DomainDocument;
  domainsCountByOwner: number;
  manageUrl: string | null;
  aiPreviewUrl?: string;
  nftSvgUrl?: string | null;
  host?: string;
}

export function ParkNftCard({
  domain,
  domainsCountByOwner,
  manageUrl,
  aiPreviewUrl,
  nftSvgUrl,
  host,
}: ParkNftCardProps) {
  const owner = domain.currentOwner ?? null;
  const ownerDisplay = formatOwner(owner);
  const ownerLink = owner ? `https://app.namefi.io/owner/${owner}` : null;
  const followLink = owner ? `https://ethfollow.xyz/${owner}` : null;

  const domainName =
    domain.unicode ?? domain.ldh ?? domain._id ?? host ?? 'this domain';
  const shareBase = domain.ldh ?? host ?? domain.unicode ?? 'namefi.io';
  const shareTarget = shareBase.startsWith('http')
    ? shareBase
    : `https://${shareBase.replace(/^\/+/, '')}`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Check out ${domainName} parked with @namefi_io`,
  )}&url=${encodeURIComponent(shareTarget)}`;

  const primaryImage = nftSvgUrl ?? aiPreviewUrl ?? null;
  const awaitingCopy = nftSvgUrl
    ? 'Unable to load collectible artwork. Please try again later.'
    : 'Artwork will appear as soon as Namefi AI renders it.';

  return (
    <Card className="group relative w-full overflow-hidden border-border/60 bg-background/80 shadow-[0px_30px_80px_-40px_rgba(0,0,0,0.55)]">
      <div className="pointer-events-none absolute inset-x-4 top-4 h-48 rounded-full bg-gradient-to-b from-brand-primary/35 via-transparent to-transparent blur-3xl transition duration-500 group-hover:opacity-80" />
      <CardHeader className="relative space-y-6 pb-2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
          <div className="space-y-1">
            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
              Owner
            </p>
            {ownerLink ? (
              <Link
                href={ownerLink}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm font-semibold text-foreground transition hover:text-primary"
              >
                {ownerDisplay}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-foreground">
                {ownerDisplay}
              </span>
            )}
          </div>
          <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            {domainsCountByOwner.toLocaleString()}{' '}
            {domainsCountByOwner === 1 ? 'domain' : 'domains'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-6">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-background/60 via-background/40 to-background/80">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt="Namefi collectible artwork"
              loading="lazy"
              className="h-56 w-full bg-background object-contain transition duration-500 group-hover:scale-[1.01]"
            />
          ) : (
            <div className="flex h-56 w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-primary/25 via-brand-tertiary/20 to-transparent text-center text-brand-primary">
              <ImageIcon className="h-6 w-6" />
              <span className="text-sm font-semibold uppercase tracking-[0.16em]">
                Artwork pending
              </span>
              <span className="max-w-[240px] text-xs text-muted-foreground">
                {awaitingCopy}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {manageUrl ? (
            <Button
              asChild
              className="group/button flex-1 justify-center rounded-full bg-primary text-primary-foreground shadow-none transition hover:bg-primary/90"
            >
              <Link href={manageUrl} target="_blank" rel="noreferrer noopener">
                Manage domain
                <ExternalLink className="ml-2 h-4 w-4 transition group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
          ) : null}
          {followLink ? (
            <Button
              asChild
              variant="outline"
              className="rounded-full border-border/60 bg-background/70 text-sm text-foreground shadow-none transition hover:border-brand-primary/60 hover:bg-background"
            >
              <Link href={followLink} target="_blank" rel="noreferrer noopener">
                Follow on ethfollow
              </Link>
            </Button>
          ) : null}
          <Button
            asChild
            variant="ghost"
            className={cn(
              'rounded-full border border-transparent bg-background/60 text-muted-foreground shadow-none transition hover:border-border/60 hover:text-foreground',
              manageUrl || followLink
                ? 'md:flex-1 md:justify-center'
                : 'w-full',
            )}
          >
            <Link href={shareUrl} target="_blank" rel="noreferrer noopener">
              Share
              <Share2 className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
