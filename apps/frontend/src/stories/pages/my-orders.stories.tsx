import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import OrdersPage from '@/app/orders/page';
import type { OriginRuntime } from '@/lib/origin/types';
import { FreeMintsGuidanceProvider } from '@/components/providers/free-mints-guidance';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { OriginProvider } from '@/components/providers/origin';
import { CartProvider } from '@/components/providers/cart';
import { WishlistProvider } from '@/components/providers/wishlist';
import { SidebarProvider } from '@namefi-astra/ui/components/shadcn/sidebar';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { type ReactNode, createContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCProvider } from '@/lib/trpc';
import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '@/lib/trpc';
import type { OrderItemSelect } from '@namefi-astra/common/contract/entity-schemas';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { createMockLink } from '@/lib/mock/trpc';
import ReactQueryDevtoolsWrapper from '@/components/react-query-devtools-lazy';
import { MockPrivyProvider } from '@/lib/mock/privy';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';

const mockOriginRuntime: OriginRuntime = {
  isFirstPartyOrigin: true,
  thirdPartyHostname: null,
  origin: 'https://astra.namefi.io',
  config: {
    metadata: {
      title: 'Tokenized domains for the future internet - Namefi',
      description:
        'Namefi is an ICANN Accredited Registrar tokenizing internet domain names for trading, DeFi and future of Internet.',
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

type OrderItem = OrderItemSelect;

const mockOrderItems: OrderItem[] = [
  {
    id: '1',
    orderId: 'order-1',
    normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
    amountInUSDCents: 1299,
    durationInYears: 1,
    type: 'REGISTER',
    registrar: 'DynadotGdg',
    status: 'SUCCEEDED',
    createdAt: new Date('2026-01-15T10:30:00Z'),
    updatedAt: new Date('2026-01-15T10:35:00Z'),
    startedAt: new Date('2026-01-15T10:30:00Z'),
    finishedAt: new Date('2026-01-15T10:35:00Z'),
    encryptionKeyId: null,
    encryptedEppAuthorizationCode: null,
    metadata: {},
  },
  {
    id: '2',
    orderId: 'order-2',
    normalizedDomainName: 'mywebsite.io' as NamefiNormalizedDomain,
    amountInUSDCents: 3999,
    durationInYears: 2,
    type: 'REGISTER',
    registrar: 'DynadotGdg',
    status: 'PROCESSING',
    createdAt: new Date('2026-01-20T14:00:00Z'),
    updatedAt: new Date('2026-01-20T14:00:00Z'),
    startedAt: new Date('2026-01-20T14:00:00Z'),
    finishedAt: new Date('2026-01-20T14:00:00Z'),
    encryptionKeyId: null,
    encryptedEppAuthorizationCode: null,
    metadata: {},
  },
  {
    id: '3',
    orderId: 'order-3',
    normalizedDomainName: 'blockchain.xyz' as NamefiNormalizedDomain,
    amountInUSDCents: 2499,
    durationInYears: 1,
    type: 'IMPORT',
    registrar: 'R53',
    status: 'FAILED',
    createdAt: new Date('2026-01-10T08:15:00Z'),
    updatedAt: new Date('2026-01-10T08:20:00Z'),
    startedAt: new Date('2026-01-10T08:15:00Z'),
    finishedAt: new Date('2026-01-10T08:20:00Z'),
    encryptionKeyId: null,
    encryptedEppAuthorizationCode: null,
    metadata: {},
  },
  {
    id: '4',
    orderId: 'order-4',
    normalizedDomainName: 'coolstartup.dev' as NamefiNormalizedDomain,
    amountInUSDCents: 1599,
    durationInYears: 1,
    type: 'RENEW',
    registrar: 'DynadotRegular',
    status: 'SUCCEEDED',
    createdAt: new Date('2026-01-25T16:45:00Z'),
    updatedAt: new Date('2026-01-25T16:50:00Z'),
    startedAt: new Date('2026-01-25T16:45:00Z'),
    finishedAt: new Date('2026-01-25T16:50:00Z'),
    encryptionKeyId: null,
    encryptedEppAuthorizationCode: null,
    metadata: {},
  },
];

type MockAuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  orderItems: OrderItem[];
  isOrdersLoading: boolean;
};

const MockAuthContext = createContext<MockAuthState>({
  isAuthenticated: true,
  isLoading: false,
  orderItems: [],
  isOrdersLoading: false,
});

function createMockQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Number.POSITIVE_INFINITY,
      },
    },
  });

  return queryClient;
}

function MockTrpcProvider({
  children,
  mockState,
}: {
  children: ReactNode;
  mockState: MockAuthState;
}) {
  const queryClient = createMockQueryClient();
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      createMockLink({
        isAuthenticated: mockState.isAuthenticated,
        getMockData: (options) => {
          if (options.op.path === 'orders.getOrderItems') {
            if (mockState.isOrdersLoading || mockState.isLoading) {
              return new Promise<any>(() => {});
            }
            return Promise.resolve([null, mockState.orderItems] as const);
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
        <MockAuthContext.Provider value={mockState}>
          {children}
        </MockAuthContext.Provider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}

function StoryProviders({
  children,
  origin,
  mockState,
}: {
  children: ReactNode;
  origin: OriginRuntime;
  mockState: MockAuthState;
}) {
  return (
    <MockPrivyProvider
      value={{
        ready: !mockState.isLoading,
        authenticated: mockState.isAuthenticated,
      }}
    >
      <AdminFeatureFlagsProvider>
        <OriginProvider originInfo={origin}>
          <MockTrpcProvider mockState={mockState}>
            <NuqsAdapter>
              <ConsentManagerProvider options={{ mode: 'offline' }}>
                <PreAuthSignalsProvider>
                  <InteractionLoggersProvider>
                    <WishlistProvider>
                      <CartProvider>
                        <SidebarProvider defaultOpen={false}>
                          <FreeMintsGuidanceProvider>
                            {children}
                          </FreeMintsGuidanceProvider>
                        </SidebarProvider>
                      </CartProvider>
                    </WishlistProvider>
                  </InteractionLoggersProvider>
                </PreAuthSignalsProvider>
              </ConsentManagerProvider>
            </NuqsAdapter>
          </MockTrpcProvider>
        </OriginProvider>
      </AdminFeatureFlagsProvider>
    </MockPrivyProvider>
  );
}

const defaultMockState: MockAuthState = {
  isAuthenticated: true,
  isLoading: false,
  orderItems: mockOrderItems,
  isOrdersLoading: false,
};

type StoryArgs = {
  mockState?: MockAuthState;
};

const meta: Meta<StoryArgs> = {
  title: 'Pages/My Orders',
  component: OrdersPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/orders',
      },
    },
  },
  argTypes: {
    mockState: {
      control: 'object',
      description: 'Mock authentication and data state',
    },
  },
  render: (args) => (
    <StoryProviders
      origin={mockOriginRuntime}
      mockState={args.mockState ?? defaultMockState}
    >
      <ReactQueryDevtoolsWrapper />

      <OrdersPage />
    </StoryProviders>
  ),
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const WithOrders: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      orderItems: mockOrderItems,
      isOrdersLoading: false,
    },
  },
};

export const EmptyState: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      orderItems: [],
      isOrdersLoading: false,
    },
  },
};

export const Loading: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: true,
      orderItems: [],
      isOrdersLoading: true,
    },
  },
};

export const Unauthenticated: Story = {
  args: {
    mockState: {
      isAuthenticated: false,
      isLoading: false,
      orderItems: [],
      isOrdersLoading: false,
    },
  },
};

export const MixedStatuses: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      orderItems: [
        {
          id: '1',
          orderId: 'order-1',
          normalizedDomainName: 'success-domain.com' as NamefiNormalizedDomain,
          amountInUSDCents: 1299,
          durationInYears: 1,
          type: 'REGISTER' as const,
          registrar: 'DynadotGdg',
          status: 'SUCCEEDED' as const,
          createdAt: new Date('2026-01-15T10:30:00Z'),
          updatedAt: new Date('2026-01-15T10:35:00Z'),
          startedAt: new Date('2026-01-15T10:30:00Z'),
          finishedAt: new Date('2026-01-15T10:35:00Z'),
          encryptionKeyId: null,
          encryptedEppAuthorizationCode: null,
          metadata: {},
        },
        {
          id: '2',
          orderId: 'order-2',
          normalizedDomainName:
            'processing-domain.io' as NamefiNormalizedDomain,
          amountInUSDCents: 2999,
          durationInYears: 1,
          type: 'REGISTER' as const,
          registrar: 'DynadotGdg',
          status: 'PROCESSING' as const,
          createdAt: new Date('2026-01-20T14:00:00Z'),
          updatedAt: new Date('2026-01-20T14:00:00Z'),
          startedAt: new Date('2026-01-20T14:00:00Z'),
          finishedAt: new Date('2026-01-20T14:00:00Z'),
          encryptionKeyId: null,
          encryptedEppAuthorizationCode: null,
          metadata: {},
        },
        {
          id: '3',
          orderId: 'order-3',
          normalizedDomainName: 'failed-domain.xyz' as NamefiNormalizedDomain,
          amountInUSDCents: 1999,
          durationInYears: 1,
          type: 'IMPORT' as const,
          registrar: 'R53',
          status: 'FAILED' as const,
          createdAt: new Date('2026-01-10T08:15:00Z'),
          updatedAt: new Date('2026-01-10T08:20:00Z'),
          startedAt: new Date('2026-01-10T08:15:00Z'),
          finishedAt: new Date('2026-01-10T08:20:00Z'),
          encryptionKeyId: null,
          encryptedEppAuthorizationCode: null,
          metadata: {},
        },
        {
          id: '4',
          orderId: 'order-4',
          normalizedDomainName: 'created-domain.dev' as NamefiNormalizedDomain,
          amountInUSDCents: 1599,
          durationInYears: 1,
          type: 'RENEW' as const,
          registrar: 'DynadotRegular',
          status: 'CREATED' as const,
          createdAt: new Date('2026-01-25T16:45:00Z'),
          updatedAt: new Date('2026-01-25T16:50:00Z'),
          startedAt: new Date('2026-01-25T16:45:00Z'),
          finishedAt: new Date('2026-01-25T16:50:00Z'),
          encryptionKeyId: null,
          encryptedEppAuthorizationCode: null,
          metadata: {},
        },
      ],
      isOrdersLoading: false,
    },
  },
};
