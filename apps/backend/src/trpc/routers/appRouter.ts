import { createTRPCRouter } from '../base';

import { cartsRouter } from './cartsRouter';
import { dnsRecordsRouter } from './dnsRecordsRouter';
import { ordersRouter } from './ordersRouter';
import { registryRouter } from './registryRouter';
import { searchRouter } from './searchRouter';
import { usersRouter } from './usersRouter';

export const appRouter = createTRPCRouter({
  dnsRecords: dnsRecordsRouter,
  users: usersRouter,
  carts: cartsRouter,
  search: searchRouter,
  registry: registryRouter,
  orders: ordersRouter,
});

export type AppRouter = typeof appRouter;
