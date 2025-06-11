import { createTRPCRouter, publicProcedure } from '../base';

import { aiRouter } from './aiRouter';
import { cartsRouter } from './cartsRouter';
import { dnsRecordsRouter } from './dnsRecordsRouter';
import { domainConfigRouter } from './domainConfig/domainConfigRouter';
import { ordersRouter } from './ordersRouter';
import { paymentsRouter } from './paymentsRouter';
import { registryRouter } from './registryRouter';
import { searchRouter } from './searchRouter';
import { usersRouter } from './usersRouter';

export const appRouter = createTRPCRouter({
  ai: aiRouter,
  dnsRecords: dnsRecordsRouter,
  users: usersRouter,
  carts: cartsRouter,
  payments: paymentsRouter,
  search: searchRouter,
  registry: registryRouter,
  orders: ordersRouter,
  domainConfig: domainConfigRouter,

  version: publicProcedure.query(() => {
    const result = {
      version: process.env.npm_package_version,
      name: process.env.npm_package_name,
    };

    return result;
  }),
});

export type AppRouter = typeof appRouter;
