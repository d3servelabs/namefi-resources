import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import { i18n, localeDirections, isRtlLocale } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Providers } from '@/components/providers';
import {
  SidebarInset,
  SidebarProvider,
} from '@namefi-astra/ui/components/shadcn/sidebar';
import { ConsentIsland } from '@/components/providers/consent-island';
import { GoogleAnalyticsBootstrap } from '@/components/ga-bootstrap';
import { JsonLd } from '@/components/json-ld';
import { C15T_BROWSER_BACKEND_URL } from '@/lib/c15t';
import { resolveBaseUrl } from '@/lib/site-url';
import { buildWebsiteJsonLd } from '@/lib/structured-data';
import { C15tPrefetch } from '@c15t/nextjs';
import type { Metadata } from 'next';
import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

// Geist Mono is only used for code blocks (prose-pre/prose-code) and a few
// tabular-nums timestamps — never the LCP body text. Keep it off the preload /
// render-blocking critical path so it doesn't compete with the body font.
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(resolveBaseUrl()),
};

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
  const websiteJsonLd = buildWebsiteJsonLd({
    baseUrl: resolveBaseUrl(),
    locale,
  });

  return (
    <html lang={locale} dir={direction}>
      <head>
        <C15tPrefetch backendURL={C15T_BROWSER_BACKEND_URL} />
        <JsonLd data={websiteJsonLd} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased ${
          isRtl ? 'rtl' : 'ltr'
        }`}
      >
        <GoogleAnalyticsBootstrap />
        <Providers>
          <SidebarProvider>
            <AppSidebar locale={locale} dictionary={dictionary} />
            <SidebarInset>
              <SiteHeader locale={locale} dictionary={dictionary} />
              <div className="flex-1">{children}</div>
              <SiteFooter />
            </SidebarInset>
          </SidebarProvider>
        </Providers>
        <ConsentIsland />
      </body>
    </html>
  );
}
