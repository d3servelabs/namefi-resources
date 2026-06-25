import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NamefiConsentProvider } from '@/components/providers/consent/namefi-consent';
import type { ReactNode } from 'react';
import { Footer } from '@/components/footer';
import { LocaleChangeProvider } from '@/components/i18n/use-change-locale';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { OriginProvider } from '@/components/providers/origin';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { TrpcProvider } from '@/components/providers/trpc';
import { MockPrivyProvider } from '@/lib/mock/privy';
import type { OriginRuntime } from '@/lib/origin/types';
import { StorybookAuthProvider } from '../utils/storybook-auth-provider';

const astraOrigin: OriginRuntime = {
  isFirstPartyOrigin: true,
  thirdPartyHostname: null,
  origin: 'https://astra.namefi.io',
  config: {
    metadata: {
      title: 'Namefi',
      description:
        'Namefi is an ICANN Accredited Registrar tokenizing internet domain names.',
    },
    logo: {
      type: 'image',
      image: '/logotype.svg',
      alt: 'Namefi',
    },
  },
};

function StoryProviders({ children }: { children: ReactNode }) {
  return (
    <MockPrivyProvider
      value={{ ready: true, authenticated: false, user: null }}
    >
      <OriginProvider originInfo={astraOrigin}>
        <TrpcProvider>
          <NamefiConsentProvider>
            <StorybookAuthProvider isAuthenticated={false}>
              <PreAuthSignalsProvider>
                <InteractionLoggersProvider>
                  <LocaleChangeProvider
                    activeLocale="en"
                    changeLocale={() => undefined}
                  >
                    <div className="dark min-h-screen bg-background text-foreground">
                      {children}
                    </div>
                  </LocaleChangeProvider>
                </InteractionLoggersProvider>
              </PreAuthSignalsProvider>
            </StorybookAuthProvider>
          </NamefiConsentProvider>
        </TrpcProvider>
      </OriginProvider>
    </MockPrivyProvider>
  );
}

const meta = {
  title: 'Components/Footer',
  component: Footer,
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof Footer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AstraHomepage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/' },
    },
  },
};

export const AstraNonRoot: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/features/brand-studio' },
    },
  },
};
