import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import AlternateCartPage from '@/app/cart/alternate';
import type { OriginRuntime } from '@/lib/origin/types';
import { FreeMintsGuidanceProvider } from '@/components/providers/free-mints-guidance';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { OriginProvider } from '@/components/providers/origin';
import { CartContext } from '@/components/providers/cart';
import { WishlistProvider } from '@/components/providers/wishlist';
import { SidebarProvider } from '@/components/ui/shadcn/sidebar';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCProvider } from '@/lib/trpc';
import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '@namefi-astra/backend/trpc';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { createMockLink } from '@/lib/mock/trpc';
import ReactQueryDevtoolsWrapper from '@/components/react-query-devtools-lazy';
import { MockPrivyProvider } from '@/lib/mock/privy';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
import type { UnifiedCartItem, UseCart } from '@/hooks/use-cart';
import { WagmiProvider } from 'wagmi';
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, base } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';

const MOCK_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';

const mockWagmiConfig = createConfig({
  chains: [mainnet, sepolia, base],
  connectors: [mock({ accounts: [MOCK_WALLET_ADDRESS as `0x${string}`] })],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
  },
});

const mockOriginRuntime: OriginRuntime = {
  isFirstPartyOrigin: true,
  thirdPartyHostname: null,
  origin: 'https://astra.namefi.io',
  config: {
    metadata: {
      title: 'Tokenized domains for the future internet - Namefi',
      description:
        'Namefi is an ICANN-accredited registrar that tokenizes DNS ownership so you can register, trade, and build with AI tooling and onchain security.',
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

const mockCartItems: UnifiedCartItem[] = [
  {
    id: 'cart-item-1',
    userId: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
    normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
    amountInUSDCents: 1299,
    durationInYears: 1,
    type: 'REGISTER',
    registrar: 'DynadotGdg',
    createdAt: new Date('2026-01-15T10:30:00Z'),
    updatedAt: new Date('2026-01-15T10:35:00Z'),
    encryptionKeyId: null,
    encryptedEppAuthorizationCode: null,
    metadata: null,
  },
  {
    id: 'cart-item-2',
    userId: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
    normalizedDomainName: 'mywebsite.io' as NamefiNormalizedDomain,
    amountInUSDCents: 3999,
    durationInYears: 2,
    type: 'REGISTER',
    registrar: 'DynadotGdg',
    createdAt: new Date('2026-01-20T14:00:00Z'),
    updatedAt: new Date('2026-01-20T14:00:00Z'),
    encryptionKeyId: null,
    encryptedEppAuthorizationCode: null,
    metadata: null,
  },
  {
    id: 'cart-item-3',
    userId: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
    normalizedDomainName: 'blockchain.xyz' as NamefiNormalizedDomain,
    amountInUSDCents: 2499,
    durationInYears: 1,
    type: 'IMPORT',
    registrar: 'R53',
    createdAt: new Date('2026-01-10T08:15:00Z'),
    updatedAt: new Date('2026-01-10T08:20:00Z'),
    encryptionKeyId: null,
    encryptedEppAuthorizationCode: null,
    metadata: null,
  },
];

function createMockDomainAvailabilityInfo(cartItems: UnifiedCartItem[]) {
  return cartItems.map((item) => ({
    domain: item.normalizedDomainName,
    available: item.type === 'REGISTER',
    registrarKey: item.registrar,
    pricing: {
      registerPriceInUsd: item.amountInUSDCents / 100,
      renewPriceInUsd: item.amountInUSDCents / 100,
      importPriceInUsd: item.amountInUSDCents / 100,
    },
  }));
}

type MockCartState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  cartItems: UnifiedCartItem[];
  isCartLoading: boolean;
};

function createMockQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Number.POSITIVE_INFINITY,
      },
    },
  });
}

function MockTrpcProvider({
  children,
  mockState,
}: {
  children: ReactNode;
  mockState: MockCartState;
}) {
  const [queryClient] = useState(() => createMockQueryClient());
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      createMockLink({
        isAuthenticated: mockState.isAuthenticated,
        getMockData: (options) => {
          if (options.op.path === 'carts.getItems') {
            if (mockState.isCartLoading || mockState.isLoading) {
              return new Promise<any>(() => {});
            }
            return Promise.resolve([null, mockState.cartItems] as const);
          }
          if (options.op.path === 'registry.getDomainListInfo') {
            return Promise.resolve([
              null,
              createMockDomainAvailabilityInfo(mockState.cartItems),
            ] as const);
          }
          if (
            options.op.path ===
            'orders.reflectChangesInCartItemsIfAnyAndReturnSummary'
          ) {
            return Promise.resolve([null, []] as const);
          }
          if (options.op.path === 'orders.createOrderV2') {
            return Promise.resolve([
              null,
              { id: 'mock-order-id', status: 'CREATED' },
            ] as const);
          }
          return Promise.resolve([
            {
              textCode: 'BAD_REQUEST',
              httpStatus: 400,
              message: 'unknown path',
            },
            null,
          ] as const);
        },
      }),
    ],
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}

function createMockCartContext(mockState: MockCartState): UseCart {
  return {
    cartData: mockState.cartItems,
    isCartLoading: mockState.isCartLoading,
    isCartUpdating: false,
    addItem: async () => mockState.cartItems,
    removeItem: async () => mockState.cartItems,
    updateItem: async () => mockState.cartItems[0],
    clearCart: async () => [],
    isDomainInCart: (domain: string) =>
      mockState.cartItems.some((item) => item.normalizedDomainName === domain),
    isDomainBusy: () => false,
    getCartItemId: (domain: string) =>
      mockState.cartItems.find((item) => item.normalizedDomainName === domain)
        ?.id,
    refetchCart: async () => {},
    clearLocalCart: () => {},
    busy: {
      busyIds: new Set<string>(),
      markBusy: () => {},
      clearBusy: () => {},
      isBusy: () => false,
    },
  };
}

function StoryProviders({
  children,
  origin,
  mockState,
}: {
  children: ReactNode;
  origin: OriginRuntime;
  mockState: MockCartState;
}) {
  const mockCartValue = createMockCartContext(mockState);

  return (
    <MockPrivyProvider
      value={{
        ready: !mockState.isLoading,
        authenticated: mockState.isAuthenticated,
      }}
    >
      <WagmiProvider config={mockWagmiConfig}>
        <AdminFeatureFlagsProvider>
          <OriginProvider originInfo={origin}>
            <MockTrpcProvider mockState={mockState}>
              <NuqsAdapter>
                <ConsentManagerProvider options={{ mode: 'offline' }}>
                  <PreAuthSignalsProvider>
                    <InteractionLoggersProvider>
                      <WishlistProvider>
                        <CartContext.Provider value={mockCartValue}>
                          <SidebarProvider defaultOpen={false}>
                            <FreeMintsGuidanceProvider>
                              {children}
                            </FreeMintsGuidanceProvider>
                          </SidebarProvider>
                        </CartContext.Provider>
                      </WishlistProvider>
                    </InteractionLoggersProvider>
                  </PreAuthSignalsProvider>
                </ConsentManagerProvider>
              </NuqsAdapter>
            </MockTrpcProvider>
          </OriginProvider>
        </AdminFeatureFlagsProvider>
      </WagmiProvider>
    </MockPrivyProvider>
  );
}

const defaultMockState: MockCartState = {
  isAuthenticated: true,
  isLoading: false,
  cartItems: mockCartItems,
  isCartLoading: false,
};

type StoryArgs = {
  mockState?: MockCartState;
};

const meta: Meta<StoryArgs> = {
  title: 'Pages/Cart Checkout',
  component: AlternateCartPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/cart',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mockState: {
      control: 'object',
      description: 'Mock authentication and cart state',
    },
  },
  render: (args) => (
    <StoryProviders
      origin={mockOriginRuntime}
      mockState={args.mockState ?? defaultMockState}
    >
      <ReactQueryDevtoolsWrapper />
      <AlternateCartPage />
    </StoryProviders>
  ),
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const WithItems: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      cartItems: mockCartItems,
      isCartLoading: false,
    },
  },
};

export const EmptyCart: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      cartItems: [],
      isCartLoading: false,
    },
  },
};

export const Loading: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: true,
      cartItems: [],
      isCartLoading: true,
    },
  },
};

export const Unauthenticated: Story = {
  args: {
    mockState: {
      isAuthenticated: false,
      isLoading: false,
      cartItems: mockCartItems,
      isCartLoading: false,
    },
  },
};

export const SingleItem: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      cartItems: [mockCartItems[0]],
      isCartLoading: false,
    },
  },
};

export const PromoItems: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      cartItems: [
        {
          id: 'promo-item-1',
          userId: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
          normalizedDomainName: 'free-domain.com' as NamefiNormalizedDomain,
          amountInUSDCents: 0,
          durationInYears: 1,
          type: 'REGISTER' as const,
          registrar: 'DynadotGdg',
          createdAt: new Date('2026-01-15T10:30:00Z'),
          updatedAt: new Date('2026-01-15T10:35:00Z'),
          encryptionKeyId: null,
          encryptedEppAuthorizationCode: null,
          metadata: null,
        },
      ],
      isCartLoading: false,
    },
  },
};

export const MixedOperationTypes: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      cartItems: [
        {
          id: 'register-item',
          userId: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
          normalizedDomainName: 'new-domain.com' as NamefiNormalizedDomain,
          amountInUSDCents: 1299,
          durationInYears: 1,
          type: 'REGISTER' as const,
          registrar: 'DynadotGdg',
          createdAt: new Date('2026-01-15T10:30:00Z'),
          updatedAt: new Date('2026-01-15T10:35:00Z'),
          encryptionKeyId: null,
          encryptedEppAuthorizationCode: null,
          metadata: null,
        },
        {
          id: 'import-item',
          userId: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
          normalizedDomainName: 'import-domain.io' as NamefiNormalizedDomain,
          amountInUSDCents: 2499,
          durationInYears: 1,
          type: 'IMPORT' as const,
          registrar: 'DynadotGdg',
          createdAt: new Date('2026-01-20T14:00:00Z'),
          updatedAt: new Date('2026-01-20T14:00:00Z'),
          encryptionKeyId: null,
          encryptedEppAuthorizationCode: null,
          metadata: null,
        },
        {
          id: 'renew-item',
          userId: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
          normalizedDomainName: 'renew-domain.xyz' as NamefiNormalizedDomain,
          amountInUSDCents: 1599,
          durationInYears: 2,
          type: 'RENEW' as const,
          registrar: 'R53',
          createdAt: new Date('2026-01-25T16:45:00Z'),
          updatedAt: new Date('2026-01-25T16:50:00Z'),
          encryptionKeyId: null,
          encryptedEppAuthorizationCode: null,
          metadata: null,
        },
      ],
      isCartLoading: false,
    },
  },
};

/** Cart with internationalized (punycode) domain names to verify i18n display */
export const PunycodeDomains: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      cartItems: [
        {
          id: 'idn-chinese',
          userId: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
          normalizedDomainName:
            'xn--fiq228c.com' as NamefiNormalizedDomain /* 中文.com */,
          amountInUSDCents: 1999,
          durationInYears: 1,
          type: 'REGISTER' as const,
          registrar: 'DynadotGdg',
          createdAt: new Date('2026-02-01T10:00:00Z'),
          updatedAt: new Date('2026-02-01T10:00:00Z'),
          encryptionKeyId: null,
          encryptedEppAuthorizationCode: null,
          metadata: null,
        },
        {
          id: 'idn-japanese',
          userId: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
          normalizedDomainName:
            'xn--wgv71a.com' as NamefiNormalizedDomain /* 日本.com */,
          amountInUSDCents: 2499,
          durationInYears: 1,
          type: 'REGISTER' as const,
          registrar: 'DynadotGdg',
          createdAt: new Date('2026-02-02T10:00:00Z'),
          updatedAt: new Date('2026-02-02T10:00:00Z'),
          encryptionKeyId: null,
          encryptedEppAuthorizationCode: null,
          metadata: null,
        },
        {
          id: 'idn-arabic',
          userId: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
          normalizedDomainName:
            'xn--mgbh0fb.com' as NamefiNormalizedDomain /* مثال.com */,
          amountInUSDCents: 1299,
          durationInYears: 1,
          type: 'IMPORT' as const,
          registrar: 'DynadotGdg',
          createdAt: new Date('2026-02-03T10:00:00Z'),
          updatedAt: new Date('2026-02-03T10:00:00Z'),
          encryptionKeyId: null,
          encryptedEppAuthorizationCode: null,
          metadata: null,
        },
        {
          id: 'ascii-domain',
          userId: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
          normalizedDomainName: 'regular-domain.com' as NamefiNormalizedDomain,
          amountInUSDCents: 999,
          durationInYears: 1,
          type: 'REGISTER' as const,
          registrar: 'DynadotGdg',
          createdAt: new Date('2026-02-04T10:00:00Z'),
          updatedAt: new Date('2026-02-04T10:00:00Z'),
          encryptionKeyId: null,
          encryptedEppAuthorizationCode: null,
          metadata: null,
        },
      ],
      isCartLoading: false,
    },
  },
};
