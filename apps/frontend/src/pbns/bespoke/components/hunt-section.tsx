'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { DomainsList } from '@/components/hunt/domains-list';
import { CampaignDomainsList } from '@/components/hunt/campaign-domains-list';
import { useHuntVote } from '@/hooks/use-hunt-vote';
import { Trophy, Target, TrendingUp, Plus } from 'lucide-react';
import { HUNT_CAMPAIGN_KEYS } from '@/lib/hunt-campaign-keys';
import dynamic from 'next/dynamic';

const TRENDING_LIMIT = 5;

const AuthRequiredDialog = dynamic(
  () =>
    import('@/components/dialogs/auth-required-dialog').then(
      (module) => module.AuthRequiredDialog,
    ),
  { ssr: false },
);

const SubmitDomainDialog = dynamic(
  () =>
    import('@/components/hunt/submit-domain-dialog').then(
      (module) => module.SubmitDomainDialog,
    ),
  { ssr: false },
);

const TwitterShareDialog = dynamic(
  () =>
    import('@/components/hunt/twitter-share-dialog').then(
      (module) => module.TwitterShareDialog,
    ),
  { ssr: false },
);

const VoteOrShareChoiceDialog = dynamic(
  () =>
    import('@/components/dialogs/vote-or-share-choice-dialog').then(
      (module) => module.VoteOrShareChoiceDialog,
    ),
  { ssr: false },
);

interface BespokeHuntSectionProps {
  /** The domain extension (e.g., "today", "now") for generating domain-specific content */
  domainExtension: string;
  /** The full domain name (e.g., "available.today") */
  domainName: string;
}

export const BespokeHuntSection = ({
  domainExtension,
  domainName: _domainName,
}: BespokeHuntSectionProps) => {
  const [campaignPage, setCampaignPage] = useState(1);
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const trpc = useTRPC();

  const vote = useHuntVote({
    shareConfig: {
      enabled: true,
      trackShares: true,
      campaignKeyResolver: () => HUNT_CAMPAIGN_KEYS.CTA,
    },
  });

  const handleCampaignPageChange = useCallback((newPage: number) => {
    setCampaignPage(newPage);
  }, []);

  // Fetch trending domains for this extension
  const {
    data: trendingData,
    isLoading: isTrendingLoading,
    isError: isTrendingError,
  } = useQuery({
    ...(isAuthenticated
      ? trpc.hunt.getTrendingDomains.queryOptions({
          limit: TRENDING_LIMIT,
          timeRange: 'ANYTIME',
          extension: domainExtension,
          excludeCampaignKey: HUNT_CAMPAIGN_KEYS.CTA,
        })
      : trpc.hunt.getTrendingDomainsPublic.queryOptions({
          limit: TRENDING_LIMIT,
          timeRange: 'ANYTIME',
          extension: domainExtension,
          excludeCampaignKey: HUNT_CAMPAIGN_KEYS.CTA,
        })),
    enabled: !isAuthLoading,
  });

  return (
    <section id="bespoke-hunt" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-center tracking-tight">
            Join the{' '}
            <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
              .{domainExtension} Namefi Hunt™
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-300 mb-16 text-center max-w-3xl mx-auto font-medium">
            Vote for .{domainExtension} domains you'd love to own a subdomain
            under. When domains you support win or rank high, you could get a
            chance to{' '}
            <span className="text-cyan-400 font-semibold">
              claim your free subdomain
            </span>{' '}
            or get priority access to purchase one.
          </p>

          {/* Two-column layout for larger screens */}
          <div className="mt-16">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-12">
              {/* Bespoke Campaign Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white text-start">
                      Official .{domainExtension} Campaign
                    </h3>
                    <p className="text-slate-400">
                      Current leaderboard of featured domains
                    </p>
                  </div>
                </div>
                <CampaignDomainsList
                  campaignKey={HUNT_CAMPAIGN_KEYS.CTA}
                  page={campaignPage}
                  limit={5}
                  onPageChange={handleCampaignPageChange}
                  showTitle={false}
                  skeletonCount={5}
                  upvote={vote.upvote}
                  unvote={vote.unvote}
                  isVotePending={vote.isVotePending}
                />
              </div>

              {/* Trending Domains Section */}
              <div
                className="space-y-6"
                id={`trending-${domainExtension}-domains`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white text-start">
                      Trending .{domainExtension} Domains
                    </h3>
                    <p className="text-slate-400 text-start">
                      All-time community favorites
                    </p>
                  </div>
                </div>

                <div className="border border-border shadow-sm rounded-xl bg-white/[0.03]">
                  <DomainsList
                    domains={trendingData?.items ?? []}
                    isLoading={isTrendingLoading || isAuthLoading}
                    isError={isTrendingError}
                    skeletonCount={5}
                    upvote={vote.upvote}
                    unvote={vote.unvote}
                    isVotePending={vote.isVotePending}
                  />
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center py-12 mt-16 border-t border-slate-800/50">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                  <Target className="w-5 h-5" />
                </div>
                <h4 className="text-xl font-semibold text-white">
                  Don't see your ideal .{domainExtension} domain?
                </h4>
              </div>
              <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
                Submit it to the hunt and rally the community around your
                vision.
                <br className="hidden md:block" />
                <span className="md:hidden"> </span>
                Claim your space and make it yours.
              </p>
              {/* Prominent Submit Button */}
              {isAuthenticated ? (
                <SubmitDomainDialog
                  extension={domainExtension}
                  redirectOnSuccess={false}
                >
                  <Button className="px-8 py-6 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white border-0 font-semibold shadow-lg shadow-cyan-500/25">
                    <Plus className="w-5 h-5 me-1" />
                    Submit Your .{domainExtension} Domain
                  </Button>
                </SubmitDomainDialog>
              ) : (
                <Button
                  className="px-8 py-6 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white border-0 font-semibold shadow-lg shadow-cyan-500/25"
                  onClick={() => setAuthDialogOpen(true)}
                >
                  <Plus className="w-5 h-5 me-1" />
                  Submit Your .{domainExtension} Domain
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vote or Share Choice Dialog */}
      {vote.choiceDialog.isOpen ? (
        <VoteOrShareChoiceDialog
          isOpen={vote.choiceDialog.isOpen}
          onClose={vote.choiceDialog.onClose}
          domainName={vote.choiceDialog.currentDomain}
          onChooseLogin={vote.choiceDialog.onChooseLogin}
          onChooseShare={vote.choiceDialog.onChooseShare}
        />
      ) : null}

      {/* Twitter Share Dialog */}
      {vote.shareDialog.isOpen ? (
        <TwitterShareDialog
          isOpen={vote.shareDialog.isOpen}
          onClose={vote.shareDialog.onClose}
          domainName={vote.shareDialog.currentDomain}
          shareUrl={vote.shareDialog.shareUrl}
          hasShared={vote.shareDialog.hasShared}
          isCheckingStatus={vote.shareDialog.isCheckingStatus}
          isSubmitting={vote.shareDialog.isSubmitting}
          onSubmit={vote.shareDialog.onSubmit}
          trackShares={true}
          campaignKey={vote.shareDialog.campaignKey}
          featureKey="hunt"
        />
      ) : null}
      {isAuthDialogOpen ? (
        <AuthRequiredDialog
          isOpen={isAuthDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
          title="Sign in to submit domains"
          description={`You need to sign in to submit domains to the hunt. Join the community and share your favorite .${domainExtension} domains!`}
        />
      ) : null}
    </section>
  );
};
