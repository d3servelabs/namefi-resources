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
import { MockPrivyProvider, privyMockUser } from '@/lib/mock/privy';
import { OriginProvider } from '@/components/providers/origin';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import {
  SidebarProvider,
  useSidebar,
} from '@namefi-astra/ui/components/shadcn/sidebar';
import { StorybookAuthProvider } from '../utils/storybook-auth-provider';
import { TRPCProvider, type AppRouter, type AppRouterOutput } from '@/lib/trpc';
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

type StoryAuthState = {
  fullName?: string;
};

function buildMockPrivyUser(fullName: string) {
  return {
    ...privyMockUser,
    customMetadata: {
      data: JSON.stringify({ fullName }),
    },
  };
}

function buildMockUser(fullName: string): AppRouterOutput['users']['getUser'] {
  return {
    id: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
    stripeCustomerId: 'cus_SEo212w712hXZm',
    privyUserId: 'did:privy:cmcjax6ya00123z0nch67ge9x',
    subscribeToEmails: true,
    lastSignInAt: new Date('2026-01-28T17:20:47.000Z'),
    lastAccessedSessionAt: new Date('2026-01-28T17:20:55.411Z'),
    createdAt: new Date('2025-05-02T14:18:18.531Z'),
    updatedAt: new Date('2026-01-28T17:22:15.729Z'),
    displayProfile: {
      displayName: fullName,
      email: 'dev-team@d3serve.xyz',
      walletAddress: '0xB5856d4598c919834913b8656ebc15a64d3C7836',
    },
  };
}

function StoryProviders({
  auth,
  children,
}: {
  auth?: StoryAuthState;
  children: ReactNode;
}) {
  const [activeLocale, setActiveLocale] = useState<Locale>(defaultLocale);
  const isAuthenticated = Boolean(auth?.fullName);
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
          isAuthenticated,
          user: auth?.fullName ? buildMockUser(auth.fullName) : undefined,
          getMockData: async (opts) => {
            if (opts.op.path === 'announcements.getActive') {
              return [null, { items: [] }];
            }
            if (
              opts.op.path === 'wishlist.getWishlistDomains' ||
              opts.op.path === 'freeClaims.getUserClaims' ||
              opts.op.path === 'carts.getItems'
            ) {
              return [null, []];
            }
            return [null, {}];
          },
        }),
      ],
    }),
  );

  return (
    <MockPrivyProvider
      value={{
        ready: true,
        authenticated: isAuthenticated,
        user: auth?.fullName ? buildMockPrivyUser(auth.fullName) : null,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          <OriginProvider originInfo={namefiOrigin}>
            <NuqsAdapter>
              <ConsentManagerProvider options={{ mode: 'offline' }}>
                <StorybookAuthProvider isAuthenticated={isAuthenticated}>
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
  auth?: StoryAuthState;
  mobileDrawerOpen?: boolean;
};

function SidebarVersionShell({
  auth,
  mobileDrawerOpen = false,
}: SidebarVersionShellProps) {
  return (
    <StoryProviders auth={auth}>
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

export const SignedInShortName: Story = {
  args: {
    auth: {
      fullName: 'Ada Lovelace',
    },
  },
};

export const SignedInLongFirstName: Story = {
  args: {
    auth: {
      fullName: 'Alexander Hamilton',
    },
  },
};

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
