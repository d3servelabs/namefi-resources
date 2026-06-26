import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MartListingCard } from '@/components/mart/mart-listing-card';
import { type ViewMode, ViewModeToggle } from '@/components/view-mode-toggle';
import type { DomainDetails } from '@/components/my-domains/marketplace-orders/use-domain-details';
import type { Listing } from '@/lib/marketplaces/types';

const TOKEN_ADDRESS = '0x0000000000cf80e7cf8fa4480907f692177f8e06';
const STORY_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';
const TOKEN_ID = '51239541894158249271820481024';

const listing: Listing = {
  id: `story-${TOKEN_ID}`,
  marketplace: 'opensea',
  source: 'OpenSea',
  tokenAddress: TOKEN_ADDRESS,
  tokenId: TOKEN_ID,
  seller: STORY_WALLET_ADDRESS,
  price: {
    raw: '420000000000000000',
    decimal: 0.42,
    currency: {
      contract: '0x0000000000000000000000000000000000000000',
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      isNative: true,
    },
  },
  createdAt: '2026-06-15T08:00:00.000Z',
  expirationTime: '2026-07-15T08:00:00.000Z',
  status: 'active',
  externalUrl: `https://opensea.io/assets/ethereum/${TOKEN_ADDRESS}/${TOKEN_ID}`,
  raw: {},
};

const details: DomainDetails = {
  tokenId: TOKEN_ID,
  chainId: 1,
  normalizedDomainName: 'primevault.com',
  expirationTime: new Date('2028-04-08T00:00:00.000Z'),
  ownerAddress: STORY_WALLET_ADDRESS,
  isLocked: false,
  imageUrl: 'https://namefi.io/assets/astra/NFTAssetPreview.png',
  metadataUrl: 'https://namefi.io/metadata/story.json',
};

const storyDomains = ['primevault.com', 'xn--bcher-kva.com', 'vault2.com'];

function NftViewModesDemo({ initialView }: { initialView: ViewMode }) {
  const t = useTranslations('shared');
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Marketplace listing</p>
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            labels={{
              label: t('viewSelector.label'),
              grid: t('viewSelector.grid'),
              list: t('viewSelector.list'),
            }}
          />
        </div>
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4'
              : 'grid gap-3'
          }
        >
          {Array.from({ length: viewMode === 'grid' ? 4 : 3 }).map(
            (_, index) => (
              <MartListingCard
                key={index}
                chainId={1}
                marketplaceId="opensea"
                listing={{
                  ...listing,
                  id: `${listing.id}-${index}`,
                  tokenId: `${TOKEN_ID}${index}`,
                }}
                details={{
                  ...details,
                  tokenId: `${TOKEN_ID}${index}`,
                  normalizedDomainName:
                    storyDomains[index] ?? `vault${index}.com`,
                }}
                ethUsdPrice={3500}
                canBuy={true}
                onBuy={() => undefined}
                viewMode={viewMode}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: 'Components/NFT View Modes',
  component: NftViewModesDemo,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
  },
  args: {
    initialView: 'grid',
  },
} satisfies Meta<typeof NftViewModesDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {
  args: { initialView: 'grid' },
};

export const CompactRows: Story = {
  args: { initialView: 'list' },
};
