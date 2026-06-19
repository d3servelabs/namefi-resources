import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient } from '@trpc/client';
import { type ReactNode, useMemo } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, mainnet, sepolia } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
import { ListingBadge } from '@/components/marketplace/listing-badge';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { MockPrivyProvider } from '@/lib/mock/privy';
import { createMockLink } from '@/lib/mock/trpc';
import type { Listing } from '@/lib/marketplaces/types';
import { type AppRouter, TRPCProvider } from '@/lib/trpc';
import { StorybookAuthProvider } from '../utils/storybook-auth-provider';

/**
 * Component-level showcase for the marketplace **listing badge** — how an active
 * listing reads in the My Domains table and next to a domain title. The full
 * order-completion experience (celebration + Manage/Share/List actions) lives in
 * the real-page story at `Pages/Order Completion`, not here.
 */

const MOCK_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_TOKEN_ADDRESS = '0x0000000000cf80e7cf8fa4480907f692177f8e06';

const mockWagmiConfig = createConfig({
  chains: [mainnet, sepolia, base],
  connectors: [mock({ accounts: [MOCK_WALLET_ADDRESS as `0x${string}`] })],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
  },
});

function mockListing(price: number, tokenId: string): Listing {
  return {
    id: `0xstory-${tokenId}`,
    marketplace: 'opensea',
    source: 'OpenSea',
    tokenAddress: MOCK_TOKEN_ADDRESS,
    tokenId,
    seller: MOCK_WALLET_ADDRESS as `0x${string}`,
    price: {
      raw: String(BigInt(Math.round(price * 1e18))),
      decimal: price,
      currency: {
        contract: '0x0000000000000000000000000000000000000000',
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
        isNative: true,
      },
    },
    createdAt: new Date('2026-05-10T08:00:00Z').toISOString(),
    expirationTime: new Date('2026-06-10T08:00:00Z').toISOString(),
    status: 'active',
    externalUrl: `https://opensea.io/assets/ethereum/${MOCK_TOKEN_ADDRESS}/${tokenId}`,
    raw: {},
  };
}

function StoryShell({ children }: { children: ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
        },
      }),
    [],
  );
  const trpcClient = useMemo(
    () =>
      createTRPCClient<AppRouter>({
        links: [
          createMockLink({
            isAuthenticated: true,
            getMockData: async () => [null, {}],
          }),
        ],
      }),
    [],
  );
  return (
    <MockPrivyProvider value={{ ready: true, authenticated: true }}>
      <WagmiProvider config={mockWagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
            <AdminFeatureFlagsProvider>
              <ConsentManagerProvider options={{ mode: 'offline' }}>
                <StorybookAuthProvider isAuthenticated>
                  <PreAuthSignalsProvider>
                    <InteractionLoggersProvider>
                      <div className="mx-auto max-w-2xl p-6">{children}</div>
                    </InteractionLoggersProvider>
                  </PreAuthSignalsProvider>
                </StorybookAuthProvider>
              </ConsentManagerProvider>
            </AdminFeatureFlagsProvider>
          </TRPCProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MockPrivyProvider>
  );
}

function ListingBadgeStory({
  surface,
}: {
  surface: 'domain-list' | 'domain-details';
}) {
  if (surface === 'domain-list') {
    const rows: Array<{ domain: string; listing: Listing | null }> = [
      { domain: 'mybrand.xyz', listing: mockListing(0.05, '111') },
      { domain: 'acme.com', listing: mockListing(1.25, '222') },
      { domain: 'studio.xyz', listing: null },
    ];
    return (
      <StoryShell>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-[1fr_auto] gap-4 border-white/10 border-b bg-white/[0.03] px-4 py-2 text-xs font-medium text-zinc-400">
            <span>Domain Name</span>
            <span>Marketplace</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.domain}
              className="grid grid-cols-[1fr_auto] items-center gap-4 border-white/5 border-b px-4 py-3 last:border-0"
            >
              <span className="font-mono text-sm text-zinc-200">
                {r.domain}
              </span>
              {r.listing ? (
                <ListingBadge listing={r.listing} />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          ))}
        </div>
      </StoryShell>
    );
  }

  return (
    <StoryShell>
      <div className="flex items-center gap-3">
        <h1 className="font-mono font-bold text-4xl text-zinc-100">
          Mybrand.xyz
        </h1>
        <ListingBadge listing={mockListing(0.05, '111')} />
      </div>
    </StoryShell>
  );
}

const meta: Meta<typeof ListingBadgeStory> = {
  title: 'Marketplace/Listing Badge',
  component: ListingBadgeStory,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
  },
};

export default meta;
type Story = StoryObj<typeof ListingBadgeStory>;

export const DomainListBadge: Story = {
  args: { surface: 'domain-list' },
};

export const DomainDetailsBadge: Story = {
  args: { surface: 'domain-details' },
};
