import { createTRPCRouter, publicProcedure } from '../base';

import { adminRouter } from './adminRouter';
import { aiRouter } from './aiRouter';
import { cartsRouter } from './cartsRouter';
import { dnsRecordsRouter } from './dnsRecordsRouter';
import { domainConfigRouter } from './domainConfig/domainConfigRouter';
import { huntRouter } from './huntRouter';
import { ordersRouter } from './ordersRouter';
import { paymentsRouter } from './paymentsRouter';
import { registryRouter } from './registryRouter';
import { searchRouter } from './searchRouter';
import { usersRouter } from './usersRouter';
import { wishlistRouter } from './wishlistRouter';

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  ai: aiRouter,
  dnsRecords: dnsRecordsRouter,
  users: usersRouter,
  carts: cartsRouter,
  payments: paymentsRouter,
  search: searchRouter,
  registry: registryRouter,
  orders: ordersRouter,
  domainConfig: domainConfigRouter,
  hunt: huntRouter,
  wishlist: wishlistRouter,

  version: publicProcedure.query(() => {
    const result = {
      version: process.env.npm_package_version,
      name: process.env.npm_package_name,
    };

    return result;
  }),
});

export type AppRouter = typeof appRouter;
