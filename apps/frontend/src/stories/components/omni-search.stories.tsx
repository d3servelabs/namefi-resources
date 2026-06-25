import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  OmniSearch,
  type OmniSearchDomainResult,
  type OmniSearchLabels,
  type OmniSearchResult,
  type OmniSearchSection,
} from '@namefi-astra/ui/components/namefi/omni-search';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { userEvent, waitFor, within } from 'storybook/test';

/* -------------------------------------------------------------------------- */
/*                          Mock "providers" / data                           */
/* -------------------------------------------------------------------------- */
/*
 * Storybook is data-mocked on purpose: the real OmniSearch is headless and
 * receives `sections` from host-app providers (domain availability via tRPC,
 * destinations via a static registry, resources via Pagefind). Here we simulate
 * those providers with in-memory data + a debounce/loading delay so the full UX
 * (loading → results → add-to-cart) is visible without a backend.
 */

const LABELS: OmniSearchLabels = {
  placeholder: 'Search domains, pages, and help…',
  empty: 'No results. Try a different term.',
  premium: 'Premium',
  dialogTitle: 'Search Namefi',
  all: 'All',
  cart: {
    add: 'Add to cart',
    adding: 'Adding…',
    inCart: 'In cart',
    removing: 'Removing…',
    import: 'Import',
    claim: 'Free Claim',
  },
};

type DestinationSeed = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  badgeLabel: string;
};

const DESTINATIONS: DestinationSeed[] = [
  {
    id: 'dest-my-domains',
    title: 'My Domains',
    subtitle: 'View and manage every domain you own',
    href: '/domains',
    badgeLabel: 'Page',
  },
  {
    id: 'dest-dnssec',
    title: 'DNSSEC settings',
    subtitle: 'Enable DNSSEC and manage DS records',
    href: '/domains?tab=dns-management',
    badgeLabel: 'Setting',
  },
  {
    id: 'dest-autorenew',
    title: 'Auto-renew',
    subtitle: 'Turn automatic renewal on or off',
    href: '/domains?tab=dns-management',
    badgeLabel: 'Setting',
  },
  {
    id: 'dest-orders',
    title: 'Orders',
    subtitle: 'Your order history and receipts',
    href: '/orders',
    badgeLabel: 'Page',
  },
  {
    id: 'dest-payment',
    title: 'Payment methods',
    subtitle: 'Manage cards and NFSC balance',
    href: '/payment-methods',
    badgeLabel: 'Page',
  },
];

type ResourceSeed = {
  id: string;
  title: string;
  type: string;
  href: string;
  body: string;
};

const RESOURCES: ResourceSeed[] = [
  {
    id: 'res-dnssec',
    title: 'What is DNSSEC?',
    type: 'Blog',
    href: '/r/en/blog/what-is-dnssec',
    body: 'DNSSEC adds cryptographic signatures to DNS records so resolvers can verify answers are authentic.',
  },
  {
    id: 'res-autorenew',
    title: 'How auto-renew works',
    type: 'Guide',
    href: '/r/en/blog/auto-renew',
    body: 'Auto-renew charges your default payment method before a domain expires so you never lose it.',
  },
  {
    id: 'res-xyz',
    title: '.xyz domains explained',
    type: 'TLD',
    href: '/r/en/tld/xyz',
    body: 'The .xyz top-level domain is a low-cost, general-purpose option popular with startups.',
  },
  {
    id: 'res-glossary',
    title: 'Domain name',
    type: 'Glossary',
    href: '/r/en/glossary/domain-name',
    body: 'A domain name is a human-readable address that maps to an IP via the DNS.',
  },
];

const TLDS: Array<{
  tld: string;
  available: boolean;
  price?: string;
  original?: string;
  premium?: boolean;
  importable?: boolean;
  claim?: boolean;
  statusLabel?: string;
}> = [
  {
    tld: 'com',
    available: false,
    importable: true,
    statusLabel: 'Taken · importable',
  },
  { tld: 'xyz', available: true, price: '$2.99', original: '$12.99' },
  { tld: 'io', available: true, price: '$32.00', premium: true },
  { tld: 'app', available: true, price: '$14.00' },
  // Free-claim-eligible: no price, renders the "Free Claim" CTA instead of cart.
  { tld: 'inc', available: true, claim: true },
];

const REGEX_ESCAPE = /[.*+?^${}()|[\]\\]/g;
const IN_CART_REGEX = /In cart/i;

function highlight(text: string, query: string): string {
  const q = query.trim();
  if (q.length === 0) return text;
  const escaped = q.replace(REGEX_ESCAPE, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

function matches(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

/** Build the grouped sections for a query, given the current cart state map. */
function buildSections(
  query: string,
  cart: Record<string, OmniSearchDomainResult['cartState']>,
): OmniSearchSection[] {
  const q = query.trim();
  if (q.length === 0) return [];

  const slug = q.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'your-domain';

  const domains: OmniSearchResult[] = TLDS.map((entry) => {
    const id = `dom-${slug}.${entry.tld}`;
    return {
      kind: 'domain',
      id,
      domain: `${slug}.${entry.tld}`,
      available: entry.available,
      importable: entry.importable,
      isPremium: entry.premium,
      priceLabel: entry.price,
      originalPriceLabel: entry.original,
      statusLabel: entry.statusLabel,
      cartState:
        cart[id] ??
        (entry.claim ? 'claim' : entry.available ? 'add' : 'import'),
    } satisfies OmniSearchDomainResult;
  });

  const destinations: OmniSearchResult[] = DESTINATIONS.filter(
    (d) => matches(d.title, q) || matches(d.subtitle, q),
  ).map((d) => ({
    kind: 'destination',
    id: d.id,
    title: d.title,
    subtitle: d.subtitle,
    href: d.href,
    badgeLabel: d.badgeLabel,
  }));

  const resources: OmniSearchResult[] = RESOURCES.filter(
    (r) => matches(r.title, q) || matches(r.body, q),
  ).map((r) => ({
    kind: 'resource',
    id: r.id,
    title: r.title,
    href: r.href,
    badgeLabel: r.type,
    subtitleHtml: highlight(r.body, q),
  }));

  return [
    {
      id: 'domains',
      heading: 'Domains',
      results: domains,
      footer: {
        id: 'all-domains',
        label: `See all availability for “${q}”`,
        onSelect: () => undefined,
      },
    },
    { id: 'destinations', heading: 'Pages & actions', results: destinations },
    { id: 'resources', heading: 'Help & resources', results: resources },
  ];
}

/* -------------------------------------------------------------------------- */
/*                              Demo wrapper                                   */
/* -------------------------------------------------------------------------- */

type DemoProps = {
  surface?: 'inline' | 'modal' | 'auto';
  initialQuery?: string;
  startOpen?: boolean;
  forceState?: 'loading' | 'empty';
};

function OmniSearchDemo({
  surface = 'inline',
  initialQuery = '',
  startOpen = false,
  forceState,
}: DemoProps) {
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(startOpen);
  const [debounced, setDebounced] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<
    Record<string, OmniSearchDomainResult['cartState']>
  >({});

  // Simulate provider debounce + fetch latency.
  useEffect(() => {
    if (forceState) return;
    if (query.trim().length === 0) {
      setDebounced('');
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setDebounced(query);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, forceState]);

  const sections = useMemo(() => {
    if (forceState === 'loading') {
      return [
        { id: 'domains', heading: 'Domains', results: [], loading: true },
        {
          id: 'resources',
          heading: 'Help & resources',
          results: [],
          loading: true,
        },
      ] satisfies OmniSearchSection[];
    }
    if (forceState === 'empty') {
      return [
        { id: 'domains', heading: 'Domains', results: [] },
        { id: 'destinations', heading: 'Pages & actions', results: [] },
        { id: 'resources', heading: 'Help & resources', results: [] },
      ] satisfies OmniSearchSection[];
    }
    const base = buildSections(debounced, cart);
    if (loading) {
      // Show skeletons in each known group while "fetching".
      return base.map((section) => ({
        ...section,
        results: [],
        loading: true,
      }));
    }
    return base;
  }, [debounced, cart, loading, forceState]);

  return (
    <OmniSearch
      query={forceState ? query || 'dnssec' : query}
      onQueryChange={setQuery}
      sections={sections}
      labels={LABELS}
      surface={surface}
      open={open}
      onOpenChange={setOpen}
      // In the real app this routes via next/navigation; no-op in the demo.
      onSelect={() => undefined}
      onAddToCart={(result) => {
        setCart((prev) => ({ ...prev, [result.id]: 'adding' }));
        setTimeout(() => {
          setCart((prev) => ({ ...prev, [result.id]: 'in-cart' }));
        }, 700);
      }}
      onRemoveFromCart={(result) => {
        setCart((prev) => ({ ...prev, [result.id]: 'removing' }));
        setTimeout(() => {
          setCart((prev) => {
            const next = { ...prev };
            delete next[result.id];
            return next;
          });
        }, 600);
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Stories                                    */
/* -------------------------------------------------------------------------- */

const Frame = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto w-[680px] max-w-[92vw] pt-4 pb-[420px]">
    {children}
  </div>
);

const meta = {
  title: 'Components/OmniSearch',
  component: OmniSearch,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
  },
  argTypes: {
    surface: {
      control: 'inline-radio',
      options: ['inline', 'modal', 'auto'],
    },
  },
  // Required props live here so each story (which renders the stateful demo
  // wrapper instead) still satisfies the OmniSearch prop contract.
  args: {
    query: '',
    onQueryChange: () => undefined,
    sections: [],
    labels: LABELS,
  },
} satisfies Meta<typeof OmniSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** All three result groups in the inline dropdown (the always-on header bar). */
export const InlineAllGroups: Story = {
  name: 'Inline · all groups',
  render: () => (
    <Frame>
      <OmniSearchDemo surface="inline" initialQuery="dns" startOpen />
    </Frame>
  ),
  // Interaction test (run by test-storybook in CI): once results load, the
  // scope tabs and all three groups render. Wait on the tabs first — they only
  // appear after results arrive (the group ids also exist during the loading
  // skeleton phase). Assert by test id since tab/heading labels share text.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => canvas.getByTestId('shared.omniSearch.tabs'), {
      timeout: 3000,
    });
    canvas.getByTestId('shared.omniSearch.group.domains');
    canvas.getByTestId('shared.omniSearch.group.destinations');
    canvas.getByTestId('shared.omniSearch.group.resources');
  },
};

/** Domain availability rows with inline add-to-cart (click to watch states). */
export const DomainResults: Story = {
  name: 'Inline · domains + add-to-cart',
  render: () => (
    <Frame>
      <OmniSearchDemo surface="inline" initialQuery="vault" startOpen />
    </Frame>
  ),
  // Interaction test: add-to-cart transitions a domain row to the in-cart state.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const addButton = await canvas.findByTestId(
      'shared.omniSearch.cart.dom-vault.xyz',
    );
    await userEvent.click(addButton);
    await waitFor(
      () => {
        const button = canvas.getByTestId(
          'shared.omniSearch.cart.dom-vault.xyz',
        );
        if (!IN_CART_REGEX.test(button.textContent ?? '')) {
          throw new Error('cart button has not reached the in-cart state');
        }
      },
      { timeout: 3000 },
    );
  },
};

/** ⌘K command-palette (modal). Trigger is the slim bar; opens centered. */
export const ModalPalette: Story = {
  name: 'Modal · ⌘K palette',
  render: () => (
    <Frame>
      <OmniSearchDemo surface="modal" initialQuery="auto" startOpen />
    </Frame>
  ),
};

/** Per-section skeletons while providers are fetching. */
export const Loading: Story = {
  name: 'Inline · loading',
  render: () => (
    <Frame>
      <OmniSearchDemo surface="inline" startOpen forceState="loading" />
    </Frame>
  ),
};

/** Empty state for a query that matched nothing. */
export const Empty: Story = {
  name: 'Inline · empty',
  render: () => (
    <Frame>
      <OmniSearchDemo surface="inline" startOpen forceState="empty" />
    </Frame>
  ),
};

/** RTL (ar-EG): logical CSS flips spacing, the result arrow mirrors. */
export const RTL: Story = {
  name: 'Inline · RTL (ar-EG)',
  parameters: { locale: 'ar-EG' },
  render: () => (
    <Frame>
      <OmniSearchDemo surface="inline" initialQuery="dns" startOpen />
    </Frame>
  ),
};

/** Interactive playground — switch surfaces and type your own query. */
export const Playground: Story = {
  args: { surface: 'inline' },
  render: (args) => (
    <Frame>
      <OmniSearchDemo surface={args.surface} initialQuery="dns" startOpen />
    </Frame>
  ),
};
