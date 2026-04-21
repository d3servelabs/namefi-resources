import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { UserWalletAvatar, CurrentUserAvatar } from '@/components/user-avatar';
import { MockPrivyProvider } from '@/lib/mock/privy';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, base } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';
import { TRPCProvider } from '@/lib/trpc';
import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '@/lib/trpc';
import { createMockLink } from '@/lib/mock/trpc';
import { ConsentManagerProvider } from '@c15t/nextjs';

const MOCK_WALLET_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const MOCK_WALLET_ADDRESS_2 = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';

const mockWagmiConfig = createConfig({
  chains: [mainnet, sepolia, base],
  connectors: [mock({ accounts: [MOCK_WALLET_ADDRESS as `0x${string}`] })],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
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
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </MockPrivyProvider>
  );
}

function AuthenticatedStoryProviders({
  children,
  walletAddress,
}: {
  children: ReactNode;
  walletAddress: string;
}) {
  const queryClient = createMockQueryClient();
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      createMockLink({
        isAuthenticated: true,
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
          authenticated: true,
          user: {
            id: 'mock-user-id',
            wallet: { address: walletAddress },
            linkedAccounts: [{ type: 'wallet', address: walletAddress }],
          },
        } as any
      }
    >
      <WagmiProvider config={mockWagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
            <ConsentManagerProvider options={{ mode: 'offline' }}>
              {children}
            </ConsentManagerProvider>
          </TRPCProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MockPrivyProvider>
  );
}

const meta: Meta<typeof UserWalletAvatar> = {
  title: 'Components/UserAvatar',
  component: UserWalletAvatar,
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
      <AuthenticatedStoryProviders walletAddress={MOCK_WALLET_ADDRESS}>
        <Story />
      </AuthenticatedStoryProviders>
    ),
  ],
  argTypes: {
    address: {
      control: 'text',
      description: 'Ethereum wallet address to display avatar for',
    },
    fallback: {
      control: 'text',
      description: 'Fallback text to display when avatar is not available',
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
    fallback: 'VB',
  },
};

export const WithDifferentAddress: Story = {
  args: {
    address: MOCK_WALLET_ADDRESS_2,
    fallback: 'VB',
  },
};

export const WithFallback: Story = {
  args: {
    address: null,
    fallback: 'JD',
  },
};

export const CustomSize: Story = {
  args: {
    address: MOCK_WALLET_ADDRESS,
    fallback: 'VB',
    className: 'size-16',
  },
};

export const SmallSize: Story = {
  args: {
    address: MOCK_WALLET_ADDRESS,
    fallback: 'VB',
    className: 'size-6',
  },
};

export const LargeSize: Story = {
  args: {
    address: MOCK_WALLET_ADDRESS,
    fallback: 'VB',
    className: 'size-24',
  },
};

export const NoAddress: Story = {
  args: {
    address: undefined,
    fallback: 'NA',
  },
};

function MultipleAvatarsStory() {
  return (
    <div className="flex gap-4 items-center">
      <UserWalletAvatar
        address={MOCK_WALLET_ADDRESS}
        fallback="V1"
        className="size-8"
      />
      <UserWalletAvatar
        address={MOCK_WALLET_ADDRESS_2}
        fallback="V2"
        className="size-10"
      />
      <UserWalletAvatar
        address="0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
        fallback="V3"
        className="size-12"
      />
    </div>
  );
}

export const MultipleAvatars: Story = {
  render: () => (
    <AuthenticatedStoryProviders walletAddress={MOCK_WALLET_ADDRESS}>
      <MultipleAvatarsStory />
    </AuthenticatedStoryProviders>
  ),
};

function CurrentUserAvatarStory() {
  return (
    <AuthenticatedStoryProviders walletAddress={MOCK_WALLET_ADDRESS}>
      <CurrentUserAvatar />
    </AuthenticatedStoryProviders>
  );
}

export const CurrentUser: Story = {
  render: () => <CurrentUserAvatarStory />,
};
