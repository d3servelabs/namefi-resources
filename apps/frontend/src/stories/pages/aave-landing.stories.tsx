import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
import { CartProvider } from '@/components/providers/cart';
import { FreeMintsGuidanceProvider } from '@/components/providers/free-mints-guidance';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { OriginProvider } from '@/components/providers/origin';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { TrpcProvider } from '@/components/providers/trpc';
import { WishlistProvider } from '@/components/providers/wishlist';
import { Main } from '@/components/main';
import type { OriginRuntime } from '@/lib/origin/types';
import { originConfig as aaveConfig } from '@/pbns/aave/config';
import { Landing } from '@/pbns/aave/landing';
import { ConsentManagerProvider } from '@c15t/nextjs';
import { SidebarProvider } from '@namefi-astra/ui/components/shadcn/sidebar';
import { NuqsAdapter } from 'nuqs/adapters/react';
import type { ReactNode } from 'react';
import { StorybookAuthProvider } from '../utils/storybook-auth-provider';

const mockOriginRuntime: OriginRuntime = {
  isFirstPartyOrigin: false,
  thirdPartyHostname: 'aave',
  origin: 'https://aave.astra.namefi.io',
  config: aaveConfig,
};

function StoryProviders({
  children,
  origin,
}: {
  children: ReactNode;
  origin: OriginRuntime;
}) {
  return (
    <AdminFeatureFlagsProvider>
      <OriginProvider originInfo={origin}>
        <TrpcProvider>
          <NuqsAdapter>
            <ConsentManagerProvider options={{ mode: 'offline' }}>
              <StorybookAuthProvider isAuthenticated={false}>
                <PreAuthSignalsProvider>
                  <InteractionLoggersProvider>
                    <WishlistProvider>
                      <CartProvider>
                        <SidebarProvider defaultOpen={true}>
                          <FreeMintsGuidanceProvider>
                            {children}
                          </FreeMintsGuidanceProvider>
                        </SidebarProvider>
                      </CartProvider>
                    </WishlistProvider>
                  </InteractionLoggersProvider>
                </PreAuthSignalsProvider>
              </StorybookAuthProvider>
            </ConsentManagerProvider>
          </NuqsAdapter>
        </TrpcProvider>
      </OriginProvider>
    </AdminFeatureFlagsProvider>
  );
}

const meta = {
  title: 'Pages/Aave Landing',
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
    (Story, context) => (
      <StoryProviders origin={context.args.origin ?? mockOriginRuntime}>
        <Main>
          <Story />
        </Main>
      </StoryProviders>
    ),
  ],
} satisfies Meta<typeof Landing>;

// biome-ignore lint/style/noDefaultExport: Storybook metadata uses a default export.
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    origin: mockOriginRuntime,
  },
};
