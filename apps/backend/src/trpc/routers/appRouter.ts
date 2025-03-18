import { createTRPCRouter } from '../base';
import { cartsRouter } from './cartsRouter';
import { checkoutsRouter } from './checkoutsRouter';
import { dnsRecordsRouter } from './dnsRecordsRouter';
import { usersRouter } from './usersRouter';
export const appRouter = createTRPCRouter({
  dnsRecords: dnsRecordsRouter,
  users: usersRouter,
  carts: cartsRouter,
  checkouts: checkoutsRouter,
});

export type AppRouter = typeof appRouter;
