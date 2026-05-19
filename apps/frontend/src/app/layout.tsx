import { Main } from '@/components/main';
import OriginBackground from '@/components/origin-background';
import { AppSidebar } from '@/components/sidebars';
import { SidebarProvider } from '@namefi-astra/ui/components/shadcn/sidebar';
import { Toaster } from '@namefi-astra/ui/components/shadcn/sonner';
import { getOriginRuntime } from '@/lib/origin/utils.server';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Providers } from '@/components/providers';
import { AddToCartFromUrl } from '@/components/add-to-cart-from-url';
import { GoogleAnalyticsCookieConsentGated } from '@/components/ga';
import { GoogleAnalyticsBootstrap } from '@/components/ga-bootstrap';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense, type PropsWithChildren } from 'react';
import DatadogObservability from '@/components/datadog-observability';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import SkipAuthBanner from '@/components/SkipAuthBanner';
import { UnofficialTldsInjector } from '@/components/providers/unofficial-tlds';
import dynamic from 'next/dynamic';
import './globals.css';

// `NEXT_PUBLIC_PREVIEW_GATE_BUNDLED` is statically inlined by `compiler.define`
// in next.config.mjs (set to '0' for production builds, '1' otherwise). The
// equality folds to a literal at build time: in prod the ternary collapses to
// `null`, the `dynamic(() => import(...))` is unreachable, and the entire
// preview-gate module graph (component, form, state check, cookie helpers) is
// dead-code-eliminated from the build output.
const PreviewGate = dynamic(() =>
  import('@/components/preview-gate').then((m) => m.PreviewGate),
);

// Keep the TanStack Query Devtools in the recommended root position when
// explicitly enabled, while letting the default dev graph dead-code-eliminate
// the @tanstack/react-query-devtools package.
const ReactQueryDevtoolsWrapper =
  process.env.NEXT_PUBLIC_REACT_QUERY_DEVTOOLS_BUNDLED === '1'
    ? dynamic(() => import('@/components/react-query-devtools-lazy'))
    : null;

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const { origin, config: originConfig } = await getOriginRuntime();
  const metadata = originConfig.metadata;

  return {
    metadataBase: new URL(origin ?? 'https://namefi.io'),
    ...metadata,
  };
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning={true}>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          'antialiased min-h-screen w-full overflow-x-hidden overflow-y-auto flex flex-col',
        )}
      >
        {process.env.NEXT_PUBLIC_PREVIEW_GATE_BUNDLED === '1' ? (
          <PreviewGate>
            <RootLayoutInner>{children}</RootLayoutInner>
          </PreviewGate>
        ) : (
          <RootLayoutInner>{children}</RootLayoutInner>
        )}
      </body>
    </html>
  );
}
function RootLayoutInner({ children }: PropsWithChildren) {
  return (
    <>
      <GoogleAnalyticsBootstrap />
      <DatadogObservability />
      <Suspense>
        <Providers>
          <GoogleAnalyticsCookieConsentGated />
          {ReactQueryDevtoolsWrapper ? <ReactQueryDevtoolsWrapper /> : null}
          <OriginBackground />
          <Toaster expand={true} visibleToasts={3} />
          <AddToCartFromUrl />
          <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <Main>{children}</Main>
            <UnofficialTldsInjector />
          </SidebarProvider>
          <ImpersonationBanner />
          <SkipAuthBanner />
        </Providers>
      </Suspense>
    </>
  );
}
