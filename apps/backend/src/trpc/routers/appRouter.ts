import { createTRPCRouter } from '../base';

import { cartsRouter } from './cartsRouter';
import { checkoutsRouter } from './checkoutsRouter';
import { dnsRecordsRouter } from './dnsRecordsRouter';
import { registryRouter } from './registryRouter';
import { searchRouter } from './searchRouter';
import { usersRouter } from './usersRouter';

export const appRouter = createTRPCRouter({
  dnsRecords: dnsRecordsRouter,
  users: usersRouter,
  carts: cartsRouter,
  checkouts: checkoutsRouter,
  search: searchRouter,
  registry: registryRouter,
});

export type AppRouter = typeof appRouter;
