import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../base';

export const registryRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        query: z.string(),
        parentDomain: z.enum(['0x.city', 'defi.build']),
      }),
    )
    .query(async () => {}),
});
