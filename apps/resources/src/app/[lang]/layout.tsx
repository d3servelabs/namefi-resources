import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import { i18n, localeDirections, isRtlLocale } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Providers } from '@/components/providers';
import { GoogleAnalyticsBootstrap } from '@/components/ga-bootstrap';
import { resolveBaseUrl } from '@/lib/site-url';
import type { Metadata } from 'next';
import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  // Only English is indexed. Non-English locales return noindex,follow so
  // Google can still traverse hreflang links to discover the English canonical
  // but won't index translated variants as separate pages. Pairs with the
  // English-only sitemap in apps/resources/src/app/sitemap.ts.
  const isEnglish = lang === 'en';
  return {
    metadataBase: new URL(resolveBaseUrl()),
    robots: isEnglish ? undefined : { index: false, follow: true },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  if (!i18n.locales.includes(lang as Locale)) {
    notFound();
  }
  const locale = lang as Locale;
  const dictionary = await getDictionary(locale);
  const direction = localeDirections[locale] ?? 'ltr';
  const isRtl = isRtlLocale(locale);

  return (
    <html lang={locale} dir={direction}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased ${
          isRtl ? 'rtl' : 'ltr'
        }`}
      >
        <GoogleAnalyticsBootstrap />
        <Providers>
          <div className="flex min-h-screen flex-col bg-background">
            <SiteHeader locale={locale} dictionary={dictionary} />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
