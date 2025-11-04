import type { ReactNode } from 'react';
import { localeLabels, type Locale } from '@/i18n-config';

type ResourceMetaLabels = {
  publishedOn: string;
  by: string;
  sourceLanguage: string;
};

type ResourceMetaItemsParams = {
  labels: ResourceMetaLabels;
  publishedAt: Date;
  authorNames: string[];
  dateFormatter: Intl.DateTimeFormat;
  sourceLanguage: Locale;
  requestedLanguage: Locale;
};

export function createResourceMetaItems({
  labels,
  publishedAt,
  authorNames,
  dateFormatter,
  sourceLanguage,
  requestedLanguage,
}: ResourceMetaItemsParams): ReactNode[] {
  const publishedIso = publishedAt.toISOString();

  const metaItems: Array<ReactNode | null> = [
    <time key="published" dateTime={publishedIso}>
      {labels.publishedOn} {dateFormatter.format(publishedAt)}
    </time>,
    authorNames.length > 0 ? (
      <span key="authors">
        {labels.by} {authorNames.join(', ')}
      </span>
    ) : null,
  ];

  if (requestedLanguage !== sourceLanguage) {
    const sourceLanguageLabel =
      localeLabels[sourceLanguage] ?? sourceLanguage.toUpperCase();
    metaItems.push(
      <span key="source">
        {labels.sourceLanguage}: {sourceLanguageLabel}
      </span>,
    );
  }

  return metaItems.filter(Boolean) as ReactNode[];
}
