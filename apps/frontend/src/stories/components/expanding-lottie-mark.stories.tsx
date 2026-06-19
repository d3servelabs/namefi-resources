import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ExpandingLottieMark } from '@/components/expanding-lottie-mark';

/**
 * Standalone harness for the reusable {@link ExpandingLottieMark}. It only needs
 * a QueryClient (LazyLottie fetches the JSON via react-query); `expanded` and
 * `dir` are driven from controls. Uses the Namefi `namefi_to_nfi` asset and the
 * timing/easing sampled from its morph (the same values BrandLogo passes).
 */
const queryClient = new QueryClient();

const NAMEFI_LOTTIE = '/lottie/namefi_to_nfi.json';
const EXPAND_EASING =
  'linear(0 0%, 0 66.67%, 0.0440 69.05%, 0.1362 71.43%, 0.2463 73.81%, 0.3609 76.19%, 0.4728 78.57%, 0.5779 80.95%, 0.6736 83.33%, 0.7585 85.71%, 0.8314 88.10%, 0.8917 90.48%, 0.9389 92.86%, 0.9728 95.24%, 0.9932 97.62%, 1 100%)';
const COLLAPSE_EASING =
  'linear(0 0%, 0.0440 2.38%, 0.1362 4.76%, 0.2463 7.14%, 0.3609 9.52%, 0.4728 11.90%, 0.5779 14.29%, 0.6736 16.67%, 0.7585 19.05%, 0.8314 21.43%, 0.8917 23.81%, 0.9389 26.19%, 0.9728 28.57%, 0.9932 30.95%, 1 33.33%, 1 100%)';

type HarnessArgs = {
  dir: 'ltr' | 'rtl';
  expanded: boolean;
};

function Harness({ dir, expanded }: HarnessArgs) {
  const [isOpen, setIsOpen] = useState(expanded);
  return (
    <div dir={dir} className="dark bg-background text-foreground p-6">
      <QueryClientProvider client={queryClient}>
        <div className="flex flex-col items-start gap-3">
          {/* Compact surface so the framing reads true. */}
          <div className="inline-flex items-center rounded-md border border-sidebar-border bg-sidebar px-1.5 py-1">
            <ExpandingLottieMark
              cacheId="story-expanding-lottie-mark"
              getJson={() => fetch(NAMEFI_LOTTIE).then((r) => r.json())}
              width={66}
              height={19.8}
              collapsedWidth={28}
              expanded={isOpen}
              durationMs={1001}
              expandEasing={EXPAND_EASING}
              collapseEasing={COLLAPSE_EASING}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
          >
            Toggle ({isOpen ? 'expanded' : 'collapsed'})
          </button>
        </div>
      </QueryClientProvider>
    </div>
  );
}

const meta: Meta<HarnessArgs> = {
  title: 'Components/Expanding Lottie Mark',
  render: (args) => <Harness {...args} />,
  args: { dir: 'ltr', expanded: true },
  argTypes: {
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    expanded: {
      control: 'boolean',
      description: 'Full wordmark (true) vs collapsed mark (false)',
    },
  },
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<HarnessArgs>;

export const Expanded: Story = { args: { dir: 'ltr', expanded: true } };
export const Collapsed: Story = { args: { dir: 'ltr', expanded: false } };
export const ExpandedRTL: Story = { args: { dir: 'rtl', expanded: true } };
export const CollapsedRTL: Story = { args: { dir: 'rtl', expanded: false } };

/** Click "Toggle" to watch the width grow/shrink in sync with the morph. */
export const Interactive: Story = { args: { dir: 'rtl', expanded: false } };
