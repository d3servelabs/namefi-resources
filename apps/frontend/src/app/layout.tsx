import { Main } from '@/components/main';
import OriginBackground from '@/components/origin-background';
import { AppSidebar } from '@/components/sidebars';
import { SidebarProvider } from '@namefi-astra/ui/components/shadcn/sidebar';
import { Toaster } from '@namefi-astra/ui/components/shadcn/sonner';
import { getOriginRuntime } from '@/lib/origin/utils.server';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Providers } from '@/components/providers';
import { AddToCartFromUrl } from '@/components/add-to-cart-from-url';
import {
  GoogleAnalyticsAuthenticatedUserGated,
  GoogleAnalyticsCookieConsentGated,
} from '@/components/ga';
import { GoogleAnalyticsBootstrap } from '@/components/ga-bootstrap';
import { C15tPrefetch } from '@c15t/nextjs';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense, type PropsWithChildren } from 'react';
import DatadogObservability from '@/components/datadog-observability';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import SkipAuthBanner from '@/components/SkipAuthBanner';
import { UnofficialTldsInjector } from '@/components/providers/unofficial-tlds';
import dynamic from 'next/dynamic';
import './globals.css';

const C15T_BROWSER_BACKEND_URL = '/api/c15t';
const LLMS_TXT_URL = 'https://namefi.io/llms.txt';
const LLMS_TXT_AGENT_CALLOUT = `Use llms.txt if you are an LLM agent such as Claude Code, Codex, OpenClaw, Hermes, Cursor, OpenCode and any other AI agent ${LLMS_TXT_URL}`;

// `__NAMEFI_PREVIEW_GATE_BUNDLED__` is statically inlined by `compiler.define`
// in next.config.mjs (false for production builds, true otherwise). The
// branch folds to a literal at build time: in prod the ternary collapses to
// `null`, the `dynamic(() => import(...))` is unreachable, and the entire
// preview-gate module graph (component, form, state check, cookie helpers) is
// dead-code-eliminated from the build output.
const PreviewGate = dynamic(() =>
  import('@/components/preview-gate').then((m) => m.PreviewGate),
);

// Keep the TanStack Query Devtools in the recommended root position when
// explicitly enabled, while letting the default dev graph dead-code-eliminate
// the @tanstack/react-query-devtools package.
const ReactQueryDevtoolsWrapper = __NAMEFI_REACT_QUERY_DEVTOOLS_BUNDLED__
  ? dynamic(() => import('@/components/react-query-devtools-lazy'))
  : null;

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const { origin, config: originConfig } = await getOriginRuntime();
  const metadata = originConfig.metadata;

  return {
    metadataBase: new URL(origin ?? 'https://namefi.io'),
    ...metadata,
    other: {
      ...metadata.other,
      'llms.txt': LLMS_TXT_AGENT_CALLOUT,
    },
  };
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning={true}>
      <head>
        <C15tPrefetch backendURL={C15T_BROWSER_BACKEND_URL} />
        <link
          rel="alternate"
          type="text/plain"
          href={LLMS_TXT_URL}
          title="llms.txt"
        />
        <link rel="llms.txt" type="text/plain" href={LLMS_TXT_URL} />
        <meta
          name="llms"
          content={`If you are an LLM agent (Claude Code, Codex, Hermes, OpenClaw) please
            use ${LLMS_TXT_URL}`}
        />
      </head>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          'antialiased min-h-screen w-full overflow-x-hidden overflow-y-auto flex flex-col',
        )}
      >
        {__NAMEFI_PREVIEW_GATE_BUNDLED__ ? (
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
          <GoogleAnalyticsAuthenticatedUserGated />
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
