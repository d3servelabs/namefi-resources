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

export type EIP712Signer = {
  signTypedData: (data: {
    domain: {
      name: string;
      version: string;
      chainId?: number;
      verifyingContract?: `0x${string}`;
    };
    types: {
      [key: string]: {
        name: string;
        type: string;
      }[];
    };
    primaryType: string;
    message: Record<string, unknown>;
  }) => Promise<{ signature: string; address: string }>;
  generateNonce: () => string;
};

export type CreateNamefiClientAuth =
  | {
      apiKey: string;
      type: 'API_KEY';
    }
  | {
      type: 'EIP712';
      signer: EIP712Signer;
    };
type CreateNamefiClientOptions = {
  authentication: CreateNamefiClientAuth;
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
  const { type } = authentication;
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
    headers: async (options, path, input) => {
      if (type === 'API_KEY') {
        return {
          'x-api-key': authentication.apiKey,
        };
      }

      const eip712Ctx = getPath(path, contract)?.['~orpc']?.meta?.eip712;
      const primaryType = eip712Ctx?.input?.acceptedPrimaryTypes?.[0];

      if (!primaryType) {
        return {};
      }
      const { signature, address } = await authentication.signer.signTypedData({
        domain: {
          name: 'Namefi',
          version: '1',
        },
        types: eip712Ctx?.input?.types ?? {},
        primaryType,
        message: input as unknown as Record<string, unknown>,
      });
      return {
        'x-namefi-signer': address,
        'x-namefi-signature': signature,
        'x-namefi-eip712-type': primaryType,
      };
    },
    fetch: (request, init) => {
      return globalThis.fetch(request, {
        ...init,
        credentials: 'include', // Include cookies for cross-origin requests
      });
    },
    interceptors: [
      onStart((options) => {
        _logger?.info('Request started');

        if (
          type === 'EIP712' &&
          !!options?.input &&
          typeof options.input === 'object'
        ) {
          const eip712Ctx = getPath(options.path, contract)?.['~orpc']?.meta
            ?.eip712;
          const primaryType = eip712Ctx?.input?.acceptedPrimaryTypes?.[0];

          if (!primaryType) {
            return;
          }
          const clone: any = { ...options.input };
          Object.keys(clone).forEach((key) => {
            delete (options.input as any)[key];
          });
          Object.assign(options.input as any, {
            payload: clone as unknown as Record<string, unknown>,
            timestamp: Math.trunc(Date.now() / 1000),
            nonce: authentication.signer.generateNonce(),
          });
        }
      }),
      onError((error) => {
        _logger?.error(error);
      }),
      onFinish((_response) => {
        _logger?.info('Request finished');
      }),
      onSuccess((_response) => {
        _logger?.info('Request succeeded');
      }),
    ],
  });

  const client: JsonifiedClient<ContractRouterClient<typeof router>> =
    createORPCClient(link);

  return client;
}

function getPath(parts: readonly string[], object: Record<string, unknown>) {
  let current: any = object;
  for (const part of parts) {
    if (!!current && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}
