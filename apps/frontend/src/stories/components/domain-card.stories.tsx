import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient } from '@trpc/client';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { NuqsAdapter } from 'nuqs/adapters/react';
import type { AppRouter } from '@namefi-astra/backend/trpc';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import type { DomainAvailabilityInfo } from '@namefi-astra/common/domain-availability';
import type { MlsSaleListing } from '@/lib/mls/feed';
import { DomainCard } from '@/components/search/domain-card';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
import { CartContext } from '@/components/providers/cart';
import { WishlistContext } from '@/components/providers/wishlist';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { MockPrivyProvider } from '@/lib/mock/privy';
import { createMockLink } from '@/lib/mock/trpc';
import { TRPCProvider } from '@/lib/trpc';
import type { UnifiedCartItem, UseCart } from '@/hooks/use-cart';
import { cartDomainKey } from '@/hooks/use-cart';
import type { UnifiedWishlistItem, UseWishlist } from '@/hooks/use-wishlist';
import { wishlistDomainKey } from '@/hooks/use-wishlist';

type DomainCardProps = ComponentProps<typeof DomainCard>;
type CartVisualState = 'default' | 'adding' | 'in-cart' | 'removing';
type WishlistVisualState = 'default' | 'adding' | 'wishlisted' | 'removing';

type Scenario = {
  title: string;
  description: string;
  props: DomainCardProps;
  cartState?: CartVisualState;
  wishlistState?: WishlistVisualState;
};

const MOCK_USER_ID = 'guest';
const BASE_DATE = new Date('2026-03-18T12:00:00Z');
const noop = () => undefined;
const noopAsync = async () => undefined;

const meta = {
  title: 'Components/DomainCard',
  component: DomainCard,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/search',
        searchParams: {},
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DomainCard>;

// biome-ignore lint/style/noDefaultExport: Storybook stories require a default meta export.
export default meta;
type Story = StoryObj<typeof meta>;

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

function StoryProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createMockQueryClient());
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        createMockLink({
          isAuthenticated: false,
          getMockData: async () => [null, {}] as const,
        }),
      ],
    }),
  );

  return (
    <MockPrivyProvider
      value={{
        ready: true,
        authenticated: false,
        user: null,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          <NuqsAdapter>
            <ConsentManagerProvider options={{ mode: 'offline' }}>
              <AdminFeatureFlagsProvider>
                <PreAuthSignalsProvider>
                  <InteractionLoggersProvider>
                    {children}
                  </InteractionLoggersProvider>
                </PreAuthSignalsProvider>
              </AdminFeatureFlagsProvider>
            </ConsentManagerProvider>
          </NuqsAdapter>
        </TRPCProvider>
      </QueryClientProvider>
    </MockPrivyProvider>
  );
}

function createAvailabilityInfo(
  domain: NamefiNormalizedDomain,
  overrides: Partial<DomainAvailabilityInfo> = {},
): DomainAvailabilityInfo {
  return {
    domain,
    availability: true,
    pricingDetails: {
      registrationPrice: {
        type: 'PER_YEAR',
        price: { amount: 18, currency: 'USD' },
      },
      renewalPrice: {
        type: 'PER_YEAR',
        price: { amount: 22, currency: 'USD' },
      },
      importPrice: {
        type: 'PER_YEAR',
        price: { amount: 35, currency: 'USD' },
      },
    },
    currentOwner: undefined,
    durationValidationInYears: {
      min: 1,
      max: 10,
    },
    importable: false,
    supported: true,
    ...overrides,
  };
}

function createMlsOffer(domain: string, username: string): MlsSaleListing {
  return {
    id: `mls-${domain}`,
    domain,
    logoUrl: null,
    askingPrice: '350',
    askingCurrency: 'USD',
    purchaseUrl: null,
    messageText: `Selling ${domain}`,
    seller: {
      username,
      displayName: username,
    },
    otherDomainsCount: 4,
    sourceTweetUrl: `https://x.com/${username}/status/1935600000000000000`,
    postedAt: '2026-03-17T09:30:00.000Z',
    listedAt: '2026-03-17T09:30:00.000Z',
  };
}

function createMockCartContext(
  domain: NamefiNormalizedDomain | undefined,
  state: CartVisualState = 'default',
  eppAuthorizationCode?: string,
): UseCart {
  const rowId = domain ? `cart-${domain}` : 'cart-empty';
  const fallbackDomain = (domain ??
    'story-cart-fallback.club') as NamefiNormalizedDomain;
  const cartData: UnifiedCartItem[] =
    domain && (state === 'in-cart' || state === 'removing')
      ? [
          {
            id: rowId,
            userId: MOCK_USER_ID,
            normalizedDomainName: domain,
            amountInUSDCents: 1800,
            durationInYears: 1,
            type: eppAuthorizationCode ? 'IMPORT' : 'REGISTER',
            registrar: 'DynadotGdg',
            createdAt: BASE_DATE,
            updatedAt: BASE_DATE,
            encryptionKeyId: null,
            encryptedEppAuthorizationCode: eppAuthorizationCode ?? null,
            eppAuthorizationCode,
            metadata: null,
            ...(state === 'removing' ? { __pendingDelete: true } : {}),
          } as UnifiedCartItem,
        ]
      : [];
  const fallbackCartItem = {
    id: rowId,
    userId: MOCK_USER_ID,
    normalizedDomainName: fallbackDomain,
    amountInUSDCents: 1800,
    durationInYears: 1,
    type: eppAuthorizationCode ? 'IMPORT' : 'REGISTER',
    registrar: 'DynadotGdg',
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    encryptionKeyId: null,
    encryptedEppAuthorizationCode: eppAuthorizationCode ?? null,
    eppAuthorizationCode,
    metadata: null,
  } as UnifiedCartItem;

  const busyIds = new Set<string>();
  if (domain && state === 'adding') {
    busyIds.add(cartDomainKey(MOCK_USER_ID, domain));
  }
  if (state === 'removing') {
    busyIds.add(rowId);
  }

  return {
    cartData,
    isCartLoading: false,
    isCartUpdating: false,
    addItem: async () => cartData,
    removeItem: async () => cartData,
    updateItem: async () => cartData[0] ?? fallbackCartItem,
    clearCart: async () => [],
    isDomainInCart: (value: string) =>
      cartData.some((item) => item.normalizedDomainName === value),
    isDomainBusy: (value: string) =>
      busyIds.has(cartDomainKey(MOCK_USER_ID, value)) ||
      cartData
        .filter((item) => item.normalizedDomainName === value)
        .some((item) => busyIds.has(item.id)),
    getCartItemId: (value: string) =>
      cartData.find((item) => item.normalizedDomainName === value)?.id,
    refetchCart: noopAsync,
    clearLocalCart: noop,
    busy: {
      busyIds,
      markBusy: noop,
      clearBusy: noop,
      isBusy: (key: string) => busyIds.has(key),
    },
  } as UseCart;
}

function createMockWishlistContext(
  domain: NamefiNormalizedDomain | undefined,
  state: WishlistVisualState = 'default',
): UseWishlist {
  const rowId = domain ? `wishlist-${domain}` : 'wishlist-empty';
  const wishlistData: UnifiedWishlistItem[] =
    domain && (state === 'wishlisted' || state === 'removing')
      ? [
          {
            id: rowId,
            userId: MOCK_USER_ID,
            normalizedDomainName: domain,
            createdAt: BASE_DATE,
            updatedAt: BASE_DATE,
            ...(state === 'removing' ? { __pendingDelete: true } : {}),
          } as UnifiedWishlistItem,
        ]
      : [];

  const busyIds = new Set<string>();
  if (domain && state === 'adding') {
    busyIds.add(wishlistDomainKey(MOCK_USER_ID, domain));
  }
  if (state === 'removing') {
    busyIds.add(rowId);
  }

  return {
    wishlistData,
    isWishlistLoading: false,
    isWishlistUpdating: false,
    addItem: async () => wishlistData,
    removeItem: async () => wishlistData,
    isDomainWishlisted: (value: string) =>
      wishlistData.some((item) => item.normalizedDomainName === value),
    isDomainBusy: (value: string) =>
      busyIds.has(wishlistDomainKey(MOCK_USER_ID, value)) ||
      wishlistData
        .filter((item) => item.normalizedDomainName === value)
        .some((item) => busyIds.has(item.id)),
    refetchWishlist: noopAsync,
    clearLocalWishlist: noop,
    busy: {
      busyIds,
      markBusy: noop,
      clearBusy: noop,
      isBusy: (key: string) => busyIds.has(key),
    },
  } as UseWishlist;
}

function ScenarioCard({
  title,
  description,
  props,
  cartState,
  wishlistState,
}: Scenario) {
  const domain = props.domain;
  const cartValue = createMockCartContext(
    domain,
    cartState,
    props.eppAuthorizationCode,
  );
  const wishlistValue = createMockWishlistContext(domain, wishlistState);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>
      <WishlistContext.Provider value={wishlistValue}>
        <CartContext.Provider value={cartValue}>
          <DomainCard {...props} />
        </CartContext.Provider>
      </WishlistContext.Provider>
    </div>
  );
}

function StateSection({
  title,
  description,
  scenarios,
}: {
  title: string;
  description: string;
  scenarios: Scenario[];
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.title} {...scenario} />
        ))}
      </div>
    </section>
  );
}

const loadingScenarios: Scenario[] = [
  {
    title: 'Initial Loading',
    description: 'No domain or availability info yet.',
    props: {},
  },
  {
    title: 'Resolving Availability',
    description:
      'The domain is known, but pricing and actions are still loading.',
    props: {
      domain: 'pending.club' as NamefiNormalizedDomain,
    },
  },
];

const availabilityScenarios: Scenario[] = [
  {
    title: 'Available',
    description: 'Default registration state with add-to-cart and wishlist.',
    props: {
      domain: 'aurora.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'aurora.club' as NamefiNormalizedDomain,
      ),
    },
  },
  {
    title: 'Free Claim',
    description: 'Eligible domains switch the primary action to Free Claim.',
    props: {
      domain: 'genesis.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'genesis.club' as NamefiNormalizedDomain,
      ),
      freeClaimEligibility: {
        domain: 'genesis.club',
        eligible: true,
        eligibility: [
          {
            groupOrCampaignKey: 'launch',
            claimsAvailable: 1,
            hasExactMatch: true,
            hasParentMatch: false,
          },
        ],
      },
    },
  },
  {
    title: 'Long Domain',
    description:
      'Long names should wrap cleanly without clipping pricing or controls.',
    props: {
      domain:
        'this-is-a-very-long-domain-name-built-for-layout-testing.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'this-is-a-very-long-domain-name-built-for-layout-testing.club' as NamefiNormalizedDomain,
      ),
    },
  },
  {
    title: 'Unsupported',
    description:
      'Unsupported domains replace actions with a destructive badge.',
    props: {
      domain: 'legacy.chain' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'legacy.chain' as NamefiNormalizedDomain,
        {
          availability: false,
          pricingDetails: undefined,
          importable: false,
          supported: false,
        },
      ),
    },
  },
  {
    title: 'Taken',
    description:
      'Importable but already registered domains show the taken state.',
    props: {
      domain: 'orbit.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'orbit.club' as NamefiNormalizedDomain,
        {
          availability: false,
          importable: true,
          currentOwner: '0x1234567890abcdef1234567890abcdef12345678',
        },
      ),
    },
  },
  {
    title: 'Buy On X',
    description:
      'MLS listings add the external social CTA next to the taken badge.',
    props: {
      domain: 'signal.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'signal.club' as NamefiNormalizedDomain,
        {
          availability: false,
          importable: true,
          currentOwner: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        },
      ),
      mlsOffer: createMlsOffer('signal.club', 'namefiseller'),
    },
  },
  {
    title: 'Temporarily Unavailable',
    description:
      'Supported domains can be unavailable without being importable.',
    props: {
      domain: 'queued.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'queued.club' as NamefiNormalizedDomain,
        {
          availability: false,
          importable: false,
        },
      ),
    },
  },
];

const importScenarios: Scenario[] = [
  {
    title: 'Importable',
    description:
      'Import mode for a taken domain shows the EPP input and import CTA.',
    props: {
      domain: 'atlas.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'atlas.club' as NamefiNormalizedDomain,
        {
          availability: false,
          importable: true,
          currentOwner: '0x9988776655443322110099887766554433221100',
        },
      ),
      isImportMode: true,
      eppAuthorizationCode: 'AUTH-CLUB-2026',
    },
  },
  {
    title: 'Importable In Cart',
    description:
      'Saved import rows disable the EPP field and reuse the stored code.',
    props: {
      domain: 'saved-import.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'saved-import.club' as NamefiNormalizedDomain,
        {
          availability: false,
          importable: true,
          currentOwner: '0x9988776655443322110099887766554433221100',
        },
      ),
      isImportMode: true,
      eppAuthorizationCode: 'STORED-EPP-2026',
    },
    cartState: 'in-cart',
  },
  {
    title: 'Importable + Buy On X',
    description:
      'Stress case with EPP input, import CTA, MLS CTA, and a long domain in the same card.',
    props: {
      domain:
        'this-is-a-very-long-domain-name-built-for-import-market-testing.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'this-is-a-very-long-domain-name-built-for-import-market-testing.club' as NamefiNormalizedDomain,
        {
          availability: false,
          importable: true,
          currentOwner: '0x9988776655443322110099887766554433221100',
        },
      ),
      isImportMode: true,
      eppAuthorizationCode: 'MARKET-EPP-2026',
      mlsOffer: createMlsOffer(
        'this-is-a-very-long-domain-name-built-for-import-market-testing.club',
        'verylongnamefisellerhandle',
      ),
    },
  },
  {
    title: 'Import Mode, Not Registered',
    description:
      'Import search still shows a normal add-to-cart action when the name is open.',
    props: {
      domain: 'open.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'open.club' as NamefiNormalizedDomain,
      ),
      isImportMode: true,
    },
  },
  {
    title: 'Temporarily Unimportable',
    description:
      'Import mode surfaces a neutral badge when the name cannot be imported.',
    props: {
      domain: 'locked.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'locked.club' as NamefiNormalizedDomain,
        {
          availability: false,
          importable: false,
        },
      ),
      isImportMode: true,
    },
  },
];

const interactionScenarios: Scenario[] = [
  {
    title: 'In Cart',
    description:
      'The card swaps to the in-cart state and reveals the remove action.',
    props: {
      domain: 'nova.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'nova.club' as NamefiNormalizedDomain,
      ),
    },
    cartState: 'in-cart',
  },
  {
    title: 'Adding To Cart',
    description:
      'Busy add state keeps the primary button in its loading variant.',
    props: {
      domain: 'ember.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'ember.club' as NamefiNormalizedDomain,
      ),
    },
    cartState: 'adding',
  },
  {
    title: 'Removing From Cart',
    description: 'Pending delete rows render the removing state.',
    props: {
      domain: 'tidal.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'tidal.club' as NamefiNormalizedDomain,
      ),
    },
    cartState: 'removing',
  },
  {
    title: 'Wishlisted',
    description: 'Wishlist context fills the heart state.',
    props: {
      domain: 'pixel.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'pixel.club' as NamefiNormalizedDomain,
      ),
    },
    wishlistState: 'wishlisted',
  },
  {
    title: 'Adding To Wishlist',
    description: 'Wishlist add-in-progress shows the busy spinner.',
    props: {
      domain: 'quartz.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'quartz.club' as NamefiNormalizedDomain,
      ),
    },
    wishlistState: 'adding',
  },
  {
    title: 'Removing From Wishlist',
    description: 'Pending removal shows the wishlist removing state.',
    props: {
      domain: 'drift.club' as NamefiNormalizedDomain,
      availabilityInfo: createAvailabilityInfo(
        'drift.club' as NamefiNormalizedDomain,
      ),
    },
    wishlistState: 'removing',
  },
];

function AllStatesStory() {
  return (
    <StoryProviders>
      <div className="min-h-screen bg-zinc-950 p-6 text-white md:p-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-10">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Domain Card States
            </h1>
            <p className="max-w-3xl text-sm text-zinc-400">
              This gallery mirrors the current conditional branches in
              `domain-card.tsx`, including search, import, cart, wishlist, and
              MLS-driven states.
            </p>
          </div>
          <StateSection
            title="Loading"
            description="Initial placeholder states before pricing and actions resolve."
            scenarios={loadingScenarios}
          />
          <StateSection
            title="Availability"
            description="Primary search result states driven by availability, support, claims, and MLS data."
            scenarios={availabilityScenarios}
          />
          <StateSection
            title="Import Flow"
            description="States specific to import search mode."
            scenarios={importScenarios}
          />
          <StateSection
            title="Interaction States"
            description="Visual feedback for cart and wishlist mutations."
            scenarios={interactionScenarios}
          />
        </div>
      </div>
    </StoryProviders>
  );
}

export const AllStates: Story = {
  render: () => <AllStatesStory />,
};
