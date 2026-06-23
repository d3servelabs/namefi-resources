import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { createTRPCClient } from '@trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { useState, type ReactNode } from 'react';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
import { AnnouncementsBanner } from '@/components/AnnouncementsBanner';
import { AppSidebar } from '@/components/sidebars';
import { CartProvider } from '@/components/providers/cart';
import { FreeMintsGuidanceProvider } from '@/components/providers/free-mints-guidance';
import { Header } from '@/components/header';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { LocaleChangeProvider } from '@/components/i18n/use-change-locale';
import { MockPrivyProvider } from '@/lib/mock/privy';
import { OriginProvider } from '@/components/providers/origin';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { SidebarProvider } from '@namefi-astra/ui/components/shadcn/sidebar';
import { StorybookAuthProvider } from '../utils/storybook-auth-provider';
import { TRPCProvider, type AppRouter } from '@/lib/trpc';
import { WishlistProvider } from '@/components/providers/wishlist';
import { createMockLink } from '@/lib/mock/trpc';
import { defaultLocale, type Locale } from '@/i18n/config';
import type { OriginRuntime } from '@/lib/origin/types';

const namefiOrigin: OriginRuntime = {
  isFirstPartyOrigin: true,
  thirdPartyHostname: null,
  origin: 'https://astra.namefi.io',
  config: {
    metadata: {
      title: 'Namefi',
      description: 'Namefi',
    },
    landingPage: {
      headerIsBlurred: true,
    },
    logo: {
      type: 'lottie',
      lottie: '/lottie/namefi_to_nfi.json',
      alt: 'Namefi Logo',
      width: 66,
      height: 19.8,
    },
  },
};

function StoryProviders({ children }: { children: ReactNode }) {
  const [activeLocale, setActiveLocale] = useState<Locale>(defaultLocale);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
  );
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        createMockLink({
          isAuthenticated: false,
          getMockData: async (opts) => {
            if (opts.op.path === 'announcements.getActive') {
              return [null, { items: [] }];
            }
            return [null, {}];
          },
        }),
      ],
    }),
  );

  return (
    <MockPrivyProvider
      value={{ ready: true, authenticated: false, user: null }}
    >
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          <OriginProvider originInfo={namefiOrigin}>
            <NuqsAdapter>
              <ConsentManagerProvider options={{ mode: 'offline' }}>
                <StorybookAuthProvider isAuthenticated={false}>
                  <AdminFeatureFlagsProvider>
                    <PreAuthSignalsProvider>
                      <InteractionLoggersProvider>
                        <WishlistProvider>
                          <CartProvider>
                            <SidebarProvider defaultOpen={false}>
                              <FreeMintsGuidanceProvider>
                                <LocaleChangeProvider
                                  activeLocale={activeLocale}
                                  changeLocale={setActiveLocale}
                                >
                                  {children}
                                </LocaleChangeProvider>
                              </FreeMintsGuidanceProvider>
                            </SidebarProvider>
                          </CartProvider>
                        </WishlistProvider>
                      </InteractionLoggersProvider>
                    </PreAuthSignalsProvider>
                  </AdminFeatureFlagsProvider>
                </StorybookAuthProvider>
              </ConsentManagerProvider>
            </NuqsAdapter>
          </OriginProvider>
        </TRPCProvider>
      </QueryClientProvider>
    </MockPrivyProvider>
  );
}

function MobileHeaderShell() {
  return (
    <StoryProviders>
      <AppSidebar />
      <div className="dark min-h-svh flex-1 bg-[#04050A] text-white">
        <AnnouncementsBanner />
        <Header />
        <main className="px-4 pt-20">
          <div className="mx-auto h-[520px] max-w-sm rounded-2xl border border-white/10 bg-white/[0.03]" />
        </main>
      </div>
    </StoryProviders>
  );
}

const meta: Meta<typeof MobileHeaderShell> = {
  title: 'Components/Mobile Header',
  component: MobileHeaderShell,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'iphone-17',
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
