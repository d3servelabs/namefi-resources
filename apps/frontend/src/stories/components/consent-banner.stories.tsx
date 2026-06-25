import { ConsentManagerProvider, useHeadlessConsentUI } from '@c15t/nextjs';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, type ReactNode } from 'react';
import { ConsentUIComponents } from '@/components/providers/consent-ui-lazy';
import { c15tTheme } from '@/components/providers/consent/deferred-c15t-runtime';

function ForcedBanner() {
  const { openBanner } = useHeadlessConsentUI();

  useEffect(() => {
    openBanner({ force: true });
  }, [openBanner]);

  return null;
}

function StoryProviders({ children }: { children: ReactNode }) {
  return (
    <ConsentManagerProvider
      options={{
        mode: 'offline',
        consentCategories: ['necessary', 'measurement'],
        theme: c15tTheme,
        translations: {
          translations: { en: { common: { rejectAll: 'Essential Only' } } },
        },
      }}
    >
      <ForcedBanner />
      {children}
    </ConsentManagerProvider>
  );
}

const meta = {
  title: 'Components/Consent Banner',
  component: ConsentUIComponents,
  decorators: [
    (Story) => (
      <StoryProviders>
        <div className="dark min-h-[360px] bg-background text-foreground">
          <Story />
        </div>
      </StoryProviders>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof ConsentUIComponents>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Compact: Story = {};
