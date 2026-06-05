import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, splitLink, type TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import { userEvent, waitFor, within } from 'storybook/test';
import { Landing } from '@/pbns/astra/landing';
import type { OriginRuntime } from '@/lib/origin/types';
import type { AppRouter } from '@/lib/trpc';
import { TRPCProvider } from '@/lib/trpc';
import { createMockLink } from '@/lib/mock/trpc';
import { MockPrivyProvider } from '@/lib/mock/privy';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
import { FreeMintsGuidanceProvider } from '@/components/providers/free-mints-guidance';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { OriginProvider } from '@/components/providers/origin';
import { TrpcProvider } from '@/components/providers/trpc';
import { CartProvider } from '@/components/providers/cart';
import { WishlistProvider } from '@/components/providers/wishlist';
import { SidebarProvider } from '@namefi-astra/ui/components/shadcn/sidebar';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { NuqsAdapter } from 'nuqs/adapters/react';

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

function StoryProviders({
  children,
  origin,
}: {
  children: ReactNode;
  origin: OriginRuntime;
}) {
  return (
    <OriginProvider originInfo={origin}>
      <TrpcProvider>
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
      </TrpcProvider>
    </OriginProvider>
  );
}

// Minimal pricing table so client-ranked domain suggestions resolve to priced,
// renderable result cards without a backend. `useSearch` generates the domain
// list on the client (suggestionSource: 'client-ranked-tlds'), so the only data
// the results panel needs to render cards is the TLD pricing table below.
const MOCK_TLD_PRICING = ['com', 'io', 'xyz', 'org', 'net', 'app'].map(
  (tld, index) => ({
    tld,
    registrationPriceUsdPerYear: 12 + index,
    renewalPriceUsdPerYear: 14 + index,
    transferPriceUsdPerYear: 12 + index,
    registrarKey: 'DynadotGdg',
  }),
);

async function getSearchMockData(opts: {
  op: { path: string };
}): Promise<[null, unknown]> {
  switch (opts.op.path) {
    case 'registry.getTldPricingTable':
      return [null, { tldPricing: MOCK_TLD_PRICING, pbnDomains: [] }];
    case 'mls.searchDomainOffers':
      return [null, { offersByDomain: {} }];
    default:
      return [null, {}];
  }
}

// `controlledLink` (used by `createMockLink`) cannot serve tRPC subscriptions,
// and `useSearch` opens a `search.streamDomainAvailability` subscription for the
// authoritative availability stream. This link answers that subscription with
// deterministic "available" results so the cards render and the hook never
// enters its error state. Non-subscription ops fall through to `createMockLink`.
function createMockAvailabilityLink(): TRPCLink<AppRouter> {
  return () => (operationOpts) =>
    observable((observer) => {
      const { op } = operationOpts;
      const input = (op.input ?? {}) as { domains?: string[] };
      observer.next({ result: { type: 'started' } });
      for (const domain of input.domains ?? []) {
        observer.next({
          result: {
            type: 'data',
            data: {
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
              durationValidationInYears: { min: 1, max: 10 },
              importable: false,
              supported: true,
              registrarKey: 'DynadotGdg',
            },
          },
        });
      }
      // Keep the subscription open so the stream status stays non-terminal.
      return () => undefined;
    });
}

function MockSearchProviders({
  children,
  origin,
}: {
  children: ReactNode;
  origin: OriginRuntime;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        splitLink({
          condition: (op) => op.type === 'subscription',
          true: createMockAvailabilityLink(),
          false: createMockLink({
            isAuthenticated: false,
            getMockData: getSearchMockData,
          }),
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
          <OriginProvider originInfo={origin}>
            <NuqsAdapter>
              <ConsentManagerProvider options={{ mode: 'offline' }}>
                <AdminFeatureFlagsProvider>
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
                </AdminFeatureFlagsProvider>
              </ConsentManagerProvider>
            </NuqsAdapter>
          </OriginProvider>
        </TRPCProvider>
      </QueryClientProvider>
    </MockPrivyProvider>
  );
}

const meta = {
  title: 'Pages/Landing',
  component: Landing,
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
  decorators: [
    (Story, context) => {
      const origin = context.args.origin ?? mockOriginRuntime;
      const Providers = context.parameters.useMockSearch
        ? MockSearchProviders
        : StoryProviders;
      return (
        <Providers origin={origin}>
          <Story />
        </Providers>
      );
    },
  ],
} satisfies Meta<typeof Landing>;

export default meta;
type Story = StoryObj<typeof meta>;

// Matches a rendered result card for the searched term (e.g. "acme.com").
const RESULT_CARD_REGEX = /acme\.(com|io|xyz|org|net|app)/i;

export const Default: Story = {
  args: {
    origin: mockOriginRuntime,
  },
};

/**
 * Regression coverage for the search-results overlap fix: when a domain is
 * searched the results panel must render BELOW the search input, never on top
 * of it. The `play` function types a query so the results panel is visible in
 * the Chromatic snapshot (captured at both desktop and mobile viewports).
 */
export const WithSearchResults: Story = {
  args: {
    origin: mockOriginRuntime,
  },
  parameters: {
    useMockSearch: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByPlaceholderText('Search for a domain...');
    await userEvent.click(input);
    await userEvent.type(input, 'acme{Enter}');
    // Wait for the results panel to render below the input. Client-ranked
    // suggestions produce `acme.<tld>` cards once the query is set.
    await waitFor(
      () => {
        if (!RESULT_CARD_REGEX.test(canvasElement.textContent ?? '')) {
          throw new Error('search results not rendered yet');
        }
      },
      { timeout: 8000 },
    );
  },
};
