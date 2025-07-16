import { Main } from '@/components/main';
import OriginBackground from '@/components/origin-background';
import { Preloader } from '@/components/preloader';
import { AppSidebar } from '@/components/sidebars';
import { SidebarProvider } from '@/components/ui/shadcn/sidebar';
import { Toaster } from '@/components/ui/shadcn/sonner';
import { Contexts } from '@/contexts';
import { config } from '@/lib/env';
import { getOriginConfig, getOriginFromServerHeaders } from '@/lib/origin';
import { cn } from '@/lib/utils';
import { Providers } from '@/providers';
import { GoogleAnalytics } from '@next/third-parties/google';
import { UsercentricsScript } from '@s-group/react-usercentrics';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import './globals.css';
import DatadogRum from '@/components/datadog-rum';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

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
  const headersList = await headers();
  const origin = getOriginFromServerHeaders(headersList);
  const metadata = getOriginConfig(origin).metadata;

  return metadata;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark h-full"
      data-theme="namefi"
      suppressHydrationWarning={true}
    >
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          'antialiased min-h-screen w-full overflow-x-hidden overflow-y-auto flex flex-col',
        )}
      >
        <DatadogRum />
        <Preloader />
        <UsercentricsScript
          settingsId={config.USER_CENTRICS_SETTINGS_ID}
          version="preview"
        />
        <GoogleAnalytics gaId={config.GA_MEASUREMENT_ID} />
        <Providers>
          <ReactQueryDevtools initialIsOpen={false} />

          <Contexts>
            <OriginBackground />
            <Toaster expand={true} visibleToasts={3} />
            <SidebarProvider defaultOpen={false}>
              <AppSidebar />
              <Main>{children}</Main>
            </SidebarProvider>
          </Contexts>
        </Providers>
      </body>
    </html>
  );
}
