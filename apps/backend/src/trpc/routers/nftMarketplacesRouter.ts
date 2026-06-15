import { nftMarketplacesContract } from '@namefi-astra/common/contract/nft-marketplaces-contract';
import { getOkxClient } from '#lib/external-api/okx-client';
import { protectedProcedure, publicProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';

/**
 * NFT-marketplace proxy router.
 *
 * A thin passthrough to the OKX REST APIs. It exists so the
 * browser marketplace adapters (`apps/frontend/src/lib/marketplaces/`) don't
 * have to hold the OKX HMAC secret — each procedure attaches credentials
 * (inside the backend client) and forwards. All vendor->internal translation
 * stays in the frontend adapters, so the responses here are passed through
 * largely untouched.
 *
 * Reads (`getListings` / `getOffers`) are `publicProcedure` — they expose
 * nothing more than what's already on the OKX website. Writes
 * (`createListing` / `submitListing` / `buy`) are `protectedProcedure` so
 * the backend doesn't act as an unauthenticated relay that burns the
 * shared OKX quota.
 */
export const nftMarketplacesRouter = createContractTRPCRouter<
  typeof nftMarketplacesContract
>({
  okx: {
    getListings: publicProcedure
      .input(nftMarketplacesContract.okx.getListings.input)
      .output(nftMarketplacesContract.okx.getListings.output)
      .query(({ input }) => getOkxClient().getListings(input)),
    getOffers: publicProcedure
      .input(nftMarketplacesContract.okx.getOffers.input)
      .output(nftMarketplacesContract.okx.getOffers.output)
      .query(({ input }) => getOkxClient().getOffers(input)),
    createListing: protectedProcedure
      .input(nftMarketplacesContract.okx.createListing.input)
      .output(nftMarketplacesContract.okx.createListing.output)
      .mutation(({ input }) => getOkxClient().createListing(input)),
    submitListing: protectedProcedure
      .input(nftMarketplacesContract.okx.submitListing.input)
      .output(nftMarketplacesContract.okx.submitListing.output)
      .mutation(({ input }) =>
        getOkxClient().submitListing({
          endpoint: input.endpoint,
          body: input.body,
        }),
      ),
    buy: protectedProcedure
      .input(nftMarketplacesContract.okx.buy.input)
      .output(nftMarketplacesContract.okx.buy.output)
      .mutation(({ input }) => getOkxClient().buy(input)),
    createListingPriapi: publicProcedure
      .input(nftMarketplacesContract.okx.createListingPriapi.input)
      .output(nftMarketplacesContract.okx.createListingPriapi.output)
      .mutation(({ input }) => getOkxClient().createListingPriapi(input)),
    getNftDetailInfo: publicProcedure
      .input(nftMarketplacesContract.okx.getNftDetailInfo.input)
      .output(nftMarketplacesContract.okx.getNftDetailInfo.output)
      .query(({ input }) => getOkxClient().getNftDetailInfo(input)),
    getTradeFees: publicProcedure
      .input(nftMarketplacesContract.okx.getTradeFees.input)
      .output(nftMarketplacesContract.okx.getTradeFees.output)
      .query(({ input }) => getOkxClient().getTradeFees(input)),
  },
});
