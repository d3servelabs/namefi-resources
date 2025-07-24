'use client';

import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
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

  const {
    currentCount,
    maxGenerations,
    remainingGenerations,
    hasReachedLimit,
  } = usage;

  return (
    <Card className={className}>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">AI Generations</span>
            <span className="text-xs text-muted-foreground">
              {currentCount} of {maxGenerations} used this month
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasReachedLimit ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Limit Reached
              </Badge>
            ) : (
              <Badge variant="secondary">{remainingGenerations} left</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
