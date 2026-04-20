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

let _facilitatorClient: HTTPFacilitatorClient | undefined;

export function getX402FacilitatorClient(): HTTPFacilitatorClient {
  if (!_facilitatorClient) {
    _facilitatorClient = new HTTPFacilitatorClient(getFacilitatorConfig());
  }
  return _facilitatorClient;
}

let _resourceServerPromise: Promise<X402ResourceServer> | undefined;

export function getX402ResourceServer(): Promise<X402ResourceServer> {
  if (_resourceServerPromise) return _resourceServerPromise;

  const promise = (async () => {
    const server = new X402ResourceServer(getX402FacilitatorClient()).register(
      config.X402_NETWORK,
      new ExactEvmScheme(),
    );
    await server.initialize();
    logger.debug(
      {
        hasRegisteredScheme: server.hasRegisteredScheme(
          'eip155:84532',
          'exact',
        ),
        supportedKind: server.getSupportedKind(2, 'eip155:84532', 'exact'),
      },
      'X402 resource server initialized',
    );
    return server;
  })();

  promise.catch((error) => {
    logger.error({ error }, 'Error initializing X402');
    _resourceServerPromise = undefined;
  });

  _resourceServerPromise = promise;
  return promise;
}
