import { createTRPCRouter } from '../base';
import { cartsRouter } from './cartsRouter';
import { dnsRecordsRouter } from './dnsRecordsRouter';
import { usersRouter } from './usersRouter';
export const appRouter = createTRPCRouter({
  dnsRecords: dnsRecordsRouter,
  users: usersRouter,
  carts: cartsRouter,
});

export type AppRouter = typeof appRouter;
