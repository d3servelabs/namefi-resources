import { ImageResponse } from 'next/og';
import type { Locale } from '@/i18n-config';
import { localeLabels } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { getPartnerCached } from '@/lib/content';
import { OgLogotype } from '../../../og/logotype';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

const backgroundColor = '#064E3B';
const foregroundColor = '#ECFDF5';

// biome-ignore lint/style/noDefaultExport: expected default export
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const entry = getPartnerCached(locale, slug);

  if (!entry) {
    return new ImageResponse(
      <div
        style={{
          backgroundColor,
          color: foregroundColor,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          fontSize: 48,
          fontWeight: 600,
          width: '100%',
          height: '100%',
          padding: '80px',
        }}
      >
        Partner not found
      </div>,
      {
        ...size,
        status: 404,
      },
    );
  }

  const dictionary = await getDictionary(locale);
  const resourcesLabel = dictionary.nav.resources;
  const sectionLabel = dictionary.nav.partners;
  const languageLabel =
    localeLabels[entry.requestedLanguage] ??
    entry.requestedLanguage.toUpperCase();
  const pillLabel = [resourcesLabel, sectionLabel, languageLabel].join(' • ');
  const summary =
    entry.frontmatter.summary ?? entry.frontmatter.description ?? undefined;

  return new ImageResponse(
    <div
      style={{
        fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '80px',
        backgroundColor,
        color: foregroundColor,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxWidth: '80%',
        }}
      >
        <span
          style={{
            fontSize: 28,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            opacity: 0.8,
          }}
        >
          {pillLabel}
        </span>
        <h1
          style={{
            fontSize: 76,
            lineHeight: 1.05,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          {entry.frontmatter.title}
        </h1>
        {summary ? (
          <p
            style={{
              fontSize: 32,
              lineHeight: 1.36,
              color: 'rgba(236, 253, 245, 0.82)',
              margin: 0,
            }}
          >
            {truncate(summary, 220)}
          </p>
        ) : null}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          width: '100%',
        }}
      >
        <OgLogotype />
      </div>
    </div>,
    {
      ...size,
    },
  );
}
