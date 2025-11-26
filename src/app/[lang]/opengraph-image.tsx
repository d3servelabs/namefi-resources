import { ImageResponse } from 'next/og';
import { getDictionary } from '@/get-dictionary';
import { i18n, type Locale, localeLabels } from '@/i18n-config';
import { resolveDescription, resolveTitle } from '@/lib/site-metadata';
import { OgLogotype } from '../og/logotype';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

const backgroundColor = '#064E3B';
const foregroundColor = '#ECFDF5';

// biome-ignore lint/style/noDefaultExport: expected default export
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = i18n.locales.includes(lang as Locale)
    ? (lang as Locale)
    : i18n.defaultLocale;

  const dictionary = await getDictionary(locale);
  const resourcesLabel = dictionary.nav.resources;

  const siteName = resolveTitle(locale);
  const description = resolveDescription(locale);
  const languageLabel = localeLabels[locale] ?? locale.toUpperCase();
  const pillLabel = [resourcesLabel, languageLabel].join(' • ');

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
          gap: '32px',
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
            fontSize: 90,
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            margin: 0,
          }}
        >
          {siteName}
        </h1>
        <p
          style={{
            fontSize: 36,
            lineHeight: 1.4,
            color: 'rgba(236, 253, 245, 0.82)',
            margin: 0,
          }}
        >
          {description}
        </p>
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
