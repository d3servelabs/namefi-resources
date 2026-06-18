import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ReactNode } from 'react';
import { InteractionLoggersProvider } from '@/components/providers/analytics';
import { PreAuthSignalsProvider } from '@/components/providers/pre-auth-signals';
import { LanguageSelector } from '@/components/i18n/language-selector';

function StoryProviders({ children }: { children: ReactNode }) {
  return (
    <PreAuthSignalsProvider>
      <InteractionLoggersProvider>{children}</InteractionLoggersProvider>
    </PreAuthSignalsProvider>
  );
}

const meta = {
  title: 'i18n/LanguageSelector',
  component: LanguageSelector,
  parameters: {
    layout: 'centered',
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/' },
    },
  },
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
} satisfies Meta<typeof LanguageSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The footer language selector. Language-agnostic — flip the `locale` toolbar
 * (English / 中文) to preview either language; screenshots capture both.
 */
export const Default: Story = {};
