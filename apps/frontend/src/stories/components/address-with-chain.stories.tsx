import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AddressWithChain } from '@/components/address-with-chain';
import { MockPrivyProvider } from '@/lib/mock/privy';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, base, baseSepolia } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';
import { TooltipProvider } from '@namefi-astra/ui/components/shadcn/tooltip';
import { TRPCProvider } from '@/lib/trpc';
import { createMockLink } from '@/lib/mock/trpc';
import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '@/lib/trpc';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { StorybookAuthProvider } from '../utils/storybook-auth-provider';

const MOCK_WALLET_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const MOCK_WALLET_ADDRESS_2 = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';

const mockWagmiConfig = createConfig({
  chains: [mainnet, sepolia, base, baseSepolia],
  connectors: [mock({ accounts: [MOCK_WALLET_ADDRESS as `0x${string}`] })],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
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

function StoryProviders({ children }: { children: ReactNode }) {
  const queryClient = createMockQueryClient();
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      createMockLink({
        isAuthenticated: false,
        getMockData: async ({ op }) => {
          if (op.path === 'users.getMyPermissions') {
            return Promise.resolve([null, []] as const);
          }
          return Promise.resolve([null, {}] as const);
        },
      }),
    ],
  });
  return (
    <MockPrivyProvider
      value={
        {
          ready: true,
          authenticated: false,
          user: null,
        } as any
      }
    >
      <WagmiProvider config={mockWagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
            <ConsentManagerProvider options={{ mode: 'offline' }}>
              <StorybookAuthProvider isAuthenticated={false}>
                <TooltipProvider>{children}</TooltipProvider>
              </StorybookAuthProvider>
            </ConsentManagerProvider>
          </TRPCProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MockPrivyProvider>
  );
}

const meta: Meta<typeof AddressWithChain> = {
  title: 'Components/AddressWithChain',
  component: AddressWithChain,
  parameters: {
    layout: 'centered',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
  },
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
  argTypes: {
    address: {
      control: 'text',
      description: 'Ethereum wallet address to display',
    },
    chainId: {
      control: 'select',
      options: [mainnet.id, sepolia.id, base.id, baseSepolia.id],
      description: 'Chain ID to display the network badge for',
    },
    showChainBadge: {
      control: 'boolean',
      description: 'Whether to show the chain badge on the avatar',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    address: MOCK_WALLET_ADDRESS,
    chainId: mainnet.id,
    showChainBadge: true,
  },
};

export const WithBaseChain: Story = {
  args: {
    address: MOCK_WALLET_ADDRESS,
    chainId: base.id,
    showChainBadge: true,
  },
};

export const WithSepoliaTestnet: Story = {
  args: {
    address: MOCK_WALLET_ADDRESS,
    chainId: sepolia.id,
    showChainBadge: true,
  },
};

export const WithBaseSepoliaTestnet: Story = {
  args: {
    address: MOCK_WALLET_ADDRESS_2,
    chainId: baseSepolia.id,
    showChainBadge: true,
  },
};

export const WithoutChainBadge: Story = {
  args: {
    address: MOCK_WALLET_ADDRESS,
    chainId: mainnet.id,
    showChainBadge: false,
  },
};

export const NoAddress: Story = {
  args: {
    address: null,
    chainId: mainnet.id,
    showChainBadge: true,
  },
};

export const NoChainId: Story = {
  args: {
    address: MOCK_WALLET_ADDRESS,
    chainId: null,
    showChainBadge: true,
  },
};

function AllChainsStory() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">Mainnet Chains:</span>
        <div className="flex flex-wrap gap-4">
          <AddressWithChain
            address={MOCK_WALLET_ADDRESS}
            chainId={mainnet.id}
            showChainBadge={true}
          />
          <AddressWithChain
            address={MOCK_WALLET_ADDRESS}
            chainId={base.id}
            showChainBadge={true}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">Testnet Chains:</span>
        <div className="flex flex-wrap gap-4">
          <AddressWithChain
            address={MOCK_WALLET_ADDRESS}
            chainId={sepolia.id}
            showChainBadge={true}
          />
          <AddressWithChain
            address={MOCK_WALLET_ADDRESS}
            chainId={baseSepolia.id}
            showChainBadge={true}
          />
        </div>
      </div>
    </div>
  );
}

export const AllChains: Story = {
  render: () => <AllChainsStory />,
};

function DifferentAddressesStory() {
  return (
    <div className="flex flex-col gap-4">
      <AddressWithChain
        address={MOCK_WALLET_ADDRESS}
        chainId={mainnet.id}
        showChainBadge={true}
      />
      <AddressWithChain
        address={MOCK_WALLET_ADDRESS_2}
        chainId={base.id}
        showChainBadge={true}
      />
      <AddressWithChain
        address="0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
        chainId={sepolia.id}
        showChainBadge={true}
      />
    </div>
  );
}

export const DifferentAddresses: Story = {
  render: () => <DifferentAddressesStory />,
};
