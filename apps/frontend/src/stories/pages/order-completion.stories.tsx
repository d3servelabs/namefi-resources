import type { Meta, StoryObj } from '@storybook/nextjs-vite';
// NOTE: importing a route module is allowed here only because
// `orders/[id]/page.tsx` is a `'use client'` component (sync, no server-only
// imports), so it renders in Storybook. If it ever drops `'use client'` or
// pulls in server-only code, this story will break — keep it a client page.
import OrderPage from '@/app/orders/[id]/page';
import type { OriginRuntime } from '@/lib/origin/types';
import { FreeMintsGuidanceProvider } from '@/components/providers/free-mints-guidance';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { OriginProvider } from '@/components/providers/origin';
import { CartProvider } from '@/components/providers/cart';
import { WishlistProvider } from '@/components/providers/wishlist';
import { SidebarProvider } from '@namefi-astra/ui/components/shadcn/sidebar';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { OpenFeatureTestProvider } from '@openfeature/react-sdk';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCProvider } from '@/lib/trpc';
import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '@/lib/trpc';
import type {
  OrderSelect,
  OrderItemSelect,
  PaymentSelect,
  UserSelect,
} from '@namefi-astra/common/contract/entity-schemas';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { createMockLink } from '@/lib/mock/trpc';
import type { ControlledLinkHandlerOptions } from '@samyx/trpc-utils';
import { MockPrivyProvider } from '@/lib/mock/privy';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
import { FeedbackProvider } from '@/components/providers/feedback';
import { WagmiProvider } from 'wagmi';
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, base } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';
import { StorybookAuthProvider } from '../utils/storybook-auth-provider';

// Matches the linked wallet on MockPrivyProvider's default user, so the mocked
// `useUserWalletAddresses` (src/lib/mock) resolves this order's recipient as
// "self" and the self-recipient sections (listing, finishing-up) render.
const MOCK_STORY_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

const mockWagmiConfig = createConfig({
  chains: [mainnet, sepolia, base],
  connectors: [mock({ accounts: [MOCK_STORY_WALLET as `0x${string}`] })],
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
  preferences: { defaultAutoEns: true, defaultAutoRenew: true },
};

/** A domain the recipient wallet owns on-chain (minted + indexed). */
type OwnedDomain = {
  normalizedDomainName: string;
  chainId: number;
  tokenId: string;
};

type OrderDetails = {
  order: OrderSelect;
  items: OrderItemSelect[];
  payments: PaymentSelect[];
  user: UserSelect;
};

type MockState = {
  orderDetails: OrderDetails;
  /** Domains shown as owned on-chain — drives "List for Sale" + minting state. */
  ownedDomains: OwnedDomain[];
  /** Whether DNSSEC still has an active workflow (the demoted finishing-up row). */
  dnssecActive: boolean;
};

function createMockQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
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
        isAuthenticated: true,
        getMockData: (
          options: ControlledLinkHandlerOptions<unknown, unknown>,
        ) => {
          const path = options.op.path;

          if (path === 'orders.getOrder') {
            return Promise.resolve([null, mockState.orderDetails] as const);
          }

          if (path === 'orders.getOrderProgress') {
            return Promise.resolve([
              null,
              {
                state: {
                  steps: [
                    { id: 'order-details', status: 'completed' },
                    { id: 'payments', status: 'completed' },
                    { id: 'items', status: 'completed' },
                    { id: 'post-processing', status: 'completed' },
                    { id: 'final-status', status: 'completed' },
                  ],
                },
              },
            ] as const);
          }

          if (path === 'orders.getPaymentMethodDetails') {
            return Promise.resolve([
              null,
              {
                isOnChainPayment: false as const,
                brand: 'visa',
                last4: '4242',
              },
            ] as const);
          }

          // Indexer truth: which domains the recipient owns on-chain. Gates the
          // "List for Sale" CTA and clears the "Minting your NFT" indicator.
          if (path === 'registry.getDomainsByOwner') {
            return Promise.resolve([
              null,
              { domains: mockState.ownedDomains },
            ] as const);
          }

          if (
            path === 'domainConfig.dnssec.getActiveDnssecOperationWorkflows'
          ) {
            return Promise.resolve([
              null,
              { hasActiveWorkflow: mockState.dnssecActive },
            ] as const);
          }

          if (path === 'ai.getInternalGenerationsByDomains') {
            return Promise.resolve([null, []] as const);
          }

          // Everything else the page shell touches (notifications, sidebar
          // domains, etc.) is non-essential to this view — fail soft.
          return Promise.resolve([
            { textCode: 'BAD_REQUEST', httpStatus: 400, message: 'unmocked' },
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

function StoryProviders({
  children,
  mockState,
}: {
  children: ReactNode;
  mockState: MockState;
}) {
  return (
    <MockPrivyProvider value={{ ready: true, authenticated: true } as any}>
      <WagmiProvider config={mockWagmiConfig}>
        <AdminFeatureFlagsProvider>
          <OpenFeatureTestProvider
            flagValueMap={{ 'marketplace-listings': true }}
          >
            <OriginProvider originInfo={mockOriginRuntime}>
              <MockTrpcProvider mockState={mockState}>
                <NuqsAdapter>
                  <ConsentManagerProvider options={{ mode: 'offline' }}>
                    <StorybookAuthProvider isAuthenticated>
                      <PreAuthSignalsProvider>
                        <InteractionLoggersProvider>
                          <WishlistProvider>
                            <CartProvider>
                              <SidebarProvider defaultOpen={false}>
                                <FreeMintsGuidanceProvider>
                                  <FeedbackProvider>
                                    {children}
                                  </FeedbackProvider>
                                </FreeMintsGuidanceProvider>
                              </SidebarProvider>
                            </CartProvider>
                          </WishlistProvider>
                        </InteractionLoggersProvider>
                      </PreAuthSignalsProvider>
                    </StorybookAuthProvider>
                  </ConsentManagerProvider>
                </NuqsAdapter>
              </MockTrpcProvider>
            </OriginProvider>
          </OpenFeatureTestProvider>
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
    status: 'SUCCEEDED',
    // Equals the mocked wallet so the recipient resolves as "self".
    nftWalletAddress: MOCK_STORY_WALLET,
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
    normalizedDomainName: 'mybrand.xyz' as NamefiNormalizedDomain,
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
    startedAt: new Date('2026-01-15T10:30:00Z'),
    finishedAt: new Date('2026-01-15T10:35:00Z'),
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
    x402PaymentDetails: null,
    createdAt: new Date('2026-01-15T10:30:00Z'),
    updatedAt: new Date('2026-01-15T10:35:00Z'),
    startedAt: new Date('2026-01-15T10:30:00Z'),
    finishedAt: new Date('2026-01-15T10:35:00Z'),
    metadata: null,
    ...overrides,
  };
}

function owned(normalizedDomainName: string, tokenId: string): OwnedDomain {
  return { normalizedDomainName, chainId: 8453, tokenId };
}

type StoryArgs = { mockState: MockState };

function OrderCompletionPageWrapper({ mockState }: StoryArgs) {
  const paramsPromise = Promise.resolve({ id: 'order-123456' });
  return (
    <StoryProviders mockState={mockState}>
      <Suspense fallback={<div>Loading order...</div>}>
        <OrderPage params={paramsPromise} />
      </Suspense>
    </StoryProviders>
  );
}

const meta: Meta<typeof OrderCompletionPageWrapper> = {
  title: 'Pages/Order Completion',
  component: OrderCompletionPageWrapper,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/orders/[id]' },
    },
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

// Single registration, minted + indexed → "List for Sale" is live; DNSSEC is
// still finishing in the demoted row.
export const RegisterSingle: Story = {
  args: {
    mockState: {
      orderDetails: {
        order: createMockOrder({ amountInUSDCents: 1299 }),
        items: [
          createMockOrderItem({
            normalizedDomainName: 'mybrand.xyz' as NamefiNormalizedDomain,
          }),
        ],
        payments: [createMockPayment({ amountInUSDCents: 1299 })],
        user: mockUser,
      },
      ownedDomains: [owned('mybrand.xyz', '111')],
      dnssecActive: true,
    },
  },
};

// Three registrations: two minted (listable now), one still minting → the
// minting row reads "2 of 3" and "List for Sale" lists the ready ones.
export const RegisterMultiple: Story = {
  args: {
    mockState: {
      orderDetails: {
        order: createMockOrder({ amountInUSDCents: 3897 }),
        items: [
          createMockOrderItem({
            id: 'item-1',
            normalizedDomainName: 'mybrand.xyz' as NamefiNormalizedDomain,
          }),
          createMockOrderItem({
            id: 'item-2',
            normalizedDomainName: 'acme.com' as NamefiNormalizedDomain,
          }),
          createMockOrderItem({
            id: 'item-3',
            normalizedDomainName: 'studio.xyz' as NamefiNormalizedDomain,
          }),
        ],
        payments: [createMockPayment({ amountInUSDCents: 3897 })],
        user: mockUser,
      },
      ownedDomains: [owned('mybrand.xyz', '111'), owned('acme.com', '222')],
      dnssecActive: true,
    },
  },
};

// Single import: nothing minted yet → no "List for Sale", and the page leads
// with the import-in-progress framing.
export const ImportSingle: Story = {
  args: {
    mockState: {
      orderDetails: {
        order: createMockOrder({ amountInUSDCents: 1999 }),
        items: [
          createMockOrderItem({
            normalizedDomainName: 'acme.com' as NamefiNormalizedDomain,
            type: 'IMPORT',
          }),
        ],
        payments: [createMockPayment({ amountInUSDCents: 1999 })],
        user: mockUser,
      },
      ownedDomains: [],
      dnssecActive: false,
    },
  },
};

// Internationalized (IDN) domain: stored as punycode (xn--mnchen-3ya.com =
// münchen.com). The card shows the Unicode name with the raw punycode beneath,
// and the Just AIng carousel does the same.
export const InternationalizedDomain: Story = {
  args: {
    mockState: {
      orderDetails: {
        order: createMockOrder({ amountInUSDCents: 1299 }),
        items: [
          createMockOrderItem({
            normalizedDomainName:
              'xn--mnchen-3ya.com' as NamefiNormalizedDomain,
          }),
        ],
        payments: [createMockPayment({ amountInUSDCents: 1299 })],
        user: mockUser,
      },
      ownedDomains: [owned('xn--mnchen-3ya.com', '111')],
      dnssecActive: true,
    },
  },
};

// Mixed order: a registered domain (minted, listable) + an imported one (still
// arriving) → "List for Sale" offers the ready domain only.
export const MixedRegisterAndImport: Story = {
  args: {
    mockState: {
      orderDetails: {
        order: createMockOrder({ amountInUSDCents: 3298 }),
        items: [
          createMockOrderItem({
            id: 'item-1',
            normalizedDomainName: 'mybrand.xyz' as NamefiNormalizedDomain,
            type: 'REGISTER',
          }),
          createMockOrderItem({
            id: 'item-2',
            normalizedDomainName: 'acme.com' as NamefiNormalizedDomain,
            type: 'IMPORT',
          }),
        ],
        payments: [createMockPayment({ amountInUSDCents: 3298 })],
        user: mockUser,
      },
      ownedDomains: [owned('mybrand.xyz', '111')],
      dnssecActive: false,
    },
  },
};

// Single renewal: the domain was already owned, so it stays owned — but the page
// leads with "Renewal complete", drops the "List for Sale" CTA and the minting /
// DNSSEC finishing-up strip (renewals reuse the existing NFT and DNS).
export const RenewSingle: Story = {
  args: {
    mockState: {
      orderDetails: {
        order: createMockOrder({ amountInUSDCents: 1299 }),
        items: [
          createMockOrderItem({
            normalizedDomainName:
              'my-existing-domain.com' as NamefiNormalizedDomain,
            type: 'RENEW',
          }),
        ],
        payments: [createMockPayment({ amountInUSDCents: 1299 })],
        user: mockUser,
      },
      ownedDomains: [owned('my-existing-domain.com', '111')],
      dnssecActive: false,
    },
  },
};

// Multiple renewals: same renewal framing, pluralized — no listing, no minting.
export const RenewMultiple: Story = {
  args: {
    mockState: {
      orderDetails: {
        order: createMockOrder({ amountInUSDCents: 3897 }),
        items: [
          createMockOrderItem({
            id: 'item-1',
            normalizedDomainName: 'first-domain.com' as NamefiNormalizedDomain,
            type: 'RENEW',
          }),
          createMockOrderItem({
            id: 'item-2',
            normalizedDomainName: 'second-domain.io' as NamefiNormalizedDomain,
            type: 'RENEW',
          }),
          createMockOrderItem({
            id: 'item-3',
            normalizedDomainName: 'third-domain.net' as NamefiNormalizedDomain,
            type: 'RENEW',
          }),
        ],
        payments: [createMockPayment({ amountInUSDCents: 3897 })],
        user: mockUser,
      },
      ownedDomains: [
        owned('first-domain.com', '111'),
        owned('second-domain.io', '222'),
        owned('third-domain.net', '333'),
      ],
      dnssecActive: false,
    },
  },
};
