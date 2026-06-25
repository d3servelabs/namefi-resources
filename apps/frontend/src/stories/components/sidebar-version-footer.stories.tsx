import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { createTRPCClient } from '@trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { useEffect, useState, type ReactNode } from 'react';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
import { AppSidebar } from '@/components/sidebars';
import { CartProvider } from '@/components/providers/cart';
import { FreeMintsGuidanceProvider } from '@/components/providers/free-mints-guidance';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { LocaleChangeProvider } from '@/components/i18n/use-change-locale';
import { MockPrivyProvider } from '@/lib/mock/privy';
import { OriginProvider } from '@/components/providers/origin';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import {
  SidebarProvider,
  useSidebar,
} from '@namefi-astra/ui/components/shadcn/sidebar';
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
                            <SidebarProvider
                              defaultOpen={true}
                              className="dark bg-[#04050A] text-foreground"
                            >
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

function MobileDrawerController({ open }: { open: boolean }) {
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(open);
  }, [open, setOpenMobile]);

  return null;
}

type SidebarVersionShellProps = {
  mobileDrawerOpen?: boolean;
};

function SidebarVersionShell({
  mobileDrawerOpen = false,
}: SidebarVersionShellProps) {
  return (
    <StoryProviders>
      <MobileDrawerController open={mobileDrawerOpen} />
      <AppSidebar />
      <main
        aria-hidden="true"
        className="min-h-svh flex-1 bg-[#04050A] p-6 md:p-8"
      >
        <div className="h-[calc(100svh-3rem)] rounded-sm border border-white/10 bg-white/[0.03]" />
      </main>
    </StoryProviders>
  );
}

const meta = {
  title: 'Components/Sidebar Version Footer',
  component: SidebarVersionShell,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
    chromatic: {
      cropToViewport: true,
    },
  },
  args: {
    mobileDrawerOpen: false,
  },
} satisfies Meta<typeof SidebarVersionShell>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default meta exports.
export default meta;

type Story = StoryObj<typeof meta>;

export const DesktopExpanded: Story = {};

export const MobileDrawerOpen: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'iphone-17',
    },
  },
  args: {
    mobileDrawerOpen: true,
  },
};
