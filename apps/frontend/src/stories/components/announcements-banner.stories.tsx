import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient } from '@trpc/client';
import {
  type ReactNode,
  type UIEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { AnnouncementsBanner } from '@/components/AnnouncementsBanner';
import { createMockLink } from '@/lib/mock/trpc';
import { type AppRouter, TRPCProvider } from '@/lib/trpc';
import type { AnnouncementDto } from '@namefi-astra/common/contract/announcements-contract';

// Stable date so `updatedAt`-keyed dismissals (see use-dismissed-announcements)
// stay deterministic across reloads of the same story.
const UPDATED_AT = new Date('2026-06-05T00:00:00.000Z');

const AUTO_RENEW: AnnouncementDto = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Auto-renew is here',
  body: 'Keep your domains from expiring — turn on auto-renew in domain settings.',
  backgroundColor: null,
  textColor: null,
  backgroundOpacity: null,
  linkUrl: 'https://namefi.io/auto-renew',
  linkLabel: 'Learn more',
  dismissible: true,
  priority: 0,
  updatedAt: UPDATED_AT,
};

const SINGLE: AnnouncementDto[] = [AUTO_RENEW];

const MULTIPLE: AnnouncementDto[] = [
  AUTO_RENEW,
  {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Scheduled maintenance',
    body: 'We will be performing maintenance on Sunday. Minting may be briefly paused.',
    backgroundColor: null,
    textColor: null,
    backgroundOpacity: null,
    linkUrl: null,
    linkLabel: null,
    dismissible: true,
    priority: 0,
    updatedAt: UPDATED_AT,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    title: null,
    body: 'Use code `WELCOME` at checkout for your first registration.',
    backgroundColor: null,
    textColor: null,
    backgroundOpacity: null,
    linkUrl: null,
    linkLabel: null,
    dismissible: false,
    priority: 0,
    updatedAt: UPDATED_AT,
  },
];

const CUSTOM_STYLED: AnnouncementDto[] = [
  {
    id: '44444444-4444-4444-8444-444444444444',
    title: 'Black Friday',
    body: 'Premium domains are 30% off this week only.',
    backgroundColor: '#111827',
    textColor: '#fde047',
    backgroundOpacity: null,
    linkUrl: 'https://namefi.io/sale',
    linkLabel: 'Shop the sale',
    dismissible: true,
    priority: 0,
    updatedAt: UPDATED_AT,
  },
];

const FILLER_LINES = Array.from(
  { length: 30 },
  (_, i) => `Scrollable content line ${i + 1}.`,
);

function createMockQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
}

function StoryProviders({
  items,
  children,
}: {
  items: AnnouncementDto[];
  children: ReactNode;
}) {
  // Reset dismissals so the banner always renders fresh when previewing, even
  // after a previous story clicked the dismiss button.
  useEffect(() => {
    try {
      window.localStorage.removeItem('namefi-dismissed-announcements');
    } catch {
      // ignore (private mode / quota)
    }
  }, []);

  const queryClient = createMockQueryClient();
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      createMockLink({
        isAuthenticated: true,
        getMockData: (options) => {
          if (options.op.path === 'announcements.getActive') {
            return Promise.resolve([null, { items }] as const);
          }
          return Promise.resolve([
            { textCode: 'BAD_REQUEST', httpStatus: 400, message: 'unknown' },
            null,
          ] as const);
        },
      }),
    ],
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}

/**
 * Mirrors the real app shell (`Main`): the strip sits above a scroll container
 * and collapses once the page is scrolled away from the top. The fake header
 * is offset by `--announcement-strip-height`, the same var the real header
 * reads, so it slides up in lockstep as the strip closes.
 */
function ScrollToCollapseDemo({ items }: { items: AnnouncementDto[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const y = event.currentTarget.scrollTop;
    setCollapsed((prev) => (prev ? y > 4 : y > 16));
  }, []);

  return (
    <StoryProviders items={items}>
      <div className="flex h-[520px] flex-col overflow-hidden border border-white/10 bg-background">
        <AnnouncementsBanner collapsed={collapsed} />
        <div
          onScroll={handleScroll}
          className="relative flex-1 overflow-y-auto"
        >
          <header className="sticky top-0 z-40 flex h-14 items-center border-b border-white/10 bg-background/80 px-6 text-sm font-medium backdrop-blur">
            App header (scroll down — the strip collapses and this stays pinned)
          </header>
          <div className="space-y-4 p-6 text-sm text-muted-foreground">
            {FILLER_LINES.map((line) => (
              <p key={line}>
                {line} Scroll up and down to watch the announcement strip
                collapse and re-expand at the top.
              </p>
            ))}
          </div>
        </div>
      </div>
    </StoryProviders>
  );
}

const meta: Meta<typeof AnnouncementsBanner> = {
  title: 'Components/Announcements Banner',
  component: AnnouncementsBanner,
  parameters: { layout: 'fullscreen' },
  args: { collapsed: false },
  argTypes: {
    collapsed: {
      control: 'boolean',
      description: 'Animate the strip closed (height 0) while staying mounted.',
    },
  },
  render: (args) => (
    <StoryProviders items={SINGLE}>
      <AnnouncementsBanner {...args} />
    </StoryProviders>
  ),
};

export default meta;
type Story = StoryObj<typeof AnnouncementsBanner>;

/**
 * A single announcement with a dismiss button and a "Learn more" CTA. Toggle
 * the `collapsed` control to see the open/closed states.
 */
export const Default: Story = {};

/**
 * Multiple announcements: prev/next controls appear and the strip auto-rotates
 * (rotation honors `prefers-reduced-motion`).
 */
export const Multiple: Story = {
  render: (args) => (
    <StoryProviders items={MULTIPLE}>
      <AnnouncementsBanner {...args} />
    </StoryProviders>
  ),
};

/**
 * Per-announcement background/text color overrides.
 */
export const CustomStyling: Story = {
  render: (args) => (
    <StoryProviders items={CUSTOM_STYLED}>
      <AnnouncementsBanner {...args} />
    </StoryProviders>
  ),
};

/**
 * Interactive: the strip collapses as you scroll the container away from the
 * top and re-expands when you scroll back. This is the behavior this PR adds.
 */
export const ScrollToCollapse: Story = {
  render: () => <ScrollToCollapseDemo items={SINGLE} />,
};
