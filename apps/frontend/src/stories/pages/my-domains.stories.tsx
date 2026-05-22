import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import MyDomainsPage from '@/app/domains/page';
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
import {
  type ReactNode,
  createContext,
  Component,
  type ErrorInfo,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCProvider } from '@/lib/trpc';
import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '@/lib/trpc';
import type { AppRouterOutput } from '@/lib/trpc';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { createMockLink } from '@/lib/mock/trpc';
import ReactQueryDevtoolsWrapper from '@/components/react-query-devtools-lazy';
import { MockPrivyProvider } from '@/lib/mock/privy';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
import type { OrderItemSelect } from '@namefi-astra/common/contract/entity-schemas';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class StoryErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Story error boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

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

type DomainRow = AppRouterOutput['users']['getCurrentUserDomains'][number];

const mockDomains: DomainRow[] = [
  {
    normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
    ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    chainId: 1,
    tokenId: 12345678901234567890n,
    expirationDate: new Date('2027-06-15T00:00:00Z'),
    autoRenewEnabled: true,
    autoEnsEnabled: false,
    dnssecEnabled: false,
    orderId: null,
    dateTokenized: new Date('2025-06-15T10:30:00Z'),
    dnsStatus: {
      nameservers: ['ns1.namefi.io', 'ns2.namefi.io'],
      isUsingNamefiNameservers: true,
      isParkingEnabled: false,
      forwardTo: null,
      hasWebRecords: true,
      hasMxRecords: false,
      hasEffectiveWebPresence: true,
    },
  },
  {
    normalizedDomainName: 'mywebsite.io' as NamefiNormalizedDomain,
    ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    chainId: 1,
    tokenId: 98765432109876543210n,
    expirationDate: new Date('2026-03-20T00:00:00Z'),
    autoRenewEnabled: false,
    autoEnsEnabled: true,
    dnssecEnabled: false,
    orderId: null,
    dateTokenized: new Date('2025-03-20T14:00:00Z'),
    dnsStatus: {
      nameservers: ['ns1.namefi.io', 'ns2.namefi.io'],
      isUsingNamefiNameservers: true,
      isParkingEnabled: true,
      forwardTo: null,
      hasWebRecords: false,
      hasMxRecords: true,
      hasEffectiveWebPresence: true,
    },
  },
  {
    normalizedDomainName: 'blockchain.xyz' as NamefiNormalizedDomain,
    ownerAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    chainId: 8453,
    tokenId: 11111111111111111111n,
    expirationDate: new Date('2026-12-01T00:00:00Z'),
    autoRenewEnabled: true,
    autoEnsEnabled: false,
    dnssecEnabled: false,
    orderId: null,
    dateTokenized: new Date('2025-12-01T08:15:00Z'),
    dnsStatus: {
      nameservers: ['ns1.external.com', 'ns2.external.com'],
      isUsingNamefiNameservers: false,
      isParkingEnabled: false,
      forwardTo: 'https://mysite.com',
      hasWebRecords: true,
      hasMxRecords: true,
      hasEffectiveWebPresence: true,
    },
  },
  {
    normalizedDomainName: 'coolstartup.dev' as NamefiNormalizedDomain,
    ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    chainId: 1,
    tokenId: 22222222222222222222n,
    expirationDate: new Date('2028-01-25T00:00:00Z'),
    autoRenewEnabled: false,
    autoEnsEnabled: false,
    dnssecEnabled: false,
    orderId: null,
    dateTokenized: new Date('2026-01-25T16:45:00Z'),
    dnsStatus: {
      nameservers: ['ns1.namefi.io', 'ns2.namefi.io'],
      isUsingNamefiNameservers: true,
      isParkingEnabled: false,
      forwardTo: null,
      hasWebRecords: false,
      hasMxRecords: false,
      hasEffectiveWebPresence: false,
    },
  },
];

const mockOrderItems: OrderItemSelect[] = [
  {
    id: '1',
    orderId: 'order-1',
    normalizedDomainName: 'pending-domain.com' as NamefiNormalizedDomain,
    amountInUSDCents: 1299,
    durationInYears: 1,
    type: 'REGISTER',
    registrar: 'DynadotGdg',
    status: 'PROCESSING',
    createdAt: new Date('2026-01-28T10:30:00Z'),
    updatedAt: new Date('2026-01-28T10:30:00Z'),
    startedAt: new Date('2026-01-28T10:30:00Z'),
    finishedAt: new Date('2026-01-28T10:30:00Z'),
    encryptionKeyId: null,
    encryptedEppAuthorizationCode: null,
    metadata: {},
  },
];

const mockTldPricing = {
  com: { renewalPriceUsdPerYear: 12.99 },
  io: { renewalPriceUsdPerYear: 39.99 },
  xyz: { renewalPriceUsdPerYear: 9.99 },
  dev: { renewalPriceUsdPerYear: 15.99 },
};

type MockAuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  domains: DomainRow[];
  orderItems: OrderItemSelect[];
  isDomainsLoading: boolean;
  hasError: boolean;
};

const MockAuthContext = createContext<MockAuthState>({
  isAuthenticated: true,
  isLoading: false,
  domains: [],
  orderItems: [],
  isDomainsLoading: false,
  hasError: false,
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
  mockState: MockAuthState;
}) {
  const queryClient = createMockQueryClient();
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      createMockLink({
        isAuthenticated: mockState.isAuthenticated,
        getMockData: (options) => {
          if (options.op.path === 'users.getCurrentUserDomains') {
            if (mockState.isDomainsLoading || mockState.isLoading) {
              return new Promise<never>(() => {});
            }
            if (mockState.hasError) {
              return Promise.resolve([
                {
                  textCode: 'INTERNAL_SERVER_ERROR',
                  httpStatus: 500,
                  message: 'Failed to fetch domains',
                },
                null,
              ] as const);
            }
            return Promise.resolve([null, mockState.domains] as const);
          }
          if (options.op.path === 'orders.getOrderItems') {
            if (mockState.isDomainsLoading || mockState.isLoading) {
              return new Promise<never>(() => {});
            }
            return Promise.resolve([null, mockState.orderItems] as const);
          }
          if (options.op.path === 'registry.getTldPricing') {
            return Promise.resolve([null, mockTldPricing] as const);
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

const defaultMockState: MockAuthState = {
  isAuthenticated: true,
  isLoading: false,
  domains: mockDomains,
  orderItems: [],
  isDomainsLoading: false,
  hasError: false,
};

type StoryArgs = {
  mockState?: MockAuthState;
};

const meta: Meta<StoryArgs> = {
  title: 'Pages/My Domains',
  component: MyDomainsPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/domains',
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
      <MyDomainsPage />
    </StoryProviders>
  ),
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      domains: mockDomains,
      orderItems: [],
      isDomainsLoading: false,
      hasError: false,
    },
  },
};

export const WithProcessingOrders: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      domains: mockDomains,
      orderItems: mockOrderItems,
      isDomainsLoading: false,
      hasError: false,
    },
  },
};

export const Loading: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: true,
      domains: [],
      orderItems: [],
      isDomainsLoading: true,
      hasError: false,
    },
  },
};

export const Empty: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      domains: [],
      orderItems: [],
      isDomainsLoading: false,
      hasError: false,
    },
  },
};

export const ErrorState: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      domains: [],
      orderItems: [],
      isDomainsLoading: false,
      hasError: true,
    },
  },
  render: (args) => (
    <StoryProviders
      origin={mockOriginRuntime}
      mockState={args.mockState ?? defaultMockState}
    >
      <ReactQueryDevtoolsWrapper />
      <StoryErrorBoundary
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <div className="text-destructive text-lg font-semibold mb-2">
              Failed to load domains
            </div>
            <div className="text-muted-foreground text-sm">
              An error occurred while fetching your domains. Please try again
              later.
            </div>
          </div>
        }
      >
        <MyDomainsPage />
      </StoryErrorBoundary>
    </StoryProviders>
  ),
};

export const Unauthenticated: Story = {
  args: {
    mockState: {
      isAuthenticated: false,
      isLoading: false,
      domains: [],
      orderItems: [],
      isDomainsLoading: false,
      hasError: false,
    },
  },
};

/** Domains with internationalized (punycode) names to verify i18n display */
export const PunycodeDomains: Story = {
  args: {
    mockState: {
      isAuthenticated: true,
      isLoading: false,
      domains: [
        {
          normalizedDomainName:
            'xn--fiq228c.com' as NamefiNormalizedDomain /* 中文.com */,
          ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
          chainId: 1,
          tokenId: 33333333333333333333n,
          expirationDate: new Date('2027-06-15T00:00:00Z'),
          autoRenewEnabled: true,
          autoEnsEnabled: false,
          dnssecEnabled: false,
          orderId: null,
          dateTokenized: new Date('2025-06-15T10:30:00Z'),
          dnsStatus: {
            nameservers: ['ns1.namefi.io', 'ns2.namefi.io'],
            isUsingNamefiNameservers: true,
            isParkingEnabled: false,
            forwardTo: null,
            hasWebRecords: true,
            hasMxRecords: false,
            hasEffectiveWebPresence: true,
          },
        },
        {
          normalizedDomainName:
            'xn--wgv71a.com' as NamefiNormalizedDomain /* 日本.com */,
          ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
          chainId: 1,
          tokenId: 44444444444444444444n,
          expirationDate: new Date('2026-08-20T00:00:00Z'),
          autoRenewEnabled: false,
          autoEnsEnabled: true,
          dnssecEnabled: false,
          orderId: null,
          dateTokenized: new Date('2025-08-20T14:00:00Z'),
          dnsStatus: {
            nameservers: ['ns1.namefi.io', 'ns2.namefi.io'],
            isUsingNamefiNameservers: true,
            isParkingEnabled: true,
            forwardTo: null,
            hasWebRecords: false,
            hasMxRecords: true,
            hasEffectiveWebPresence: true,
          },
        },
        {
          normalizedDomainName:
            'xn--mgbh0fb.com' as NamefiNormalizedDomain /* مثال.com */,
          ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
          chainId: 8453,
          tokenId: 55555555555555555555n,
          expirationDate: new Date('2027-01-10T00:00:00Z'),
          autoRenewEnabled: true,
          autoEnsEnabled: false,
          dnssecEnabled: false,
          orderId: null,
          dateTokenized: new Date('2026-01-10T08:15:00Z'),
          dnsStatus: {
            nameservers: ['ns1.namefi.io', 'ns2.namefi.io'],
            isUsingNamefiNameservers: true,
            isParkingEnabled: false,
            forwardTo: null,
            hasWebRecords: true,
            hasMxRecords: true,
            hasEffectiveWebPresence: true,
          },
        },
        {
          normalizedDomainName: 'regular-domain.com' as NamefiNormalizedDomain,
          ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
          chainId: 1,
          tokenId: 66666666666666666666n,
          expirationDate: new Date('2028-03-01T00:00:00Z'),
          autoRenewEnabled: false,
          autoEnsEnabled: false,
          dnssecEnabled: false,
          orderId: null,
          dateTokenized: new Date('2026-03-01T16:45:00Z'),
          dnsStatus: {
            nameservers: ['ns1.namefi.io', 'ns2.namefi.io'],
            isUsingNamefiNameservers: true,
            isParkingEnabled: false,
            forwardTo: null,
            hasWebRecords: false,
            hasMxRecords: false,
            hasEffectiveWebPresence: false,
          },
        },
      ],
      orderItems: [],
      isDomainsLoading: false,
      hasError: false,
    },
  },
};
