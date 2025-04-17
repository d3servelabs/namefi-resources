import { Main } from '@/components/main';
import { Preloader } from '@/components/preloader';
import { AppSidebar } from '@/components/sidebars';
import { SidebarProvider } from '@/components/ui/shadcn/sidebar';
import { Toaster } from '@/components/ui/shadcn/sonner';
import { Contexts } from '@/contexts';
import { config } from '@/lib/env';
import {
  getMetadataForOrigin,
  getOriginFromServerHeaders,
  metadataConfig,
} from '@/lib/origin-utils';
import { cn } from '@/lib/utils';
import { Providers } from '@/providers';
import { GoogleAnalytics } from '@next/third-parties/google';
import { UsercentricsScript } from '@s-group/react-usercentrics';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';
import { headers } from 'next/headers';

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
  // Get host from server headers
  const headersList = await headers();
  const origin = getOriginFromServerHeaders(headersList);

  if (!origin) {
    return metadataConfig.firstParty;
  }

  // Get origin-specific metadata
  const metadata = getMetadataForOrigin(origin);

  return metadata;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning={true}>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          'antialiased min-h-screen w-full overflow-x-hidden overflow-y-auto bg-origin bg-cover bg-center bg-fixed',
        )}
      >
        <Preloader />
        <UsercentricsScript
          settingsId={config.USER_CENTRICS_SETTINGS_ID}
          version="preview"
        />
        <GoogleAnalytics gaId={config.GA_MEASUREMENT_ID} />
        <Providers>
          <Contexts>
            <Toaster />
            <SidebarProvider>
              <AppSidebar />
              <Main>{children}</Main>
            </SidebarProvider>
          </Contexts>
        </Providers>
      </body>
    </html>
  );
}
