import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Landing } from '@/pbns/astra/landing';
import type { OriginRuntime } from '@/lib/origin/types';
import { FreeMintsGuidanceProvider } from '@/components/providers/free-mints-guidance';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { OriginProvider } from '@/components/providers/origin';
import { TrpcProvider } from '@/components/providers/trpc';
import { CartProvider } from '@/components/providers/cart';
import { WishlistProvider } from '@/components/providers/wishlist';
import { SidebarProvider } from '@/components/ui/shadcn/sidebar';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { NuqsAdapter } from 'nuqs/adapters/react';
import type { ReactNode } from 'react';

const mockOriginRuntime: OriginRuntime = {
  isFirstPartyOrigin: true,
  thirdPartyHostname: null,
  origin: 'https://astra.namefi.io',
  config: {
    metadata: {
      title: 'Tokenized domains for the future internet - Namefi',
      description:
        'Namefi is an ICANN-accredited registrar that tokenizes DNS ownership so you can register, trade, and build with AI tooling and onchain security.',
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
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => (
      <StoryProviders origin={context.args.origin ?? mockOriginRuntime}>
        <Story />
      </StoryProviders>
    ),
  ],
} satisfies Meta<typeof Landing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    origin: mockOriginRuntime,
  },
};
