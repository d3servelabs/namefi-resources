'use client';

import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Info, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  getGenerationUsageViewState,
  shouldFetchGenerationUsage,
} from './generation-usage-state';

interface GenerationUsageProps {
  className?: string;
}

export function GenerationUsage({ className = '' }: GenerationUsageProps) {
  const trpc = useTRPC();
  const t = useTranslations('aiGeneration');
  const { isAuthenticated } = useAuth();
  const { data: usage, isLoading } = useQuery({
    ...trpc.ai.getUserGenerationUsage.queryOptions(),
    enabled: shouldFetchGenerationUsage(isAuthenticated),
  });
  const viewState = getGenerationUsageViewState({
    isAuthenticated,
    isLoading,
    usage,
  });

  if (viewState.kind === 'hidden') return null;
  if (viewState.kind === 'loading') {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    creditsRefreshAt,
    currentCredits,
    maxCredits,
    remainingCredits,
    hasReachedLimit,
  } = viewState.usage;

  return (
    <Card className={className}>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('usage.credits')}</span>
            <span className="text-xs text-muted-foreground">
              {t('usage.usedThisMonth', {
                current: currentCredits,
                max: maxCredits,
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasReachedLimit ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {t('usage.limitReached')}
              </Badge>
            ) : (
              <Badge variant="secondary">
                {t('usage.creditsLeft', { count: remainingCredits })}
              </Badge>
            )}
            <CreditsRefreshTooltip creditsRefreshAt={creditsRefreshAt} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function useLocalCreditsRefreshText(date: Date) {
  const [refreshText, setRefreshText] = useState<string | null>(null);
  const refreshTimestamp = date.getTime();

  useEffect(() => {
    setRefreshText(format(new Date(refreshTimestamp), 'MMM d, h:mm a'));
  }, [refreshTimestamp]);

  return refreshText;
}

function CreditsRefreshTooltip({
  creditsRefreshAt,
}: {
  creditsRefreshAt: Date;
}) {
  const t = useTranslations('aiGeneration');
  const creditsRefreshText = useLocalCreditsRefreshText(creditsRefreshAt);

  return (
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <button
            {...props}
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={t('usage.refreshAria')}
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      />
      <TooltipContent sideOffset={6}>
        {creditsRefreshText
          ? t('usage.refreshAt', { time: creditsRefreshText })
          : t('usage.refreshMonthly')}
      </TooltipContent>
    </Tooltip>
  );
}
