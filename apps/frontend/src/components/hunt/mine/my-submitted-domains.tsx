'use client';

import { formatNumberWithAbbreviations } from '@/lib/number';
import { useFormatter, useTranslations } from 'next-intl';
import type { AppRouterOutput } from '@/lib/trpc';
import Link from 'next/link';
import { DomainItemSkeleton } from '../domain-item-skeleton';
import { TagsDisplay } from '../tags-display';
import { UpvoteIcon } from '../upvote-icon';

type MySubmittedDomainsResponse =
  AppRouterOutput['hunt']['getMySubmittedDomains'];
type MyDomain = MySubmittedDomainsResponse['items'][number];

const MySubmittedDomainItem = ({ domain }: { domain: MyDomain }) => {
  const t = useTranslations('hunt');
  const format = useFormatter();
  return (
    <div className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 py-6 first:rounded-t-xl last:rounded-b-xl hover:bg-accent/30 transition">
      {/* Stats */}
      <div className="flex flex-col items-center w-12 sm:w-16">
        <div className="flex flex-col items-center">
          <UpvoteIcon className="text-2xl text-muted-foreground" />
          <span className="text-base/8 font-bold text-foreground font-mono">
            {formatNumberWithAbbreviations(domain.upvoteCount)}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row sm:items-center">
        {/* Content */}
        <div className="flex-1 flex flex-col gap-1 sm:gap-2 w-full">
          <Link
            href={`/hunt/domains/${encodeURIComponent(domain.domainName)}`}
            className="text-base sm:text-lg text-start font-semibold text-foreground font-sans hover:text-primary transition-colors"
          >
            {domain.domainName}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <TagsDisplay tags={domain.tags || []} limit={4} />
            {domain.userHasUpvoted && (
              <span className="text-xs text-primary">
                {t('submitted.youUpvoted')}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {t('submitted.submittedOn', {
                date: format.dateTime(new Date(domain.submittedAt), {
                  dateStyle: 'medium',
                }),
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MySubmittedDomainsProps {
  domains: MyDomain[];
  isLoading: boolean;
  isError: boolean;
}

export const MySubmittedDomains = ({
  domains,
  isLoading,
  isError,
}: MySubmittedDomainsProps) => {
  const t = useTranslations('hunt');
  if (isLoading) {
    return <DomainItemSkeleton />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">
        {t('submitted.loadError')}
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {t('submitted.empty')}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {domains.map((domain) => (
        <MySubmittedDomainItem key={domain.domainName} domain={domain} />
      ))}
    </div>
  );
};
