import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SidebarProvider } from '@namefi-astra/ui/components/shadcn/sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { BrandLogo } from '@/components/brand-logo';
import { OriginProvider } from '@/components/providers/origin';
import type { OriginRuntime } from '@/lib/origin/types';

const queryClient = new QueryClient();

/**
 * Isolated harness for the animated brand logo so the collapse/expand width
 * transition can be inspected without the full app shell. The logo reads
 * `useSidebar().state` (collapsed ↔ expanded) and `useOrigin().config.logo`,
 * so the only context it needs is `SidebarProvider` + `OriginProvider`. RTL is
 * driven by a `dir` wrapper (the real app sets `dir` on <html>).
 *
 * The brand asset (`namefi_to_nfi.json`) morphs the full "Namefi" wordmark to a
 * compact "nfi" mark; the collapsed rail must frame that mark at its real
 * visible width.
 */
const namefiOrigin: OriginRuntime = {
  isFirstPartyOrigin: true,
  thirdPartyHostname: null,
  origin: 'https://astra.namefi.io',
  config: {
    metadata: {
      title: 'Namefi',
      description: 'Namefi',
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

type HarnessArgs = {
  dir: 'ltr' | 'rtl';
  open: boolean;
};

function LogoHarness({ dir, open }: HarnessArgs) {
  const [isOpen, setIsOpen] = useState(open);
  return (
    <div dir={dir} className="dark bg-background text-foreground p-6">
      <QueryClientProvider client={queryClient}>
        <OriginProvider originInfo={namefiOrigin}>
          {/* SidebarProvider's wrapper is meant to wrap the whole app (it forces
              min-h-svh / w-full / flex); neutralize that here so the harness is
              sized to the logo, not the viewport. */}
          <SidebarProvider
            open={isOpen}
            onOpenChange={setIsOpen}
            className="!min-h-0 !w-auto !block"
            style={{ minHeight: 0, width: 'auto' }}
          >
            <div className="flex flex-col items-start gap-3">
              {/* Compact sidebar-header surface, sized to the logo. */}
              <div className="inline-flex items-center rounded-md border border-sidebar-border bg-sidebar px-1.5 py-1">
                <BrandLogo />
              </div>
              <button
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
              >
                Toggle ({isOpen ? 'expanded' : 'collapsed'})
              </button>
            </div>
          </SidebarProvider>
        </OriginProvider>
      </QueryClientProvider>
    </div>
  );
}

const meta: Meta<HarnessArgs> = {
  title: 'Components/Brand Logo',
  render: (args) => <LogoHarness {...args} />,
  args: { dir: 'ltr', open: true },
  argTypes: {
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    open: {
      control: 'boolean',
      description: 'Sidebar expanded (true) vs collapsed rail (false)',
    },
  },
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<HarnessArgs>;

export const ExpandedLTR: Story = { args: { dir: 'ltr', open: true } };
export const CollapsedLTR: Story = { args: { dir: 'ltr', open: false } };
export const ExpandedRTL: Story = { args: { dir: 'rtl', open: true } };
export const CollapsedRTL: Story = { args: { dir: 'rtl', open: false } };

/** Click "Toggle" to watch the real width expand/shrink in either direction. */
export const Interactive: Story = { args: { dir: 'rtl', open: false } };
