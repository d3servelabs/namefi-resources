import { Main } from '@/components/main';
import OriginBackground from '@/components/origin-background';
import { AppSidebar } from '@/components/sidebars';
import { SidebarProvider } from '@/components/ui/shadcn/sidebar';
import { Toaster } from '@/components/ui/shadcn/sonner';
import { getOriginRuntime } from '@/lib/origin';
import { cn } from '@/lib/cn';
import { Providers } from '@/components/providers';
import { GoogleAnalyticsCookieConsentGated } from '@/components/ga';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import DatadogRum from '@/components/datadog-rum';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './globals.css';
import ImpersonationBanner from '@/components/ImpersonationBanner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/**
 * Generate metadata for the current origin
 * This is a special function that is called by Next.js to generate metadata for the page.
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export async function generateMetadata(): Promise<Metadata> {
  const { origin, config: originConfig } = await getOriginRuntime();
  const metadata = originConfig.metadata;

  return {
    metadataBase: new URL(origin ?? 'https://namefi.io'),
    ...metadata,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const originInfo = await getOriginRuntime();
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning={true}>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          'antialiased min-h-screen w-full overflow-x-hidden overflow-y-auto flex flex-col',
        )}
      >
        <DatadogRum />
        <Providers originInfo={originInfo}>
          <GoogleAnalyticsCookieConsentGated />
          <ReactQueryDevtools initialIsOpen={false} />
          <OriginBackground />
          <Toaster expand={true} visibleToasts={3} />
          <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <Main>{children}</Main>
          </SidebarProvider>
          <ImpersonationBanner />
        </Providers>
      </body>
    </html>
  );
}
