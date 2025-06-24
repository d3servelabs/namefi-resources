'use client';

import { AuthGuard } from '@/components/AuthRequiredDialog';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { useAuth } from '@/hooks/useAuth';
import { useTRPC } from '@/utils/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  TagIcon,
  TrendingUpIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { DomainItemSkeleton } from '../../../components/DomainItemSkeleton';
import { TagsDisplay } from '../../../components/TagsDisplay';
import { usePendingToast } from '../../../components/usePendingToast';

interface DomainDetailProps {
  domainName: string;
}

export const DomainDetail = ({ domainName }: DomainDetailProps) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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

  const upvoteMutation = useMutation(
    trpc.hunt.upvote.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast.success('Thanks for your vote!');
      },
      onError: () => {
        toast.error('Failed to vote. Please try again.');
      },
    }),
  );

  const unvoteMutation = useMutation(
    trpc.hunt.unvote.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast.success('Vote cancelled.');
      },
      onError: () => {
        toast.error('Failed to cancel vote. Please try again.');
      },
    }),
  );

  const handleVoteToggle = useCallback(() => {
    if (domainData?.userHasUpvoted) {
      unvoteMutation.mutate({ domainName });
    } else {
      upvoteMutation.mutate({ domainName });
    }
  }, [domainData?.userHasUpvoted, domainName, upvoteMutation, unvoteMutation]);

  const isVoting = useMemo(
    () => upvoteMutation.isPending || unvoteMutation.isPending,
    [upvoteMutation.isPending, unvoteMutation.isPending],
  );

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

  usePendingToast(upvoteMutation.isPending, 'Voting...');
  usePendingToast(unvoteMutation.isPending, 'Cancelling vote...');
  usePendingToast(deleteDomainMutation.isPending, 'Deleting domain...');

  if (domainLoading || authLoading) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <DomainItemSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-8">
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
                <AuthGuard
                  title="Sign in to vote"
                  description="You need to sign in to vote for domains. Join the community to discover and vote for the best domains!"
                >
                  <Button
                    onClick={handleVoteToggle}
                    disabled={isVoting}
                    variant={domainData?.userHasUpvoted ? 'default' : 'outline'}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <TrendingUpIcon className="h-4 w-4" />
                    {isAuthenticated
                      ? domainData?.userHasUpvoted
                        ? 'Voted'
                        : 'Vote'
                      : 'Sign in to vote'}
                    {domainData?.upvoteCount !== undefined && (
                      <Badge variant="secondary">
                        {domainData.upvoteCount}
                      </Badge>
                    )}
                  </Button>
                </AuthGuard>
              </div>
            </div>
          </CardHeader>
        </Card>

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
    </div>
  );
};
