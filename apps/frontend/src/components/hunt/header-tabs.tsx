'use client';

import { config } from '@/lib/env';
import { cn } from '@/lib/cn';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './header-tabs.module.css';

const TabItem = ({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      className={cn(
        'py-2 px-3 sm:py-3 sm:px-4 text-sm sm:text-lg whitespace-nowrap',
        active
          ? 'text-brand-primary font-medium border-b-2 border-brand-primary'
          : 'text-white/50 hover:text-white/70 cursor-pointer',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const CampaignTab = ({
  campaignKey,
  active,
}: {
  campaignKey: string;
  active: boolean;
}) => {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: campaignData } = useQuery({
    ...trpc.hunt.getCampaignPublic.queryOptions({
      campaignKey,
      offset: 0,
      limit: 1,
    }),
    select: (data) => data.campaign,
  });

  const name = campaignData?.name || '-';

  const handleClick = useCallback(() => {
    router.push(`/hunt/campaigns/${campaignKey}`);
  }, [campaignKey, router]);

  return (
    <TabItem key={campaignKey} onClick={handleClick} active={active}>
      {name}
    </TabItem>
  );
};

interface HeaderTabsProps {
  activeTab: string;
  className?: string;
}

export const HeaderTabs = ({ activeTab, className }: HeaderTabsProps) => {
  const router = useRouter();
  const handleClickAllHunt = useCallback(() => {
    router.push('/hunt');
  }, [router]);

  return (
    <div className={cn('w-full border-b border-white/10', className)}>
      <div
        className={cn(
          'flex items-center overflow-x-auto',
          styles.scrollbarHide,
        )}
      >
        <div className="flex items-center gap-2 sm:gap-4 min-w-full px-4 sm:px-0 sm:justify-center">
          <TabItem onClick={handleClickAllHunt} active={activeTab === 'all'}>
            All hunt
          </TabItem>
          {config.HUNT_CAMPAIGN_KEYS.map((campaignKey) => (
            <CampaignTab
              key={campaignKey}
              campaignKey={campaignKey}
              active={activeTab === campaignKey}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
