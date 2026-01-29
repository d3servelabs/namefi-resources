import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DnsOverviewPanel } from '@/components/domain-and-dns-managment/panels/dns/dns-overview-panel';
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
import { type ReactNode, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCProvider } from '@/lib/trpc';
import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '@namefi-astra/backend/trpc';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { createMockLink } from '@/lib/trpc/mock';
import { MockPrivy } from '@/hooks/use-auth';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
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

type MockDomainState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  domainName: NamefiNormalizedDomain;
  isExpired: boolean;
  canAttemptRenewal: boolean;
  domainExportEnabled: boolean;
  hasPendingTransfer: boolean;
};

const mockDomainSupportedFeatures = (state: MockDomainState) => ({
  features: {
    domainManagement: {
      enabled: true,
      config: {
        showPanel: true,
      },
    },
    nameserversManagement: {
      enabled: true,
      config: {
        showPanel: true,
      },
    },
    dnssecManagement: {
      enabled: true,
      config: {
        autoManaged: false,
        showPanel: true,
      },
    },
    domainPreferencesManagement: {
      enabled: true,
      config: {
        showPanel: true,
      },
    },
    domainExport: {
      enabled: state.domainExportEnabled,
      config: {
        showPanel: state.domainExportEnabled,
      },
    },
  },
  isInLateRenewalPeriod: state.isExpired,
  isInGraceRestorationPeriod: false,
  canAttemptRenewal: state.canAttemptRenewal,
});

const mockDomainPreferencesAndConfig = {
  autoRenewEnabled: true,
};

const mockDomainDetails = (domainName: string) => ({
  supportsDnssec: true,
  contacts: {
    registrantContact: {
      name: 'Domain Owner',
      organization: 'Namefi',
      email: 'owner@example.com',
      phone: '+1.5555555555',
      address: {
        street1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        countryCode: 'US',
      },
    },
  },
  contactsPrivacy: {
    registrantContact: 'CONTACT_PRIVACY_UNSPECIFIED',
  },
  nameservers: ['ns1.namefi.io', 'ns2.namefi.io'],
  registrarKey: 'DynadotGdg',
  expirationTime: new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000,
  ).toISOString(),
  domainName,
  creationTime: new Date('2024-01-01').toISOString(),
  autoRenewOption: 'AUTOMATIC',
});

const mockDomainExportDetails = (state: MockDomainState) => ({
  exportEnabled: state.domainExportEnabled,
  exportRequestedAt: null,
  exportApprovedAt: null,
  exportStatus: 'NOT_REQUESTED',
});

const mockDomainOwnerWallet = {
  ownerWalletAddress: MOCK_WALLET_ADDRESS,
};

const mockPendingTransfer = (state: MockDomainState) =>
  state.hasPendingTransfer
    ? {
        id: 'transfer-123',
        domainName: state.domainName,
        status: 'PENDING_APPROVAL',
        requestedAt: new Date().toISOString(),
      }
    : null;

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
  mockState: MockDomainState;
}) {
  const queryClient = createMockQueryClient();
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      createMockLink({
        isAuthenticated: mockState.isAuthenticated,
        getMockData: (options) => {
          if (mockState.isLoading) {
            return new Promise<any>(() => {});
          }

          switch (options.op.path) {
            case 'domainConfig.getDomainSupportedFeatures':
              return Promise.resolve([
                null,
                mockDomainSupportedFeatures(mockState),
              ] as const);
            case 'domainConfig.getDomainPreferencesAndConfig':
              return Promise.resolve([
                null,
                mockDomainPreferencesAndConfig,
              ] as const);
            case 'domainConfig.getDomainDetails':
              return Promise.resolve([
                null,
                mockDomainDetails(mockState.domainName),
              ] as const);
            case 'domainConfig.getDomainExportDetails':
              return Promise.resolve([
                null,
                mockDomainExportDetails(mockState),
              ] as const);
            case 'domainConfig.getDomainOwnerWallet':
              return Promise.resolve([null, mockDomainOwnerWallet] as const);
            case 'domainConfig.getPendingTransfer':
              return Promise.resolve([
                null,
                mockPendingTransfer(mockState),
              ] as const);
            default:
              return Promise.resolve([
                {
                  textCode: 'BAD_REQUEST',
                  httpStatus: 400,
                  message: `Unknown path: ${options.op.path}`,
                },
                null,
              ] as const);
          }
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

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
    </div>
  );
}

function StoryProviders({
  children,
  origin,
  mockState,
}: {
  children: ReactNode;
  origin: OriginRuntime;
  mockState: MockDomainState;
}) {
  return (
    <MockPrivy.Provider
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
                              <Suspense fallback={<LoadingFallback />}>
                                {children}
                              </Suspense>
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
    </MockPrivy.Provider>
  );
}

const defaultMockState: MockDomainState = {
  isAuthenticated: true,
  isLoading: false,
  domainName: 'example.com' as NamefiNormalizedDomain,
  isExpired: false,
  canAttemptRenewal: true,
  domainExportEnabled: true,
  hasPendingTransfer: false,
};

type StoryArgs = {
  mockState?: MockDomainState;
};

function DnsOverviewPanelStory({ mockState }: StoryArgs) {
  const state = mockState ?? defaultMockState;
  return (
    <StoryProviders origin={mockOriginRuntime} mockState={state}>
      <DnsOverviewPanel domain={state.domainName} />
    </StoryProviders>
  );
}

const meta: Meta<StoryArgs> = {
  title: 'Pages/Domain Overview',
  component: DnsOverviewPanelStory,
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/domains/example.com',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mockState: {
      control: 'object',
      description: 'Mock authentication and domain state',
    },
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  args: {
    mockState: defaultMockState,
  },
};

export const WithDifferentDomain: Story = {
  args: {
    mockState: {
      ...defaultMockState,
      domainName: 'mywebsite.io' as NamefiNormalizedDomain,
    },
  },
};

export const ExpiredDomain: Story = {
  args: {
    mockState: {
      ...defaultMockState,
      isExpired: true,
      canAttemptRenewal: true,
    },
  },
};

export const ExpiredDomainCannotRenew: Story = {
  args: {
    mockState: {
      ...defaultMockState,
      isExpired: true,
      canAttemptRenewal: false,
    },
  },
};

export const WithoutExportFeature: Story = {
  args: {
    mockState: {
      ...defaultMockState,
      domainExportEnabled: false,
    },
  },
};

export const WithPendingTransfer: Story = {
  args: {
    mockState: {
      ...defaultMockState,
      hasPendingTransfer: true,
    },
  },
};

export const Loading: Story = {
  args: {
    mockState: {
      ...defaultMockState,
      isLoading: true,
    },
  },
};
