import { createTRPCRouter, publicProcedure } from '../base';
import { config } from '../../lib/env';

export const configRouter = createTRPCRouter({
  allowedChains: publicProcedure.query(() => {
    return {
      chains: config.ALLOWED_CHAINS,
    };
  }),
});
