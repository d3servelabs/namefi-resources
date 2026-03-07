import { config } from '#lib/env';
import { createLogger } from '#lib/logger';
import { x402ResourceServer as X402ResourceServer } from '@x402/hono';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';

const logger = createLogger({ context: 'X402' });

export const facilitatorClient = new HTTPFacilitatorClient({
  url: config.X402_FACILITATOR_URL,
});

export const x402ResourceServer = new X402ResourceServer(
  facilitatorClient,
).register(config.X402_NETWORK, new ExactEvmScheme());
x402ResourceServer.initialize();

logger.info(
  x402ResourceServer.hasRegisteredScheme('eip155:84532', 'exact'),
  'hasRegisteredScheme',
);
logger.info(
  x402ResourceServer.getSupportedKind(2, 'eip155:84532', 'exact'),
  'getSupportedKind',
);
