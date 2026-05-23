import { ImageResponse } from 'next/og';
import { type Locale, i18n } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { getWatchVideo } from '@/lib/watch';
import { OgLogotype } from '../../../og/logotype';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

const backgroundColor = '#1F0F2E';
const foregroundColor = '#F5F0FF';

// biome-ignore lint/style/noDefaultExport: expected default export
export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; videoId: string }>;
}) {
  const { lang, videoId } = await params;
  const locale = i18n.locales.includes(lang as Locale)
    ? (lang as Locale)
    : i18n.defaultLocale;
  const dictionary = await getDictionary(locale);
  const video = await getWatchVideo(videoId);
  const title = video?.title ?? dictionary.watch.indexTitle;
  const pillLabel = [dictionary.nav.resources, dictionary.nav.watch]
    .join(' • ')
    .toUpperCase();

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
          maxWidth: '85%',
        }}
      >
        <span
          style={{
            fontSize: 28,
            letterSpacing: '0.18em',
            opacity: 0.8,
          }}
        >
          {pillLabel}
        </span>
        <h1
          style={{
            fontSize: title.length > 60 ? 64 : 80,
            lineHeight: 1.05,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            margin: 0,
          }}
        >
          {title}
        </h1>
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
