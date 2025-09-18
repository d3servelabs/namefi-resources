import { createTRPCRouter, publicProcedure } from '../base';
import { freeClaimsRouter } from './freeClaimsRouter';
import { pbnIssuanceReservationsRouter } from './pbnIssuanceReservationsRouter';
import { adminRouter } from './adminRouter';
import { aiRouter } from './aiRouter';
import { analyticsRouter } from './analyticsRouter';
import { cartsRouter } from './cartsRouter';
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

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  ai: aiRouter,
  freeClaims: freeClaimsRouter,
  pbnReservations: pbnIssuanceReservationsRouter,
  analytics: analyticsRouter,
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

  version: publicProcedure.query(() => {
    const result = {
      version: process.env.npm_package_version,
      name: process.env.npm_package_name,
    };

    return result;
  }),
});

export type AppRouter = typeof appRouter;
