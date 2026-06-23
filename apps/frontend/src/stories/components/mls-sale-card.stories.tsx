import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MlsSaleCard } from '@/components/mls/mls-sale-card';
import type { MlsSaleListing } from '@/lib/mls/feed';

const defaultSource = {
  id: 'x',
  label: 'X',
  kind: 'social',
  url: 'https://x.com/atlasdomains/status/1935600000000000000',
} satisfies NonNullable<MlsSaleListing['source']>;

const baseListing: MlsSaleListing = {
  id: 'story-atlas-ai',
  domain: 'atlas.ai',
  logoUrl: '/assets/astra/logos/opensea.svg',
  askingPrice: '12500',
  askingCurrency: 'USD',
  purchaseUrl: null,
  messageText:
    'Premium AI domain available now. Short, memorable, and ready for a serious buyer building in the agent infrastructure category.',
  seller: {
    username: 'atlasdomains',
    displayName: 'Atlas Domains',
    namefiDomainsCount: 14,
    tierDomainCount: 32,
  },
  otherDomainsCount: 18,
  source: defaultSource,
  sourceTweetUrl: 'https://x.com/atlasdomains/status/1935600000000000000',
  postedAt: '2026-03-17T09:30:00.000Z',
  listedAt: '2026-03-17T09:30:00.000Z',
};

const meta = {
  title: 'Components/MlsSaleCard',
  component: MlsSaleCard,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/feed',
      },
    },
  },
  render: (args) => (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <MlsSaleCard {...args} showReportAction={false} />
      </div>
    </div>
  ),
} satisfies Meta<typeof MlsSaleCard>;

// biome-ignore lint/style/noDefaultExport: Storybook stories require a default meta export.
export default meta;
type Story = StoryObj<typeof meta>;

function listingWith(
  overrides: Partial<Omit<MlsSaleListing, 'seller' | 'source'>> & {
    seller?: Partial<MlsSaleListing['seller']>;
    source?: Partial<NonNullable<MlsSaleListing['source']>>;
  },
): MlsSaleListing {
  return {
    ...baseListing,
    ...overrides,
    seller: {
      ...baseListing.seller,
      ...overrides.seller,
    },
    source: {
      ...defaultSource,
      ...overrides.source,
    },
  };
}

export const BrandedLogo: Story = {
  args: {
    listing: baseListing,
  },
};

export const LongPriceAndDomain: Story = {
  args: {
    listing: listingWith({
      id: 'story-long-domain',
      domain: 'artificial-intelligence-infrastructure.dev',
      logoUrl: null,
      askingPrice: '123456789.99',
      askingCurrency: 'USD',
      messageText:
        'Long-name stress case with a serious asking price. The layout should wrap the domain and keep the price readable without squeezing the listing metadata.',
      seller: {
        username: 'longtailnames',
        displayName: 'Longtail Names',
        tierDomainCount: 11,
      },
      otherDomainsCount: 9,
    }),
  },
};

export const SellerTiers: Story = {
  args: {
    listing: baseListing,
  },
  render: () => (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto grid max-w-4xl gap-4">
        <MlsSaleCard
          showReportAction={false}
          listing={listingWith({
            id: 'story-builder',
            domain: 'studio.xyz',
            logoUrl: null,
            askingPrice: '980',
            seller: {
              username: 'buildernames',
              displayName: 'Builder Names',
              tierDomainCount: 12,
            },
            otherDomainsCount: 11,
          })}
        />
        <MlsSaleCard
          showReportAction={false}
          listing={listingWith({
            id: 'story-maker',
            domain: 'liquid.market',
            logoUrl: '/assets/astra/logos/rarible.svg',
            askingPrice: '4200',
            seller: {
              username: 'liquiddomains',
              displayName: 'Liquid Domains',
              tierDomainCount: 31,
            },
            otherDomainsCount: 30,
          })}
        />
        <MlsSaleCard
          showReportAction={false}
          listing={listingWith({
            id: 'story-whale',
            domain: 'capital.com',
            logoUrl: '/assets/astra/logos/opensea.svg',
            askingPrice: '250000',
            seller: {
              username: 'capitaldesk',
              displayName: 'Capital Desk',
              tierDomainCount: 88,
            },
            otherDomainsCount: 87,
          })}
        />
      </div>
    </div>
  ),
};

export const SourceIdentity: Story = {
  args: {
    listing: baseListing,
  },
  render: () => (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto grid max-w-4xl gap-4">
        <MlsSaleCard
          showReportAction={false}
          listing={listingWith({
            id: 'story-source-x',
            domain: 'social.ai',
            logoUrl: null,
            askingPrice: '7500',
            source: {
              id: 'x',
              label: 'X',
              kind: 'social',
              url: 'https://x.com/atlasdomains/status/1935600000000000000',
            },
          })}
        />
        <MlsSaleCard
          showReportAction={false}
          listing={listingWith({
            id: 'story-source-dnforum',
            domain: 'forum.com',
            logoUrl: '/assets/astra/logos/rarible.svg',
            askingPrice: '9800',
            source: {
              id: 'dnforum',
              label: 'DNForum',
              kind: 'external',
              url: 'https://www.dnforum.com/',
            },
          })}
        />
        <MlsSaleCard
          showReportAction={false}
          listing={listingWith({
            id: 'story-source-namepros',
            domain: 'brokers.net',
            logoUrl: null,
            askingPrice: '18500',
            source: {
              id: 'namepros',
              label: 'NamePros',
              kind: 'external',
              url: 'https://www.namepros.com/',
            },
          })}
        />
        <MlsSaleCard
          showReportAction={false}
          listing={listingWith({
            id: 'story-source-namefi',
            domain: 'marketplace.xyz',
            logoUrl: '/assets/astra/logos/opensea.svg',
            askingPrice: '3200',
            source: {
              id: 'namefi_marketplace',
              label: 'Namefi',
              kind: 'internal_marketplace',
              url: 'https://namefi.io/',
            },
          })}
        />
      </div>
    </div>
  ),
};
