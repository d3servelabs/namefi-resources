'use client';

import { useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/shadcn/button';
import { useFreeMintsGuidance } from '@/components/providers/free-mints-guidance';
import { CometCard } from '@/components/ui/aceternity/comet-card';
import type { FreeMint } from '@/hooks/use-free-mints';
import { useRouter } from 'next/navigation';
import { originConfig } from '@/lib/origin/config';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';

export interface FreeMintCardProps {
  data: FreeMint;
}

export function FreeMintCard({ data }: FreeMintCardProps) {
  const { type, domain, expirationDate, createdAt } = data;
  const { startCampaignSearch } = useFreeMintsGuidance();
  const router = useRouter();

  const apex = useMemo(() => {
    if (type === 'single') {
      const result = parseDomainName(domain);
      return result.valid ? result.publicSuffixPlusOne : 'astra';
    }
    return domain;
  }, [type, domain]);

  const theme = useMemo(() => {
    return originConfig.thirdParty[apex] ? apex : 'astra';
  }, [apex]);

  const pbnLogo = useMemo(() => {
    return (
      originConfig.thirdParty[apex]?.pbnLogo?.monoImage ?? '/logotype-mono.svg'
    );
  }, [apex]);

  const handleClaim = useCallback(() => {
    if (type === 'single') {
      router.push(`/claim/${encodeURIComponent(domain)}`);
    } else if (type === 'campaign') {
      startCampaignSearch(domain);
    }
  }, [type, domain, startCampaignSearch, router]);

  // Typography relief
  const raised: React.CSSProperties = {
    textShadow:
      '0 1px 0 rgba(0,0,0,.55), 0 2px 3px rgba(0,0,0,.35), -0.6px -0.6px 0 rgba(255,255,255,.22)',
  };
  const deboss: React.CSSProperties = {
    textShadow: '0 -1px 0 rgba(255,255,255,.18), 0 1px 0 rgba(0,0,0,.35)',
  };

  return (
    <div data-theme={theme} className="flex flex-col items-center">
      <CometCard rotateDepth={8} translateDepth={16} className="w-full">
        <div className="relative aspect-[85.6/53.98] overflow-hidden rounded-2xl">
          {/* Dark metallic base */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, var(--brand-primary), var(--brand-primary) 45%, var(--brand-primary) 100%)',
            }}
            aria-hidden
          />
          {/* Subtle brushed texture */}
          <div
            className="absolute inset-0 opacity-[.08] mix-blend-overlay pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(90deg, rgba(255,255,255,.5) 0, rgba(255,255,255,.5) 1px, transparent 1px, transparent 3px)',
            }}
            aria-hidden
          />
          {/* Tint + vignette + noise */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(120% 80% at 50% 0%, rgba(190,130,250,.12), transparent 55%), radial-gradient(120% 90% at 50% 100%, rgba(0,0,0,.55), rgba(0,0,0,.25) 60%, transparent 80%)',
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: 'url(/noise.webp)',
              backgroundSize: '12%',
            }}
            aria-hidden
          />
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_80px_rgba(0,0,0,.45)] pointer-events-none" />

          {/* Content grid with consistent gutters */}
          <div className="relative h-full grid grid-rows-[auto,1fr,auto] p-3.5 lg:p-6 text-white">
            {/* Header: white logo as mask with backdrop blur, flush to same right inset as CTA */}
            <div
              className="justify-self-end w-[110px] backdrop-blur-3xl bg-white/70"
              style={{
                maskImage: `url(${pbnLogo})`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: `url(${pbnLogo})`,
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
              }}
              role="img"
              aria-label="Powered by Namefi"
            />

            <div className="space-y-3 sm:space-y-2 lg:space-y-6 self-end">
              <div
                className="font-mono uppercase leading-none text-[19px] md:text-[21px] text-wrap"
                style={raised}
              >
                {type === 'campaign' ? `Any ${domain} subdomain` : domain}
              </div>
              <div className="flex justify-start gap-x-4">
                <div className="min-w-[92px]">
                  <div
                    className="text-[10px] uppercase tracking-[.28em] text-white/70"
                    style={deboss}
                  >
                    Issued
                  </div>
                  <time
                    className="font-mono text-sm tracking-widest"
                    style={raised}
                  >
                    {format(new Date(createdAt), 'MM/yy')}
                  </time>
                </div>
                <div className="min-w-[92px]">
                  <div
                    className="text-[10px] uppercase tracking-[.28em] text-white/70"
                    style={deboss}
                  >
                    Valid Thru
                  </div>
                  <time
                    className="font-mono text-sm tracking-widest"
                    style={raised}
                  >
                    {expirationDate
                      ? format(new Date(expirationDate), 'MM/yy')
                      : '∞'}
                  </time>
                </div>
              </div>

              <Button
                onClick={handleClaim}
                className="w-full h-11 rounded-xl font-medium
                           text-brand-primary
                           font-mono
                           uppercase
                           tracking-[0.28em]
                           bg-background/60 hover:bg-background/80
                           backdrop-blur-3xl
                           transition-[transform,background] duration-150
                           hover:scale-[1.005] active:scale-[0.995]"
              >
                Claim Now
              </Button>
            </div>
          </div>
        </div>
      </CometCard>
    </div>
  );
}
