'use client';

import { AwardIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { Medal } from './award-medals';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';

interface DomainAwardsProps {
  domainName: NamefiNormalizedDomain;
}

const DomainAwardsCard = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations('hunt');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AwardIcon className="h-5 w-5" />
          {t('awards.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export const DomainAwards = ({ domainName }: DomainAwardsProps) => {
  const t = useTranslations('hunt');
  const trpc = useTRPC();

  const awardsQuery = useQuery({
    ...trpc.hunt.getDomainAwards.queryOptions({
      domainName,
    }),
  });

  if (awardsQuery.isLoading) {
    return (
      <DomainAwardsCard>
        <div className="animate-pulse">
          <div className="h-16 w-16 bg-gray-400 rounded-full" />
        </div>
      </DomainAwardsCard>
    );
  }

  if (awardsQuery.isError) {
    return (
      <DomainAwardsCard>
        <p className="text-muted-foreground">{t('awards.loadError')}</p>
      </DomainAwardsCard>
    );
  }

  const awards = awardsQuery.data || [];

  if (awards.length === 0) {
    return (
      <DomainAwardsCard>
        <p className="text-muted-foreground">{t('awards.empty')}</p>
      </DomainAwardsCard>
    );
  }

  return (
    <DomainAwardsCard>
      <div className="flex flex-wrap justify-start items-start gap-2">
        {awards.map((award) => (
          <Tooltip key={award.id}>
            <TooltipTrigger>
              <div className="relative flex items-center justify-center w-16 h-16">
                {award.rank === 1 && (
                  <Medal
                    type="gold"
                    className="absolute inset-0 w-full h-full"
                  />
                )}
                {award.rank === 2 && (
                  <Medal
                    type="silver"
                    className="absolute inset-0 w-full h-full"
                  />
                )}
                {award.rank === 3 && (
                  <Medal
                    type="bronze"
                    className="absolute inset-0 w-full h-full"
                  />
                )}
                {award.rank > 3 && (
                  <Medal
                    type="participation"
                    className="absolute inset-0 w-full h-full"
                  />
                )}
                <span className="relative z-10 text-xl font-bold text-white drop-shadow-lg">
                  #{award.rank}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{award.reason}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </DomainAwardsCard>
  );
};
