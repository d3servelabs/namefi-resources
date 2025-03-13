import { createTRPCRouter } from '../base';
import { dnsRecordsRouter } from './dnsRecordsRouter';
import { usersRouter } from './usersRouter';

export const appRouter = createTRPCRouter({
  dnsRecords: dnsRecordsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
