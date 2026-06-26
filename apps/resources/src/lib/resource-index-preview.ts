import type { Locale } from '@/i18n-config';
import { getPostOgAsset } from '@/lib/content';

export function getBlogPostPreviewImageSrc(
  locale: Locale,
  slug: string,
): string {
  const ogAsset = getPostOgAsset(slug);
  return ogAsset
    ? `/r/blog-assets/${slug}-og${ogAsset.extension}`
    : `/r/${locale}/blog/${slug}/opengraph-image`;
}

export function getResourceEntryPreviewImageSrc(
  locale: Locale,
  section: 'glossary' | 'partners' | 'tld',
  slug: string,
): string {
  return `/r/${locale}/${section}/${slug}/opengraph-image`;
}
