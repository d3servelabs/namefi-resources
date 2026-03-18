import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { x402ResourceServer as X402ResourceServer } from '@x402/hono';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import {
  HTTPFacilitatorClient,
  type FacilitatorConfig,
} from '@x402/core/server';
import { createFacilitatorConfig as createCdpFacilitatorConfig } from '../coinbase/facilitator';
import { createFacilitatorConfig as create1ShotFacilitatorConfig } from '../1shot/facilitator';
const logger = createLogger({ context: 'X402' });

function getFacilitatorConfig(): FacilitatorConfig {
  switch (secrets.X402_FACILITATOR_KEY) {
    case 'ONESHOT':
      if (secrets.ONESHOT_API_KEY && secrets.ONESHOT_API_KEY_SECRET) {
        return create1ShotFacilitatorConfig(
          secrets.ONESHOT_API_KEY,
          secrets.ONESHOT_API_KEY_SECRET,
        );
      }
      break;
    case 'CDP':
      if (secrets.CDP_API_KEY_ID && secrets.CDP_API_KEY_SECRET) {
        return createCdpFacilitatorConfig(
          secrets.CDP_API_KEY_ID,
          secrets.CDP_API_KEY_SECRET,
        );
      }
      break;
  }

  return {
    url: config.X402_FACILITATOR_URL,
  };
}

export const facilitatorClient = new HTTPFacilitatorClient(
  getFacilitatorConfig(),
);

export const x402ResourceServer = new X402ResourceServer(
  facilitatorClient,
).register(config.X402_NETWORK, new ExactEvmScheme());
await x402ResourceServer.initialize();

logger.info(
  x402ResourceServer.hasRegisteredScheme('eip155:84532', 'exact'),
  'hasRegisteredScheme',
);
logger.info(
  x402ResourceServer.getSupportedKind(2, 'eip155:84532', 'exact'),
  'getSupportedKind',
);
