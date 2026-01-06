'use client';

import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  TagIcon,
  TrendingUpIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { DomainItemSkeleton } from '../domain-item-skeleton';
import { TagsDisplay } from '../tags-display';
import { DomainAwards } from '../domain-awards';
import { usePendingToast } from '../../../hooks/use-pending-toast';
import {
  type HuntVoteRowOptions,
  useHuntVoteRow,
} from '@/hooks/use-hunt-vote-row';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { PageShell } from '@/components/page-shell';

interface DomainDetailProps extends Omit<HuntVoteRowOptions, 'domain'> {
  domainName: NamefiNormalizedDomain;
}

export const DomainDetail = ({
  domainName,
  shareConfig,
}: DomainDetailProps) => {
  const router = useRouter();
  const trpc = useTRPC();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toggleVote, isVotePending } = useHuntVoteRow({
    domain: domainName,
    shareConfig,
  });

  const authQuery = useQuery({
    ...trpc.hunt.getDomainDetail.queryOptions({
      domainName,
    }),
    enabled: isAuthenticated,
  });

  const publicQuery = useQuery({
    ...trpc.hunt.getDomainDetailPublic.queryOptions({
      domainName,
    }),
    enabled: !isAuthenticated,
  });

  const domainData = isAuthenticated ? authQuery.data : publicQuery.data;
  const domainLoading = isAuthenticated
    ? authQuery.isLoading
    : publicQuery.isLoading;

  const handleVoteToggle = useCallback(() => {
    toggleVote(domainData?.userHasUpvoted || false);
  }, [domainData?.userHasUpvoted, toggleVote]);

  const deleteDomainMutation = useMutation(
    trpc.hunt.removeDomain.mutationOptions({
      onSuccess: () => {
        toast.success('Domain deleted successfully');
        router.push('/hunt');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete domain');
      },
    }),
  );

  usePendingToast(isVotePending, 'Processing vote...');
  usePendingToast(deleteDomainMutation.isPending, 'Deleting domain...');

  if (domainLoading || authLoading) {
    return (
      <PageShell padding="compact">
        <div className="max-w-4xl mx-auto">
          <DomainItemSkeleton />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell padding="compact">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Domain Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold mb-3">
                  {domainName}
                </CardTitle>
                {domainData?.tags && domainData.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <TagIcon className="h-4 w-4 text-muted-foreground" />
                    <TagsDisplay
                      tags={domainData.tags}
                      limit={8}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleVoteToggle}
                  disabled={isVotePending}
                  variant={domainData?.userHasUpvoted ? 'default' : 'outline'}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <TrendingUpIcon className="h-4 w-4" />
                  {domainData?.userHasUpvoted ? 'Voted' : 'Vote'}
                  {domainData?.upvoteCount !== undefined && (
                    <Badge variant="secondary">{domainData.upvoteCount}</Badge>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Awards */}
        <div className="mb-8">
          <DomainAwards domainName={domainName} />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <Button variant="outline" asChild={true}>
                <Link
                  href={`https://${domainName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  Visit Domain
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
};
