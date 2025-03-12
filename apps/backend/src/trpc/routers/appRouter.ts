import { createTRPCRouter } from '../base';
import { dnsRecordsRouter } from './dnsRecordsRouter';

export const appRouter = createTRPCRouter({
  dnsRecords: dnsRecordsRouter,
});

export type AppRouter = typeof appRouter;
