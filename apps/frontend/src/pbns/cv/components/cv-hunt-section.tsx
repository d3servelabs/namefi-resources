'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { Button } from '@/components/ui/shadcn/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { DomainsList } from '@/components/hunt/domains-list';
import { CampaignDomainsList } from '@/components/hunt/campaign-domains-list';
import { SubmitDomainDialog } from '@/components/hunt/submit-domain-dialog';
import { PaginationControls } from '@/components/hunt/pagination-control';
import { config } from '@/lib/env';
import { Trophy, Target, TrendingUp, Plus } from 'lucide-react';
import type { AppRouterInput } from '@/lib/trpc';

type TimeRange = AppRouterInput['hunt']['getTrendingDomains']['timeRange'];

const CV_DOMAINS_PER_PAGE_LIMIT = 10;

interface CVHuntSectionProps {
  /** The name (e.g., "taylor") for generating domain-specific content */
  name: string;
}

export const CVHuntSection = ({ name: _name }: CVHuntSectionProps) => {
  const [campaignPage, setCampaignPage] = useState(1);
  const [trendingPage, setTrendingPage] = useState(1);
  const [timeRange, setTimeRange] = useState<TimeRange>('THIS_WEEK');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const trpc = useTRPC();
  const offset = (trendingPage - 1) * CV_DOMAINS_PER_PAGE_LIMIT;

  // Get CV campaign key from config
  const cvCampaignKey = useMemo(() => {
    return config.HUNT_CAMPAIGN_KEYS.find((key) => key.includes('cv'));
  }, []);

  const handleTimeRangeChange = useCallback((value: string) => {
    setTimeRange(value as TimeRange);
    setTrendingPage(1);
  }, []);

  const handleCampaignPageChange = useCallback((newPage: number) => {
    setCampaignPage(newPage);
  }, []);

  const handleTrendingPageChange = useCallback((newPage: number) => {
    setTrendingPage(newPage);
  }, []);

  // Fetch trending .cv domains
  const {
    data: trendingData,
    isLoading: isTrendingLoading,
    isError: isTrendingError,
  } = useQuery({
    ...(isAuthenticated
      ? trpc.hunt.getTrendingDomains.queryOptions({
          limit: CV_DOMAINS_PER_PAGE_LIMIT,
          offset,
          timeRange,
          extension: 'cv',
        })
      : trpc.hunt.getTrendingDomainsPublic.queryOptions({
          limit: CV_DOMAINS_PER_PAGE_LIMIT,
          offset,
          timeRange,
          extension: 'cv',
        })),
    enabled: !isAuthLoading,
  });

  const hasTrendingMore = useMemo(
    () => trendingData?.hasMore ?? false,
    [trendingData],
  );

  return (
    <section id="cv-hunt" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-center tracking-tight">
            Join the{' '}
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              .cv Hunt
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 text-center max-w-3xl mx-auto font-medium">
            Discover and vote for the most sought-after .cv domains. Be part of
            the community shaping the future of professional identity on the
            web.
          </p>

          <div className="space-y-16 mt-16">
            {/* CV Campaign Section */}
            {cvCampaignKey && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white text-left">
                      Official .cv Campaign
                    </h3>
                    <p className="text-slate-400">
                      Current leaderboard of featured domains
                    </p>
                  </div>
                </div>
                <CampaignDomainsList
                  campaignKey={cvCampaignKey}
                  page={campaignPage}
                  limit={8}
                  onPageChange={handleCampaignPageChange}
                  showTitle={false}
                />
              </div>
            )}

            {/* Trending .cv Domains Section */}
            <div className="space-y-6" id="trending-cv-domains">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white text-left">
                      Trending .cv Domains
                    </h3>
                    <p className="text-slate-400">
                      Community favorites and rising stars
                    </p>
                  </div>
                </div>
                <Tabs value={timeRange} onValueChange={handleTimeRangeChange}>
                  <TabsList className="bg-slate-800/50 border border-slate-700/50">
                    <TabsTrigger
                      value="THIS_WEEK"
                      className="cursor-pointer text-slate-300 data-[state=active]:text-white"
                    >
                      This Week
                    </TabsTrigger>
                    <TabsTrigger
                      value="THIS_MONTH"
                      className="cursor-pointer text-slate-300 data-[state=active]:text-white"
                    >
                      This Month
                    </TabsTrigger>
                    <TabsTrigger
                      value="ANYTIME"
                      className="cursor-pointer text-slate-300 data-[state=active]:text-white"
                    >
                      All Time
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="border border-slate-700/50 shadow-xl rounded-2xl bg-slate-900/30 backdrop-blur-xl">
                {isTrendingLoading || isAuthLoading ? (
                  // Show skeleton while loading to prevent layout shift
                  <div className="divide-y divide-slate-700/50">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-6 animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-8 bg-slate-700/50 rounded" />
                          <div className="flex-1">
                            <div className="h-5 bg-slate-700/50 rounded mb-2 w-3/4" />
                            <div className="h-4 bg-slate-800/50 rounded w-1/2" />
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 bg-slate-700/50 rounded-full" />
                            <div className="w-8 h-4 bg-slate-700/50 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isTrendingError ? (
                  <div className="p-8 text-center">
                    <div className="text-red-400 mb-2">
                      Failed to load trending domains
                    </div>
                    <p className="text-slate-500 text-sm">
                      Please try again later
                    </p>
                  </div>
                ) : (
                  <DomainsList
                    domains={trendingData?.items ?? []}
                    isLoading={false}
                    isError={false}
                  />
                )}
              </div>

              <PaginationControls
                page={trendingPage}
                hasMore={hasTrendingMore}
                onPageChange={handleTrendingPageChange}
              />
            </div>

            {/* Call to Action */}
            <div className="text-center py-12 border-t border-slate-800/50">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white">
                  <Target className="w-5 h-5" />
                </div>
                <h4 className="text-xl font-semibold text-white">
                  Don't see your ideal .cv domain?
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
              <SubmitDomainDialog
                extension="cv"
                onSuccess={() => {
                  // Scroll to trending section on successful submission
                  document
                    .getElementById('trending-cv-domains')
                    ?.scrollIntoView({
                      behavior: 'smooth',
                    });
                }}
              >
                <Button className="px-8 py-6 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 font-semibold shadow-lg shadow-purple-500/25">
                  <Plus className="w-5 h-5 mr-1" />
                  Submit Your .cv Domain
                </Button>
              </SubmitDomainDialog>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
