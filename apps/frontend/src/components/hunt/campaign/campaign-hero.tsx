'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { CampaignCountdown } from './campaign-countdown';
import Image from 'next/image';
import { DefaultHeroBackground } from './hero-background/default-hero-background';
import { AwardedHeroBackground } from './hero-background/awarded-hero-background';
import { NFTDomain } from '@/components/nft-domain';

interface CampaignHeroProps {
  campaignKey: string;
}

export const CampaignHero = ({ campaignKey }: CampaignHeroProps) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  const { data } = useQuery({
    ...(isAuthenticated
      ? trpc.hunt.getCampaign.queryOptions({
          campaignKey,
          offset: 0,
          limit: 1,
        })
      : trpc.hunt.getCampaignPublic.queryOptions({
          campaignKey,
          offset: 0,
          limit: 1,
        })),
    enabled: !isAuthLoading,
  });

  const campaign = data?.campaign;
  const rankings = data?.rankings;
  const isActive = campaign?.status === 'ACTIVE';
  const isAwarded = campaign?.status === 'AWARDED';
  const winnerDomainName = rankings?.[0]?.domainName;

  return (
    <section className="flex flex-col items-center justify-center gap-8 py-20 relative min-h-[600px]">
      {campaign ? (
        isAwarded ? (
          <AwardedHeroBackground />
        ) : (
          <DefaultHeroBackground />
        )
      ) : null}

      <div className="flex flex-col items-center justify-center gap-10 relative z-10">
        {isAwarded && (
          <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2">
            Congratulations!
          </h1>
        )}

        {isAwarded && winnerDomainName ? (
          <div className="flex justify-center mt-8">
            <div className="w-40">
              <NFTDomain
                domainName={winnerDomainName}
                origin={winnerDomainName ?? ''}
                className="backdrop-blur-lg"
              />
            </div>
          </div>
        ) : campaign?.logoUrl ? (
          <Image
            src={campaign?.logoUrl}
            alt="Campaign Icon"
            width={160}
            height={160}
            className="w-40 h-40"
          />
        ) : (
          <div />
        )}

        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2">
            {isAwarded ? (
              <>
                <span className="text-blue-500">
                  {rankings?.[0]?.domainName}
                </span>{' '}
                is the winner
              </>
            ) : (
              campaign?.title
            )}
          </h1>
          <p className="text-lg sm:text-xl text-white/50">
            {campaign
              ? isActive
                ? campaign?.description
                : 'Thank you for voting - winners will receive an email with subdomain claim details.'
              : null}
          </p>
        </div>

        {isActive && (
          <div className="mb-12">
            <CampaignCountdown endDate={campaign?.endDate} />
          </div>
        )}
      </div>
    </section>
  );
};
