import type { AppRouter } from '@namefi-astra/backend/trpc';
import type { inferRouterOutputs } from '@trpc/server';

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type DomainAvailabilityInfo =
  inferRouterOutputs<AppRouter>['registry']['getDomainListInfo'][number];
