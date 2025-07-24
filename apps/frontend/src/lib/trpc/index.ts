'use client';

import type { AppRouter } from '@namefi-astra/backend/trpc';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { createTRPCContext } from '@trpc/tanstack-react-query';

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();

export type AppRouterOutput = inferRouterOutputs<AppRouter>;
export type AppRouterInput = inferRouterInputs<AppRouter>;
