import { z } from 'zod';

import type { ProcedureContract } from './trpc-contract';

/**
 * Contract for the top-level `version` procedure.
 *
 * This is not a sub-router but a single top-level query attached to the
 * root `appRouter`. It returns the backend's public version metadata.
 */
export const versionContract = {
  type: 'query',
  input: z.void(),
  output: z.object({
    commit_date: z.string(),
    commit_hash: z.string(),
    version: z.string(),
    name: z.string().optional(),
  }),
} as const satisfies ProcedureContract;

export type VersionContract = typeof versionContract;
