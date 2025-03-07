'use client';

import type { AppRouter } from '@namefi-astra/backend/trpc';
import { createTRPCContext } from '@trpc/tanstack-react-query';

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();
