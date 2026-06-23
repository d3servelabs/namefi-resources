import { cache } from 'react';
import type { Locale } from '@/i18n-config';
import { getGlossaryEntriesForLocale } from '@/lib/content';

export type GlossaryDescriptionMap = Record<string, string>;

/**
 * Build-time `slug -> declarative description` map for a locale, read from the
 * glossary frontmatter. Feeds the hover-to-define cards on glossary links. The
 * map is small (one short string per glossary term) and serialises cleanly into
 * the client provider; entries without a description are simply omitted so the
 * link falls back to a plain anchor.
 */
export const getGlossaryDescriptionMap = cache(
  (locale: Locale): GlossaryDescriptionMap => {
    const map: GlossaryDescriptionMap = {};
    for (const entry of getGlossaryEntriesForLocale(locale)) {
      const description = entry.frontmatter.description?.trim();
      if (description) map[entry.slug] = description;
    }
    return map;
  },
);
