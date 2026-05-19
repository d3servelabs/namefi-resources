import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { type ReactNode, useEffect, useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, mainnet, sepolia } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
import { MarketplacePanel } from '@/components/domain-and-dns-managment/panels/marketplace/marketplace-panel';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { MockPrivyProvider } from '@/lib/mock/privy';
import { ETHEREUM_MAINNET_CHAIN_ID } from '@/lib/marketplaces/chains';
import type { Listing } from '@/lib/marketplaces/types';

const MOCK_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_TOKEN_ADDRESS = '0x0000000000cf80e7cf8fa4480907f692177f8e06';
const MOCK_DOMAIN = 'example.com';

const mockWagmiConfig = createConfig({
  chains: [mainnet, sepolia, base],
  connectors: [mock({ accounts: [MOCK_WALLET_ADDRESS as `0x${string}`] })],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
  },
});

function createStoryQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Number.POSITIVE_INFINITY,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
    },
  });
}

function buildSampleListings(args: {
  tokenId: string;
  chainId: number;
}): Listing[] {
  const baseCurrency = {
    contract: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
  };
  return [
    {
      id: '0xstoryorder0001',
      marketplace: 'opensea',
      source: 'OpenSea',
      tokenAddress: MOCK_TOKEN_ADDRESS,
      tokenId: args.tokenId,
      seller: MOCK_WALLET_ADDRESS as `0x${string}`,
      price: {
        raw: '50000000000000000',
        decimal: 0.05,
        currency: baseCurrency,
      },
      createdAt: new Date('2026-05-10T08:00:00Z').toISOString(),
      expirationTime: new Date('2026-05-25T08:00:00Z').toISOString(),
      status: 'active',
      externalUrl: `https://opensea.io/assets/ethereum/${MOCK_TOKEN_ADDRESS}/${args.tokenId}`,
      raw: { protocol_address: '0x0000000000000068F116a894984e2DB1123eB395' },
    },
    {
      id: '0xstoryorder0002',
      marketplace: 'opensea',
      source: 'OpenSea',
      tokenAddress: MOCK_TOKEN_ADDRESS,
      tokenId: args.tokenId,
      seller: MOCK_WALLET_ADDRESS as `0x${string}`,
      price: {
        raw: '120000000000000000',
        decimal: 0.12,
        currency: baseCurrency,
      },
      createdAt: new Date('2026-05-12T12:00:00Z').toISOString(),
      expirationTime: new Date('2026-06-12T12:00:00Z').toISOString(),
      status: 'active',
      externalUrl: `https://opensea.io/assets/ethereum/${MOCK_TOKEN_ADDRESS}/${args.tokenId}`,
      raw: { protocol_address: '0x0000000000000068F116a894984e2DB1123eB395' },
    },
  ];
}

interface StoryArgs {
  nftChainId?: number;
  prefilledListings?: 'empty' | 'with-listings';
  isAuthenticated?: boolean;
}

function ListingsCachePrimer({
  tokenId,
  chainId,
  data,
  children,
}: {
  tokenId: string | null;
  chainId: number;
  data: Listing[];
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [primed, setPrimed] = useState(false);

  useEffect(() => {
    if (!tokenId) return;
    queryClient.setQueryData(
      [
        'marketplace-listings',
        chainId,
        MOCK_TOKEN_ADDRESS.toLowerCase(),
        tokenId,
      ],
      data,
    );
    setPrimed(true);
  }, [queryClient, tokenId, chainId, data]);

  if (!tokenId) return <>{children}</>;
  if (!primed) return null;
  return <>{children}</>;
}

function MarketplacePanelStory({
  nftChainId = ETHEREUM_MAINNET_CHAIN_ID,
  prefilledListings = 'empty',
  isAuthenticated = true,
}: StoryArgs) {
  const queryClient = createStoryQueryClient();
  const tokenId = '12345';
  const listings =
    prefilledListings === 'with-listings'
      ? buildSampleListings({ tokenId, chainId: nftChainId })
      : [];

  return (
    <MockPrivyProvider value={{ ready: true, authenticated: isAuthenticated }}>
      <WagmiProvider config={mockWagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <AdminFeatureFlagsProvider>
            <ConsentManagerProvider options={{ mode: 'offline' }}>
              <PreAuthSignalsProvider>
                <InteractionLoggersProvider>
                  <ListingsCachePrimer
                    tokenId={tokenId}
                    chainId={nftChainId}
                    data={listings}
                  >
                    <div className="max-w-4xl mx-auto p-6">
                      <MarketplacePanel
                        domain={MOCK_DOMAIN}
                        nftChainId={nftChainId}
                      />
                    </div>
                  </ListingsCachePrimer>
                </InteractionLoggersProvider>
              </PreAuthSignalsProvider>
            </ConsentManagerProvider>
          </AdminFeatureFlagsProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MockPrivyProvider>
  );
}

const meta: Meta<StoryArgs> = {
  title: 'Pages/Marketplace Panel',
  component: MarketplacePanelStory,
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/domains/example.com' },
    },
  },
  argTypes: {
    nftChainId: { control: 'number' },
    prefilledListings: {
      control: 'select',
      options: ['empty', 'with-listings'],
    },
    isAuthenticated: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const EmptyListings: Story = {
  args: {
    nftChainId: ETHEREUM_MAINNET_CHAIN_ID,
    prefilledListings: 'empty',
    isAuthenticated: true,
  },
};

export const WithActiveListings: Story = {
  args: {
    nftChainId: ETHEREUM_MAINNET_CHAIN_ID,
    prefilledListings: 'with-listings',
    isAuthenticated: true,
  },
};

export const UnsupportedChain: Story = {
  args: {
    nftChainId: 137, // Polygon — not in MARKETPLACE_SUPPORTED_CHAINS
    prefilledListings: 'empty',
    isAuthenticated: true,
  },
};

export const WalletNotConnected: Story = {
  args: {
    nftChainId: ETHEREUM_MAINNET_CHAIN_ID,
    prefilledListings: 'empty',
    isAuthenticated: false,
  },
};
