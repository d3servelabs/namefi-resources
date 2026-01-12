import { createTRPCRouter, publicProcedure } from '../base';
import { authRouter } from './authRouter';
import { freeClaimsRouter } from './freeClaimsRouter';
import { pbnIssuanceReservationsRouter } from './pbnIssuanceReservationsRouter';
import { adminRouter } from './adminRouter';
import { aiRouter } from './aiRouter';
import { analyticsRouter } from './analyticsRouter';
import { bigQueryAuditRouter } from './bigQueryAuditRouter';
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

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  ai: aiRouter,
  auth: authRouter,
  freeClaims: freeClaimsRouter,
  pbnReservations: pbnIssuanceReservationsRouter,
  analytics: analyticsRouter,
  bigQueryAudit: bigQueryAuditRouter,
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

  version: publicProcedure.query(() => {
    const result = {
      version: process.env.npm_package_version,
      name: process.env.npm_package_name,
    };

    return result;
  }),
  testSignedPayload: testSignedPayloadRouter,
});

export type AppRouter = typeof appRouter;
