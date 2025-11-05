import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CalendarDays, Clock, Languages, Users } from 'lucide-react';
import { localeLabels, type Locale } from '@/i18n-config';

type ResourceMetaLabels = {
  publishedOn: string;
  by: string;
  sourceLanguage: string;
};

export type ResourceMetaItem = {
  key: string;
  icon: LucideIcon;
  content: ReactNode;
};

type ResourceMetaItemsParams = {
  labels: ResourceMetaLabels;
  publishedAt: Date;
  authorNames: string[];
  dateFormatter: Intl.DateTimeFormat;
  sourceLanguage: Locale;
  requestedLanguage: Locale;
  readingTimeText?: string;
};

export function createResourceMetaItems({
  labels,
  publishedAt,
  authorNames,
  dateFormatter,
  sourceLanguage,
  requestedLanguage,
  readingTimeText,
}: ResourceMetaItemsParams): ResourceMetaItem[] {
  const publishedIso = publishedAt.toISOString();

  const metaItems: ResourceMetaItem[] = [];

  if (readingTimeText) {
    metaItems.push({
      key: 'reading-time',
      icon: Clock,
      content: readingTimeText,
    });
  }

  metaItems.push({
    key: 'published',
    icon: CalendarDays,
    content: (
      <time dateTime={publishedIso}>
        {labels.publishedOn} {dateFormatter.format(publishedAt)}
      </time>
    ),
  });

  if (authorNames.length > 0) {
    metaItems.push({
      key: 'authors',
      icon: Users,
      content: (
        <>
          {labels.by} {authorNames.join(', ')}
        </>
      ),
    });
  }

  if (requestedLanguage !== sourceLanguage) {
    const sourceLanguageLabel =
      localeLabels[sourceLanguage] ?? sourceLanguage.toUpperCase();
    metaItems.push({
      key: 'source-language',
      icon: Languages,
      content: (
        <>
          {labels.sourceLanguage}: {sourceLanguageLabel}
        </>
      ),
    });
  }

  return metaItems;
}
