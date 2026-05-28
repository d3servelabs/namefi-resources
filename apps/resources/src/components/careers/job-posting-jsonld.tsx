import type { Locale } from '@/i18n-config';
import { JsonLd } from '@/components/json-ld';

interface JobPostingJsonLdProps {
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  employmentType: string;
  slug: string;
  siteUrl: string;
  locale: Locale;
}

export function JobPostingJsonLd({
  title,
  description,
  datePosted,
  validThrough,
  employmentType,
  slug,
  siteUrl,
  locale,
}: JobPostingJsonLdProps) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    datePosted,
    employmentType,
    jobLocationType: 'TELECOMMUTE',
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Namefi',
      legalName: 'D3Serve Labs Inc.',
      sameAs: siteUrl,
      logo: `${siteUrl}/logotype.svg`,
    },
    url: `${siteUrl}/r/${locale}/careers/${slug}`,
    directApply: false,
  };

  if (validThrough) {
    jsonLd.validThrough = validThrough;
  }

  return <JsonLd data={jsonLd} />;
}
