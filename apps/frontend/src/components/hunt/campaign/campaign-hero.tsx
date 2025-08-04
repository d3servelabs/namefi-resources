'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { CampaignCountdown } from './campaign-countdown';
import Image from 'next/image';

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
  const isActive = campaign?.status === 'ACTIVE';

  return (
    <section className="flex flex-col items-center justify-center gap-8 py-20 relative">
      <div className="absolute inset-0">
        <Image
          src="/assets/hunt/hero-bg-1.png"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="flex flex-col items-center justify-center gap-10 relative z-10">
        {campaign?.logoUrl ? (
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
            {campaign?.title}
          </h1>
          <p className="text-lg sm:text-xl text-white/50">
            {campaign?.description}
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
