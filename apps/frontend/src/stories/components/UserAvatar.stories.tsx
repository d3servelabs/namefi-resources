import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { UserWalletAvatar, CurrentUserAvatar } from '@/components/user-avatar';
import { MockPrivy } from '@/hooks/use-auth';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, base } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';

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

function StoryProviders({
  children,
  isAuthenticated = false,
  walletAddress,
}: {
  children: ReactNode;
  isAuthenticated?: boolean;
  walletAddress?: string;
}) {
  const queryClient = createMockQueryClient();

  return (
    <MockPrivy.Provider
      value={
        {
          ready: true,
          authenticated: isAuthenticated,
          user: isAuthenticated
            ? {
                id: 'mock-user-id',
                wallet: walletAddress ? { address: walletAddress } : null,
              }
            : null,
        } as any
      }
    >
      <WagmiProvider config={mockWagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </MockPrivy.Provider>
  );
}

const meta: Meta<typeof UserWalletAvatar> = {
  title: 'Components/UserAvatar',
  component: UserWalletAvatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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

function CurrentUserAvatarStory() {
  return (
    <StoryProviders isAuthenticated={true} walletAddress={MOCK_WALLET_ADDRESS}>
      <CurrentUserAvatar />
    </StoryProviders>
  );
}

export const CurrentUser: Story = {
  render: () => <CurrentUserAvatarStory />,
};

function MultipleAvatarsStory() {
  return (
    <StoryProviders>
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
    </StoryProviders>
  );
}

export const MultipleAvatars: Story = {
  render: () => <MultipleAvatarsStory />,
};
