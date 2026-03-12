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
import {
  createNamefiClientX402Fetch,
  type CreateNamefiClientX402Options,
  type NamefiClientContext,
} from './client-x402';

type NamefiClientLogger =
  | {
      info: (...args: any[]) => void;
      error: (...args: any[]) => void;
    }
  | boolean
  | undefined;

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
  logger: NamefiClientLogger;
  baseUrl?: string;
  x402?: CreateNamefiClientX402Options;
};

export type NamefiClient = JsonifiedClient<
  ContractRouterClient<typeof router, NamefiClientContext>
>;

export function createNamefiClient({
  authentication,
  logger,
  baseUrl = 'https://backend.astra.namefi.io',
  x402,
}: CreateNamefiClientOptions): NamefiClient {
  const _logger = logger
    ? typeof logger === 'object'
      ? logger
      : {
          info: (...args: any[]) => console.log(...args),
          error: (...args: any[]) => console.error(...args),
        }
    : undefined;

  const vNextUrl = new URL(baseUrl);
  vNextUrl.pathname =
    '/' + [...vNextUrl.pathname.split('/').filter(Boolean), 'v-next'].join('/');

  const link = new OpenAPILink<NamefiClientContext>(
    contract as unknown as typeof router,
    {
      url: (_options, path) => {
        const tags =
          getPath(path, contract)?.['~orpc']?.meta?.route?.tags ?? [];

        if (tags.includes('base-route')) {
          return baseUrl;
        }

        return vNextUrl.toString();
      },
      headers: async (_options, path, input) => {
        const headers: Record<string, string> = {};

        if (authentication.type === 'API_KEY') {
          headers['x-api-key'] = authentication.apiKey;
          return headers;
        }

        const eip712Ctx = getPath(path, contract)?.['~orpc']?.meta?.eip712;
        const primaryType = eip712Ctx?.input?.acceptedPrimaryTypes?.[0];

        if (!primaryType) {
          return headers;
        }

        const { signature, address } =
          await authentication.signer.signTypedData({
            domain: {
              name: 'Namefi',
              version: '1',
            },
            types: eip712Ctx?.input?.types ?? {},
            primaryType,
            message: input as unknown as Record<string, unknown>,
          });

        headers['x-namefi-signer'] = address;
        headers['x-namefi-signature'] = signature;
        headers['x-namefi-eip712-type'] = primaryType;

        return headers;
      },
      fetch: createNamefiClientX402Fetch({
        x402,
        logger: _logger,
      }),
      interceptors: [
        onStart((options) => {
          _logger?.info('Request started');

          if (
            authentication.type !== 'EIP712' ||
            !options?.input ||
            typeof options.input !== 'object'
          ) {
            return;
          }

          const eip712Ctx = getPath(options.path, contract)?.['~orpc']?.meta
            ?.eip712;
          const primaryType = eip712Ctx?.input?.acceptedPrimaryTypes?.[0];

          if (!primaryType) {
            return;
          }

          const clone: Record<string, unknown> = { ...options.input };
          Object.keys(clone).forEach((key) => {
            delete (options.input as Record<string, unknown>)[key];
          });
          Object.assign(options.input as Record<string, unknown>, {
            payload: clone,
            timestamp: Math.trunc(Date.now() / 1000),
            nonce: authentication.signer.generateNonce(),
          });
        }),
        onError((error) => {
          _logger?.error(error);
        }),
        onFinish(() => {
          _logger?.info('Request finished');
        }),
        onSuccess(() => {
          _logger?.info('Request succeeded');
        }),
      ],
    },
  );

  return createORPCClient(link) as NamefiClient;
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

export type {
  CreateNamefiClientX402Options,
  NamefiClientContext,
} from './client-x402';
export type {
  X402AcceptedPayment,
  X402PaymentPredicate,
  X402PaymentPredicateContext,
  X402PaymentRequired,
  X402RequestContext,
  X402Signer,
} from './x402';
