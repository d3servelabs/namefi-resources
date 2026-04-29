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
import ReactQueryDevtoolsWrapper from '@/components/react-query-devtools-lazy';
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
const PreviewGate =
  process.env.NEXT_PUBLIC_PREVIEW_GATE_BUNDLED === '1'
    ? dynamic(() =>
        import('@/components/preview-gate').then((m) => m.PreviewGate),
      )
    : null;
console.log({
  PreviewGate: !!PreviewGate,
  env: process.env.NEXT_PUBLIC_PREVIEW_GATE_BUNDLED,
});

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
  const shell = (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <Main>{children}</Main>
      <UnofficialTldsInjector />
    </SidebarProvider>
  );

  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning={true}>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          'antialiased min-h-screen w-full overflow-x-hidden overflow-y-auto flex flex-col',
        )}
      >
        <GoogleAnalyticsBootstrap />
        <DatadogObservability />
        <Suspense>
          <Providers>
            <GoogleAnalyticsCookieConsentGated />
            <ReactQueryDevtoolsWrapper />
            <OriginBackground />
            <Toaster expand={true} visibleToasts={3} />
            <AddToCartFromUrl />
            {PreviewGate ? <PreviewGate>{shell}</PreviewGate> : shell}
            <ImpersonationBanner />
            <SkipAuthBanner />
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
