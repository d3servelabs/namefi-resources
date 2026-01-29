import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { OrderDetailsContent } from '@/components/orders/order-details-content';
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
import { createContext } from 'react';
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
  refunds?: Array<{
    refundId: string;
    status: string;
    amountInUSDCents: number;
    chainId?: number | null;
    txHash?: string | null;
    walletAddress?: string | null;
  }>;
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
        getMockData: (options) => {
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

          if (path === 'orders.getPaymentRefunds') {
            return Promise.resolve([null, mockState.refunds ?? []] as const);
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

function createMockOrder(overrides: Partial<OrderSelect> = {}): OrderSelect {
  return {
    id: 'order-123456',
    userId: mockUser.id,
    amountInUSDCents: 2999,
    status: 'SUCCEEDED',
    nftWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    nftChainId: 8453,
    metadata: undefined,
    createdAt: new Date('2026-01-15T10:30:00Z'),
    updatedAt: new Date('2026-01-15T10:35:00Z'),
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
    status: 'SUCCEEDED',
    encryptionKeyId: null,
    encryptedEppAuthorizationCode: null,
    metadata: undefined,
    createdAt: new Date('2026-01-15T10:30:00Z'),
    updatedAt: new Date('2026-01-15T10:35:00Z'),
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

function OrderDetailsPageWrapper({ mockState }: StoryArgs) {
  return (
    <StoryProviders
      origin={mockOriginRuntime}
      mockState={mockState ?? defaultMockState}
    >
      <ReactQueryDevtoolsWrapper />
      <OrderDetailsContent id="order-123456" />
    </StoryProviders>
  );
}

const meta: Meta<typeof OrderDetailsPageWrapper> = {
  title: 'Pages/Order Details',
  component: OrderDetailsPageWrapper,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/orders/[id]/details',
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

export const Loading: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: true,
      orderDetails: null,
      isOrderLoading: true,
    },
  },
};

export const NotFound: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      orderDetails: null,
      isOrderLoading: false,
      error: 'NOT_FOUND',
    },
  },
};

export const Unauthorized: Story = {
  args: {
    mockState: {
      isAuthenticated: false,
      isLoading: false,
      orderDetails: null,
      isOrderLoading: false,
      error: 'UNAUTHORIZED',
    },
  },
};

export const SuccessfulRegistration: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      orderDetails: {
        order: createMockOrder({
          status: 'SUCCEEDED',
          metadata: {
            mintTransactions: {
              'item-1': {
                txHash:
                  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                recordedAt: '2026-01-15T10:35:00Z',
              },
            },
          },
        }),
        items: [
          createMockOrderItem({
            status: 'SUCCEEDED',
            metadata: {
              mintTransaction: {
                txHash:
                  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                recordedAt: '2026-01-15T10:35:00Z',
              },
            },
          }),
        ],
        payments: [createMockPayment({ status: 'SUCCEEDED' })],
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

export const ImportInProgress: Story = {
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

export const PartiallyCompleted: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      orderDetails: {
        order: createMockOrder({
          status: 'PARTIALLY_COMPLETED',
          amountInUSDCents: 8997,
        }),
        items: [
          createMockOrderItem({
            id: 'item-1',
            normalizedDomainName:
              'success-domain.com' as NamefiNormalizedDomain,
            type: 'REGISTER',
            status: 'SUCCEEDED',
            amountInUSDCents: 2999,
            metadata: {
              mintTransaction: {
                txHash:
                  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                recordedAt: '2026-01-15T10:35:00Z',
              },
            },
          }),
          createMockOrderItem({
            id: 'item-2',
            normalizedDomainName: 'failed-domain.io' as NamefiNormalizedDomain,
            type: 'REGISTER',
            status: 'FAILED',
            amountInUSDCents: 2999,
          }),
          createMockOrderItem({
            id: 'item-3',
            normalizedDomainName:
              'another-success.net' as NamefiNormalizedDomain,
            type: 'RENEW',
            status: 'SUCCEEDED',
            amountInUSDCents: 2999,
            metadata: {
              mintTransaction: {
                txHash:
                  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                recordedAt: '2026-01-15T10:36:00Z',
              },
            },
          }),
        ],
        payments: [
          createMockPayment({
            status: 'SUCCEEDED',
            amountInUSDCents: 8997,
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
      refunds: [
        {
          refundId: 'refund-1',
          status: 'SUCCEEDED',
          amountInUSDCents: 2999,
          chainId: null,
          txHash: null,
          walletAddress: null,
        },
      ],
    },
  },
};

export const MultiplePayments: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      orderDetails: {
        order: createMockOrder({
          status: 'SUCCEEDED',
          amountInUSDCents: 9999,
        }),
        items: [
          createMockOrderItem({
            id: 'item-1',
            normalizedDomainName:
              'premium-domain.com' as NamefiNormalizedDomain,
            type: 'REGISTER',
            status: 'SUCCEEDED',
            amountInUSDCents: 9999,
            metadata: {
              mintTransaction: {
                txHash:
                  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                recordedAt: '2026-01-15T10:35:00Z',
              },
            },
          }),
        ],
        payments: [
          createMockPayment({
            id: 'payment-1',
            status: 'SUCCEEDED',
            amountInUSDCents: 5000,
            paymentProvider: 'STRIPE',
          }),
          createMockPayment({
            id: 'payment-2',
            status: 'SUCCEEDED',
            amountInUSDCents: 4999,
            paymentProvider: 'NFSC_BASE',
            nfscPaymentDetails: {
              chainId: 8453,
              walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
            },
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
        {
          paymentId: 'payment-2',
          isOnChainPayment: true,
          txHash:
            '0x9999999999999999999999999999999999999999999999999999999999999999',
          chainId: 8453,
          walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
        },
      ],
    },
  },
};

export const FailedOrder: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      orderDetails: {
        order: createMockOrder({
          status: 'FAILED',
        }),
        items: [
          createMockOrderItem({
            status: 'FAILED',
          }),
        ],
        payments: [
          createMockPayment({
            status: 'REFUND_REQUESTED',
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
      refunds: [
        {
          refundId: 'refund-1',
          status: 'SUCCEEDED',
          amountInUSDCents: 2999,
          chainId: null,
          txHash: null,
          walletAddress: null,
        },
      ],
    },
  },
};

export const MixedImportAndRegister: Story = {
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

export const SingleImport: Story = {
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

export const SingleRegistration: Story = {
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
