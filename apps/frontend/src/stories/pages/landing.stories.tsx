import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Landing } from '@/pbns/astra/landing';
import type { OriginRuntime } from '@/lib/origin/types';
import { FreeMintsGuidanceProvider } from '@/components/providers/free-mints-guidance';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { createContext, type ReactNode } from 'react';
import type { InteractionLoggingEvent } from '@/lib/analytics-events';

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

const MockInteractionLoggersContext = createContext<{
  logEventWithInteractionLoggers: (event: InteractionLoggingEvent) => void;
}>({
  logEventWithInteractionLoggers: () => {
    // no-op for storybook
  },
});

function MockInteractionLoggersProvider({ children }: { children: ReactNode }) {
  return (
    <MockInteractionLoggersContext.Provider
      value={{
        logEventWithInteractionLoggers: (_event) => {
          // no-op for storybook
        },
      }}
    >
      {children}
    </MockInteractionLoggersContext.Provider>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
});

function StoryProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <FreeMintsGuidanceProvider>
          <MockInteractionLoggersProvider>
            {children}
          </MockInteractionLoggersProvider>
        </FreeMintsGuidanceProvider>
      </NuqsAdapter>
    </QueryClientProvider>
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
    (Story) => (
      <StoryProviders>
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
