'use client';

import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, AlertCircle } from 'lucide-react';

interface GenerationUsageProps {
  className?: string;
}

export function GenerationUsage({ className = '' }: GenerationUsageProps) {
  const trpc = useTRPC();
  const { data: usage, isLoading } = useQuery({
    ...trpc.ai.getUserGenerationUsage.queryOptions(),
  });

  if (isLoading) {
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

  if (!usage) return null;

  const { currentCredits, maxCredits, remainingCredits, hasReachedLimit } =
    usage;

  return (
    <Card className={className}>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">AI credits</span>
            <span className="text-xs text-muted-foreground">
              {currentCredits} of {maxCredits} used this month
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasReachedLimit ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Credit limit reached
              </Badge>
            ) : (
              <Badge variant="secondary">
                {remainingCredits}{' '}
                {remainingCredits === 1 ? 'credit' : 'credits'} left
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
