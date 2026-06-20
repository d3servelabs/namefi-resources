import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { InstantBuy } from './instant-buy';
import type { BestListing } from '@/lib/opensea-listing';

/**
 * `InstantBuy` reads the domain's best OpenSea listing client-side and shows a
 * progressive CTA. These stories inject a mock `fetcher` so each state renders
 * deterministically without touching the network.
 */
const meta = {
  title: 'Park/Classic/InstantBuy',
  component: InstantBuy,
  parameters: { layout: 'centered' },
  args: {
    contract: '0x0000000000cf80e7cf8fa4480907f692177f8e06',
    tokenId: '12345',
    chain: 'ethereum',
    itemUrl:
      'https://opensea.io/item/ethereum/0x0000000000cf80e7cf8fa4480907f692177f8e06/12345',
  },
} satisfies Meta<typeof InstantBuy>;

export default meta;
type Story = StoryObj<typeof meta>;

const listedFetcher =
  (listing: BestListing) => async (): Promise<BestListing | null> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return listing;
  };

/** Domain is actively listed — the prominent priced CTA. */
export const Listed: Story = {
  args: {
    fetcher: listedFetcher({
      priceLabel: '2.5 ETH',
      itemUrl:
        'https://opensea.io/item/ethereum/0x0000000000cf80e7cf8fa4480907f692177f8e06/12345',
    }),
  },
};

/** Stuck in the in-flight state to show the "Checking price…" pill. */
export const Loading: Story = {
  args: {
    fetcher: () => new Promise<BestListing | null>(() => {}),
  },
};

/** Not listed (or read failed) — renders nothing. */
export const NotListed: Story = {
  args: {
    fetcher: async () => null,
  },
};
