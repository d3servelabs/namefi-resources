import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient } from '@trpc/client';
import { WagmiProvider, createConfig, useConnect } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';
import {
  custom,
  encodeAbiParameters,
  parseAbiParameters,
  parseEther,
  toFunctionSelector,
  numberToHex,
  size,
  slice,
} from 'viem';
import NfscSwapDialog from '@/components/dialogs/nfsc-swap-dialog';
import type { OriginRuntime } from '@/lib/origin/types';
import { OriginProvider } from '@/components/providers/origin';
import { TRPCProvider, type AppRouter } from '@/lib/trpc';
import { createMockLink } from '@/lib/mock/trpc';
import { MockPrivyProvider } from '@/lib/mock/privy';

const ADDRESS = '0xB5856d4598c919834913b8656ebc15a64d3C7836' as const;

// Mock on-chain reads so the real dialog renders deterministically with no live
// RPC: native balance 0.5 ETH, NFSC balance 1250, price → 1 ETH ≈ 3000 NFSC.
const SEL = {
  price: toFunctionSelector('price(address)'),
  balanceOf: toFunctionSelector('balanceOf(address)'),
  decimals: toFunctionSelector('decimals()'),
  symbol: toFunctionSelector('symbol()'),
  name: toFunctionSelector('name()'),
};
const encodeUint256 = (v: bigint) =>
  encodeAbiParameters(parseAbiParameters('uint256'), [v]);
const encodeString = (v: string) =>
  encodeAbiParameters(parseAbiParameters('string'), [v]);
const NATIVE_BALANCE = parseEther('0.5');

function handleEthCall(data?: `0x${string}`) {
  if (!data || size(data) < 4) return encodeUint256(0n);
  const selector = slice(data, 0, 4);
  if (selector === SEL.price) return encodeUint256(333333n); // → ~3000 NFSC/ETH
  if (selector === SEL.balanceOf) return encodeUint256(parseEther('1250'));
  if (selector === SEL.decimals) return encodeUint256(18n);
  if (selector === SEL.symbol || selector === SEL.name)
    return encodeString('NFSC');
  return encodeUint256(0n);
}

const RPC_RESPONSES: Record<string, () => `0x${string}`> = {
  eth_blockNumber: () => '0x1312d00',
  eth_gasPrice: () => numberToHex(parseEther('0.00000002')),
  eth_getBalance: () => numberToHex(NATIVE_BALANCE),
};

function mockTransport(chainId: number) {
  return custom({
    async request({ method, params }: { method: string; params?: unknown }) {
      if (method === 'eth_chainId') return numberToHex(chainId);
      if (method === 'eth_call') {
        return handleEthCall((params as [{ data?: `0x${string}` }])[0]?.data);
      }
      return RPC_RESPONSES[method]?.() ?? null;
    },
  });
}

const mockWagmiConfig = createConfig({
  chains: [mainnet, base],
  connectors: [mock({ accounts: [ADDRESS] })],
  batch: { multicall: false },
  transports: {
    [mainnet.id]: mockTransport(mainnet.id),
    [base.id]: mockTransport(base.id),
  },
});

const mockOriginRuntime = {
  isFirstPartyOrigin: true,
  thirdPartyHostname: null,
  origin: 'https://astra.namefi.io',
  config: {
    metadata: { title: 'Namefi', description: 'Namefi' },
    logo: {
      type: 'lottie',
      lottie: '/lottie/namefi_to_nfi.json',
      alt: 'Namefi',
      width: 66,
      height: 19.8,
    },
  },
} as OriginRuntime;

/** Connects the mock wallet on mount so `useAccount()` reports a connected
 * mainnet address (the dialog shows the charging wallet + balances). */
function AutoConnect() {
  const { connect, connectors } = useConnect();
  useEffect(() => {
    connect({ connector: connectors[0] });
  }, [connect, connectors]);
  return null;
}

function StoryProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      createMockLink({
        isAuthenticated: true,
        // Empty array default — list/permission queries do `new Set(data)`.
        getMockData: () => Promise.resolve([null, []] as const),
      }),
    ],
  });
  return (
    <MockPrivyProvider value={{ ready: true, authenticated: true }}>
      <WagmiProvider config={mockWagmiConfig}>
        <OriginProvider originInfo={mockOriginRuntime}>
          <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
              <AutoConnect />
              {children}
            </TRPCProvider>
          </QueryClientProvider>
        </OriginProvider>
      </WagmiProvider>
    </MockPrivyProvider>
  );
}

/**
 * The real `NFSCSwapDialog` rendered with mocked chain data (no live RPC) so the
 * ETH-only NFSC top-up flow can be inspected — the USD-denominated amount with
 * preset chips + the ⓘ credit explainer, and the #4578 mobile-scroll fix.
 * Switch the Storybook viewport to a phone size (e.g. iPhone) to verify the
 * dialog scrolls and the Pay button stays reachable.
 */
const meta = {
  title: 'Components/NFSCSwapDialog',
  component: NfscSwapDialog,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
    viewport: { defaultViewport: 'iphone-17' },
  },
  args: { open: true, onOpenChange: () => undefined, walletAddress: ADDRESS },
  render: (args) => (
    <StoryProviders>
      <NfscSwapDialog {...args} />
    </StoryProviders>
  ),
} satisfies Meta<typeof NfscSwapDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Sets the document direction to RTL while mounted (and restores it on
 * unmount). The dialog renders through a portal on `document.body`, so a
 * `dir="rtl"` wrapper around the story would not reach it — the attribute has
 * to live on `<html>` for the logical-property layout to mirror. */
function RtlDirection({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute('dir');
    root.setAttribute('dir', 'rtl');
    return () => {
      if (previous === null) root.removeAttribute('dir');
      else root.setAttribute('dir', previous);
    };
  }, []);
  return <>{children}</>;
}

/**
 * The same dialog under a right-to-left locale. Storybook's locale toolbar does
 * not set the document `dir`, so a decorator sets it on `<html>` to verify the
 * logical-property layout mirrors (presets, amount field, ⓘ, action bar).
 */
export const RTL: Story = {
  decorators: [
    (Story) => (
      <RtlDirection>
        <Story />
      </RtlDirection>
    ),
  ],
};
