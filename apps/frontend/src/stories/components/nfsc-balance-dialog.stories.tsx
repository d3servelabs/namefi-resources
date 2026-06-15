import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient } from '@trpc/client';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, base } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';
import {
  BalanceBreakdownDialog,
  type BalanceBreakdownDialogProps,
} from '@/components/payment-method/nfsc-balance-dialog';
import type { ChainBalance } from '@/hooks/use-user-chain-balances';
import type { OriginRuntime } from '@/lib/origin/types';
import { OriginProvider } from '@/components/providers/origin';
import { TRPCProvider, type AppRouter } from '@/lib/trpc';
import { createMockLink } from '@/lib/mock/trpc';
import { MockPrivyProvider } from '@/lib/mock/privy';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { StorybookAuthProvider } from '../utils/storybook-auth-provider';

const MOCK_WALLET_ADDRESS =
  '0x1234567890123456789012345678901234567890' as const;
const SECOND_MOCK_WALLET_ADDRESS =
  '0xabcabcabcabcabcabcabcabcabcabcabcabcabca' as const;

const mockWagmiConfig = createConfig({
  chains: [mainnet, sepolia, base],
  connectors: [mock({ accounts: [MOCK_WALLET_ADDRESS] })],
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

const mockChainBalances: ChainBalance[] = [
  {
    chainId: base.id,
    chainName: 'Base',
    walletAddress: MOCK_WALLET_ADDRESS,
    balanceInUsdCents: 4250,
    paymentProvider: 'NFSC_BASE',
  },
  {
    chainId: mainnet.id,
    chainName: 'Ethereum',
    walletAddress: MOCK_WALLET_ADDRESS,
    balanceInUsdCents: 1575,
    paymentProvider: 'NFSC_ETHEREUM',
  },
  {
    chainId: base.id,
    chainName: 'Base',
    walletAddress: SECOND_MOCK_WALLET_ADDRESS,
    balanceInUsdCents: 980,
    paymentProvider: 'NFSC_BASE',
  },
];

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
  const queryClient = createMockQueryClient();
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      createMockLink({
        isAuthenticated: true,
        getMockData: (options) => {
          if (options.op.path === 'orders.getMyNfscOrders') {
            return Promise.resolve([null, []] as const);
          }
          // Other calls made by the always-mounted swap dialog (exchange rate,
          // allowed chains, balances) fall back to safe defaults in their hooks
          // when the request errors, so an unknown-path error is harmless here.
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
    <MockPrivyProvider value={{ ready: true, authenticated: true }}>
      <WagmiProvider config={mockWagmiConfig}>
        <OriginProvider originInfo={mockOriginRuntime}>
          <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
              <ConsentManagerProvider options={{ mode: 'offline' }}>
                <StorybookAuthProvider isAuthenticated={true}>
                  {children}
                </StorybookAuthProvider>
              </ConsentManagerProvider>
            </TRPCProvider>
          </QueryClientProvider>
        </OriginProvider>
      </WagmiProvider>
    </MockPrivyProvider>
  );
}

const meta: Meta<BalanceBreakdownDialogProps> = {
  title: 'Components/NFSC Balance Dialog',
  component: BalanceBreakdownDialog,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/profile',
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => undefined,
  },
  render: (args) => (
    <StoryProviders>
      <BalanceBreakdownDialog {...args} />
    </StoryProviders>
  ),
};

export default meta;
type Story = StoryObj<BalanceBreakdownDialogProps>;

/**
 * Balances across linked wallets, with the dialog-level "Top Up" call to
 * action sitting under the total.
 */
export const WithBalances: Story = {
  args: {
    chainBalances: mockChainBalances,
    totalBalanceInUsdCents: mockChainBalances.reduce(
      (sum, balance) => sum + balance.balanceInUsdCents,
      0,
    ),
    isLoadingBalances: false,
    walletAddresses: [MOCK_WALLET_ADDRESS, SECOND_MOCK_WALLET_ADDRESS],
  },
};

/**
 * Zero-balance state with a linked wallet. Previously this view had no funding
 * action at all (the per-wallet "Add funds" only renders for wallets that
 * already hold $NFSC); "Top Up" is now always available.
 */
export const ZeroBalance: Story = {
  args: {
    chainBalances: [],
    totalBalanceInUsdCents: 0,
    isLoadingBalances: false,
    walletAddresses: [MOCK_WALLET_ADDRESS],
  },
};

/**
 * Loading state while balances are being fetched. "Top Up" stays available.
 */
export const LoadingBalances: Story = {
  args: {
    chainBalances: [],
    totalBalanceInUsdCents: 0,
    isLoadingBalances: true,
    walletAddresses: [MOCK_WALLET_ADDRESS],
  },
};
