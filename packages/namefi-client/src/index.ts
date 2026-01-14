import type { JsonifiedClient } from '@orpc/openapi-client';
import type { ContractRouterClient } from '@orpc/contract';
import {
  createORPCClient,
  onError,
  onFinish,
  onStart,
  onSuccess,
} from '@orpc/client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import contract from '../contract.json';
import type { orpcRouter as router } from '@namefi-astra/backend/openapi';

type CreateNamefiClientOptions = {
  authentication: {
    apiKey: string;
    type: 'API_KEY';
  };
  logger:
    | {
        info: (...args: any[]) => void;
        error: (...args: any[]) => void;
      }
    | boolean
    | undefined;
  baseUrl?: string;
};

export function createNamefiClient({
  authentication,
  logger,
  baseUrl = 'https://backend.astra.namefi.io',
}: CreateNamefiClientOptions) {
  const { apiKey } = authentication;
  const _logger = logger
    ? typeof logger === 'object'
      ? logger
      : {
          info: (...args: any[]) => console.log(...args),
          error: (...args: any[]) => console.error(...args),
        }
    : undefined;

  const url = new URL(baseUrl);
  url.pathname =
    '/' + [...url.pathname.split('/').filter(Boolean), 'v-next'].join('/');

  const link = new OpenAPILink(contract as unknown as typeof router, {
    url: url.toString(),
    headers: () => ({
      'x-api-key': apiKey,
    }),
    fetch: (request, init) => {
      return globalThis.fetch(request, {
        ...init,
        credentials: 'include', // Include cookies for cross-origin requests
      });
    },
    interceptors: [
      onError((error) => {
        _logger?.error(error);
      }),
      onFinish((response) => {
        _logger?.info('Request finished');
      }),
      onStart((request) => {
        _logger?.info('Request started');
      }),
      onSuccess((response) => {
        _logger?.info('Request succeeded');
      }),
    ],
  });

  const client: JsonifiedClient<ContractRouterClient<typeof router>> =
    createORPCClient(link);

  return client;
}
