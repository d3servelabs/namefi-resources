import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import OrderPage from '@/app/orders/[id]/page';
import type { OriginRuntime } from '@/lib/origin/types';
import { FreeMintsGuidanceProvider } from '@/components/providers/free-mints-guidance';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { OriginProvider } from '@/components/providers/origin';
import { CartProvider } from '@/components/providers/cart';
import { WishlistProvider } from '@/components/providers/wishlist';
import { SidebarProvider } from '@/components/ui/shadcn/sidebar';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { createContext, Suspense } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCProvider } from '@/lib/trpc';
import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '@namefi-astra/backend/trpc';
import type {
  OrderSelect,
  OrderItemSelect,
  PaymentSelect,
  UserSelect,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { createMockLink } from '@/lib/mock/trpc';
import type { ControlledLinkHandlerOptions } from '@samyx/trpc-utils';
import ReactQueryDevtoolsWrapper from '@/components/react-query-devtools-lazy';
import { MockPrivyProvider } from '@/lib/mock/privy';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
import { FeedbackProvider } from '@/components/providers/feedback';
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

const mockUser: UserSelect = {
  id: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
  primaryEmail: 'dev-team@d3serve.xyz',
  stripeCustomerId: 'cus_SEo212w712hXZm',
  privyUserId: 'did:privy:cmcjax6ya00123z0nch67ge9x',
  subscribeToEmails: true,
  lastSignInAt: new Date('2026-01-28T17:20:47.000Z'),
  lastAccessedSessionAt: new Date('2026-01-28T17:20:55.411Z'),
  createdAt: new Date('2025-05-02T14:18:18.531Z'),
  updatedAt: new Date('2026-01-28T17:22:15.729Z'),
};

type OrderDetails = {
  order: OrderSelect;
  items: OrderItemSelect[];
  payments: PaymentSelect[];
  user: UserSelect;
};

type MockState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  orderDetails: OrderDetails | null;
  isOrderLoading: boolean;
  error?: 'UNAUTHORIZED' | 'NOT_FOUND' | null;
  paymentMethodDetails?: Array<{
    paymentId: string;
    isOnChainPayment: boolean;
    brand?: string;
    last4?: string;
    txHash?: string | null;
    chainId?: number;
    walletAddress?: string;
  }>;
  orderProgress?: {
    state: {
      steps: Array<{
        id: string;
        status: 'pending' | 'in_progress' | 'completed' | 'failed';
      }>;
    };
  } | null;
};

const MockAuthContext = createContext<MockState>({
  isAuthenticated: true,
  isLoading: false,
  orderDetails: null,
  isOrderLoading: false,
});

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
  mockState: MockState;
}) {
  const queryClient = createMockQueryClient();
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      createMockLink({
        isAuthenticated: mockState.isAuthenticated,
        getMockData: (
          options: ControlledLinkHandlerOptions<unknown, unknown>,
        ) => {
          const path = options.op.path;

          if (path === 'orders.getOrder') {
            if (mockState.isOrderLoading || mockState.isLoading) {
              return new Promise<any>(() => {});
            }
            if (mockState.error === 'UNAUTHORIZED') {
              return Promise.resolve([
                {
                  textCode: 'UNAUTHORIZED',
                  httpStatus: 401,
                  message: 'You are not authorized to access this order',
                },
                null,
              ] as const);
            }
            if (mockState.error === 'NOT_FOUND' || !mockState.orderDetails) {
              return Promise.resolve([
                {
                  textCode: 'NOT_FOUND',
                  httpStatus: 404,
                  message: 'Order not found',
                },
                null,
              ] as const);
            }
            return Promise.resolve([null, mockState.orderDetails] as const);
          }

          if (path === 'orders.getPaymentMethodDetails') {
            const input = options.op.input as { paymentId: string };
            const paymentMethod = mockState.paymentMethodDetails?.find(
              (p) => p.paymentId === input.paymentId,
            );
            if (paymentMethod) {
              return Promise.resolve([null, paymentMethod] as const);
            }
            return Promise.resolve([
              null,
              { isOnChainPayment: false as const },
            ] as const);
          }

          if (path === 'orders.getOrderProgress') {
            if (mockState.orderProgress) {
              return Promise.resolve([null, mockState.orderProgress] as const);
            }
            return Promise.resolve([
              null,
              {
                state: {
                  steps: [
                    { id: 'order-details', status: 'completed' },
                    { id: 'payments', status: 'completed' },
                    { id: 'items', status: 'in_progress' },
                    { id: 'post-processing', status: 'pending' },
                    { id: 'final-status', status: 'pending' },
                  ],
                },
              },
            ] as const);
          }

          if (path === 'ai.getInternalGenerationsByDomains') {
            return Promise.resolve([null, []] as const);
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
  mockState: MockState;
}) {
  return (
    <MockPrivyProvider
      value={
        {
          ready: !mockState.isLoading,
          authenticated: mockState.isAuthenticated,
        } as any
      }
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
                        <CartProvider>
                          <SidebarProvider defaultOpen={false}>
                            <FreeMintsGuidanceProvider>
                              <FeedbackProvider>{children}</FeedbackProvider>
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
      </WagmiProvider>
    </MockPrivyProvider>
  );
}

function createMockOrder(overrides: Partial<OrderSelect> = {}): OrderSelect {
  return {
    id: 'order-123456',
    userId: mockUser.id,
    amountInUSDCents: 2999,
    status: 'PROCESSING',
    nftWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    nftChainId: 8453,
    metadata: undefined,
    createdAt: new Date('2026-01-15T10:30:00Z'),
    updatedAt: new Date('2026-01-15T10:35:00Z'),
    startedAt: new Date('2026-01-15T10:30:00Z'),
    finishedAt: new Date('2026-01-15T10:35:00Z'),
    ...overrides,
  };
}

function createMockOrderItem(
  overrides: Partial<OrderItemSelect> = {},
): OrderItemSelect {
  return {
    id: 'item-1',
    orderId: 'order-123456',
    normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
    amountInUSDCents: 2999,
    durationInYears: 1,
    type: 'REGISTER',
    registrar: 'DynadotGdg',
    status: 'PROCESSING',
    encryptionKeyId: null,
    encryptedEppAuthorizationCode: null,
    metadata: undefined,
    createdAt: new Date('2026-01-15T10:30:00Z'),
    updatedAt: new Date('2026-01-15T10:35:00Z'),
    startedAt: new Date('2026-01-28T10:30:00Z'),
    finishedAt: new Date('2026-01-28T10:30:00Z'),
    ...overrides,
  };
}

function createMockPayment(
  overrides: Partial<PaymentSelect> = {},
): PaymentSelect {
  return {
    id: 'payment-1',
    orderId: 'order-123456',
    amountInUSDCents: 2999,
    status: 'SUCCEEDED',
    paymentProvider: 'STRIPE',
    paymentProviderReferenceId: 'pi_1234567890',
    nfscPaymentDetails: null,
    stripePaymentDetails: null,
    createdAt: new Date('2026-01-15T10:30:00Z'),
    updatedAt: new Date('2026-01-15T10:35:00Z'),
    startedAt: new Date('2026-01-28T10:30:00Z'),
    finishedAt: new Date('2026-01-28T10:30:00Z'),
    metadata: null,
    ...overrides,
  };
}

const defaultMockState: MockState = {
  isAuthenticated: true,
  isLoading: false,
  orderDetails: {
    order: createMockOrder(),
    items: [createMockOrderItem()],
    payments: [createMockPayment()],
    user: mockUser,
  },
  isOrderLoading: false,
  paymentMethodDetails: [
    {
      paymentId: 'payment-1',
      isOnChainPayment: false,
      brand: 'visa',
      last4: '4242',
    },
  ],
};

type StoryArgs = {
  mockState?: MockState;
};

function OrderPendingPageWrapper({ mockState }: StoryArgs) {
  const paramsPromise = Promise.resolve({ id: 'order-123456' });

  return (
    <StoryProviders
      origin={mockOriginRuntime}
      mockState={mockState ?? defaultMockState}
    >
      <ReactQueryDevtoolsWrapper />
      <Suspense fallback={<div>Loading order...</div>}>
        <OrderPage params={paramsPromise} />
      </Suspense>
    </StoryProviders>
  );
}

const meta: Meta<typeof OrderPendingPageWrapper> = {
  title: 'Pages/Order Pending',
  component: OrderPendingPageWrapper,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/orders/[id]',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mockState: {
      control: 'object',
      description: 'Mock authentication and data state',
    },
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const SingleRegistrationPending: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      orderDetails: {
        order: createMockOrder({
          status: 'PROCESSING',
          amountInUSDCents: 1299,
        }),
        items: [
          createMockOrderItem({
            id: 'item-1',
            normalizedDomainName: 'my-new-domain.com' as NamefiNormalizedDomain,
            type: 'REGISTER',
            status: 'PROCESSING',
            amountInUSDCents: 1299,
          }),
        ],
        payments: [
          createMockPayment({
            status: 'SUCCEEDED',
            amountInUSDCents: 1299,
          }),
        ],
        user: mockUser,
      },
      isOrderLoading: false,
      paymentMethodDetails: [
        {
          paymentId: 'payment-1',
          isOnChainPayment: false,
          brand: 'visa',
          last4: '4242',
        },
      ],
    },
  },
};

export const SingleImportPending: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      orderDetails: {
        order: createMockOrder({
          status: 'PROCESSING',
          amountInUSDCents: 1999,
        }),
        items: [
          createMockOrderItem({
            id: 'item-1',
            normalizedDomainName:
              'my-imported-domain.com' as NamefiNormalizedDomain,
            type: 'IMPORT',
            status: 'PROCESSING',
            amountInUSDCents: 1999,
          }),
        ],
        payments: [
          createMockPayment({
            status: 'SUCCEEDED',
            amountInUSDCents: 1999,
          }),
        ],
        user: mockUser,
      },
      isOrderLoading: false,
      paymentMethodDetails: [
        {
          paymentId: 'payment-1',
          isOnChainPayment: false,
          brand: 'mastercard',
          last4: '5555',
        },
      ],
    },
  },
};

export const MultipleImportsPending: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      orderDetails: {
        order: createMockOrder({
          status: 'PROCESSING',
          amountInUSDCents: 5997,
        }),
        items: [
          createMockOrderItem({
            id: 'item-1',
            normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
            type: 'IMPORT',
            status: 'PROCESSING',
            amountInUSDCents: 1999,
          }),
          createMockOrderItem({
            id: 'item-2',
            normalizedDomainName: 'mydomain.io' as NamefiNormalizedDomain,
            type: 'IMPORT',
            status: 'PROCESSING',
            amountInUSDCents: 1999,
          }),
          createMockOrderItem({
            id: 'item-3',
            normalizedDomainName: 'business.net' as NamefiNormalizedDomain,
            type: 'IMPORT',
            status: 'PROCESSING',
            amountInUSDCents: 1999,
          }),
        ],
        payments: [
          createMockPayment({
            status: 'SUCCEEDED',
            amountInUSDCents: 5997,
          }),
        ],
        user: mockUser,
      },
      isOrderLoading: false,
      paymentMethodDetails: [
        {
          paymentId: 'payment-1',
          isOnChainPayment: false,
          brand: 'mastercard',
          last4: '5555',
        },
      ],
    },
  },
};

export const MixedImportAndRegisterPending: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      orderDetails: {
        order: createMockOrder({
          status: 'PROCESSING',
          amountInUSDCents: 7996,
        }),
        items: [
          createMockOrderItem({
            id: 'item-1',
            normalizedDomainName:
              'imported-domain.com' as NamefiNormalizedDomain,
            type: 'IMPORT',
            status: 'PROCESSING',
            amountInUSDCents: 1999,
          }),
          createMockOrderItem({
            id: 'item-2',
            normalizedDomainName: 'new-domain.io' as NamefiNormalizedDomain,
            type: 'REGISTER',
            status: 'PROCESSING',
            amountInUSDCents: 1999,
          }),
          createMockOrderItem({
            id: 'item-3',
            normalizedDomainName: 'another-new.net' as NamefiNormalizedDomain,
            type: 'REGISTER',
            status: 'PROCESSING',
            amountInUSDCents: 1999,
          }),
          createMockOrderItem({
            id: 'item-4',
            normalizedDomainName: 'third-new.org' as NamefiNormalizedDomain,
            type: 'REGISTER',
            status: 'PROCESSING',
            amountInUSDCents: 1999,
          }),
        ],
        payments: [
          createMockPayment({
            status: 'SUCCEEDED',
            amountInUSDCents: 7996,
          }),
        ],
        user: mockUser,
      },
      isOrderLoading: false,
      paymentMethodDetails: [
        {
          paymentId: 'payment-1',
          isOnChainPayment: false,
          brand: 'visa',
          last4: '4242',
        },
      ],
    },
  },
};

export const MultipleRegistrationsPending: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      orderDetails: {
        order: createMockOrder({
          status: 'PROCESSING',
          amountInUSDCents: 3897,
        }),
        items: [
          createMockOrderItem({
            id: 'item-1',
            normalizedDomainName: 'first-domain.com' as NamefiNormalizedDomain,
            type: 'REGISTER',
            status: 'PROCESSING',
            amountInUSDCents: 1299,
          }),
          createMockOrderItem({
            id: 'item-2',
            normalizedDomainName: 'second-domain.io' as NamefiNormalizedDomain,
            type: 'REGISTER',
            status: 'PROCESSING',
            amountInUSDCents: 1299,
          }),
          createMockOrderItem({
            id: 'item-3',
            normalizedDomainName: 'third-domain.net' as NamefiNormalizedDomain,
            type: 'REGISTER',
            status: 'PROCESSING',
            amountInUSDCents: 1299,
          }),
        ],
        payments: [
          createMockPayment({
            status: 'SUCCEEDED',
            amountInUSDCents: 3897,
          }),
        ],
        user: mockUser,
      },
      isOrderLoading: false,
      paymentMethodDetails: [
        {
          paymentId: 'payment-1',
          isOnChainPayment: false,
          brand: 'amex',
          last4: '1234',
        },
      ],
    },
  },
};

export const LoadingState: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: true,
      orderDetails: null,
      isOrderLoading: true,
    },
  },
};
