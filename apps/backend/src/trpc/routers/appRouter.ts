import { versionContract } from '@namefi-astra/common/contract/version-contract';
import { getBackendVersionJson } from '#lib/version-info';
import { createTRPCRouter, publicProcedure } from '../base';
import { apiKeysRouter } from './apiKeysRouter';
import { authRouter } from './authRouter';
import { freeClaimsRouter } from './freeClaimsRouter';
import { pbnIssuanceReservationsRouter } from './pbnIssuanceReservationsRouter';
import { adminRouter } from './adminRouter';
import { aiRouter } from './aiRouter';
import { analyticsRouter } from './analyticsRouter';
import { cartsRouter } from './cartsRouter';
import { configRouter } from './configRouter';
import { dnsRecordsRouter } from './dnsRecordsRouter';
import { domainConfigRouter } from './domainConfig/domainConfigRouter';
import { huntRouter } from './hunt/huntRouter';
import { ordersRouter } from './ordersRouter';
import { paymentsRouter } from './paymentsRouter';
import { registryRouter } from './registryRouter';
import { searchRouter } from './searchRouter';
import { shareRouter } from './shareRouter';
import { usersRouter } from './usersRouter';
import { wishlistRouter } from './wishlistRouter';
import { poweredByNamefiOwnerRouter } from './poweredByNamefiOwnerRouter';
import { newsletterRouter } from './newsletterRouter';
import { feedbackRouter } from './feedbackRouter';
import { testSignedPayloadRouter } from './testSignedPayloadRouter';
import { dnsCacheRouter } from './dnsCacheRouter';
import { x402Router } from './x402Router';
import { mlsRouter } from './mlsRouter';
import { leadgenRouter } from './leadgenRouter';
import { notificationsRouter } from './notificationsRouter';
import { nftMarketplacesRouter } from './nftMarketplacesRouter';
import { announcementsRouter } from './announcementsRouter';

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  ai: aiRouter,
  apiKeys: apiKeysRouter,
  auth: authRouter,
  freeClaims: freeClaimsRouter,
  pbnReservations: pbnIssuanceReservationsRouter,
  analytics: analyticsRouter,
  config: configRouter,
  dnsRecords: dnsRecordsRouter,
  users: usersRouter,
  carts: cartsRouter,
  payments: paymentsRouter,
  search: searchRouter,
  registry: registryRouter,
  orders: ordersRouter,
  domainConfig: domainConfigRouter,
  hunt: huntRouter,
  share: shareRouter,
  wishlist: wishlistRouter,
  pbnOwner: poweredByNamefiOwnerRouter,
  newsletter: newsletterRouter,
  feedback: feedbackRouter,
  dnsCache: dnsCacheRouter,
  mls: mlsRouter,
  leadgen: leadgenRouter,
  notifications: notificationsRouter,
  nftMarketplaces: nftMarketplacesRouter,
  announcements: announcementsRouter,

  version: publicProcedure
    .input(versionContract.input)
    .output(versionContract.output)
    .query(() => getBackendVersionJson()),
  testSignedPayload: testSignedPayloadRouter,
  x402: x402Router,
});

export type AppRouter = typeof appRouter;
