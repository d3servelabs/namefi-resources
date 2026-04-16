import { z } from 'zod';

import type { ProcedureContract } from './trpc-contract';

/**
 * Contract for the top-level `version` procedure.
 *
 * This is not a sub-router but a single top-level query attached to the
 * root `appRouter`. It returns the backend's package name and version
 * (both may be `undefined` in local dev when `npm_package_*` env vars
 * aren't set).
 */
export const versionContract = {
  type: 'query',
  input: z.void(),
  output: z.object({
    version: z.string().optional(),
    name: z.string().optional(),
  }),
} as const satisfies ProcedureContract;

export type VersionContract = typeof versionContract;
