import { Hono } from 'hono';
import type { ConnInfo } from 'hono/conninfo';

import { createLogger } from '#lib/logger';
import { Scalar } from '@scalar/hono-api-reference';
import type { TrpcContextWithUserOrNull } from '#trpc/index';
import { toORPCRouter } from '@orpc/trpc';
import { onError, ORPCError, os, onStart } from '@orpc/server';
import { OpenAPIGenerator } from '@orpc/openapi';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { SmartCoercionPlugin } from '@orpc/json-schema';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { TRPCError } from '@trpc/server';
import { toOrpcError } from './orpc/helpers/errors';
import { type UserSelect, db } from '@namefi-astra/db';
import {
  createAuthContext,
  authenticateRequest,
  type AuthMethodResult,
} from '#lib/auth/auth-registry';
import { dnsRecordsRouterOrpc } from '#trpc/routers/dnsRecordsRouter.orpc';
import { userDataRouterOrpc } from '#trpc/routers/userDataRouter.orpc';
import { ordersRouterOrpc } from '#trpc/routers/ordersRouter.orpc';
import { balanceRouterOrpc } from '#trpc/routers/balanceRouter.orpc';
import { searchRouterOrpc } from '#trpc/routers/searchRouter.orpc';
import { siweRouter } from '#trpc/routers/siwe.orpc';
import { eip712Router } from '#trpc/routers/eip712.orpc';

import { createTRPCRouter } from '#trpc/base';
import { initializeAuthRegistry } from '#lib/auth/api-key-auth';
import {
  defaultEip712SchemaConverter,
  ZodToJsonSchemaConverterWithEip712,
} from '#lib/eip712/orpc-eip712-schema-converter';
import { mapObjIndexed } from 'ramda';
import {
  EIP712_SIGNATURE_HEADER_METHOD_ID,
  parseEIP712SignatureEnvelope,
} from '../lib/auth/methods/eip712/api-key-eip712';
import { X402PaymentRequiredError } from '#lib/x402/helpers';

const base = os.errors({
  BAD_REQUEST: {
    status: 400,
    message: 'Bad Request',
  },
  UNAUTHORIZED: {
    status: 401,
    message: 'Unauthorized',
  },
  FORBIDDEN: {
    status: 403,
    message: 'Forbidden',
  },
  NOT_FOUND: {
    status: 404,
    message: 'Not Found',
  },
  // METHOD_NOT_SUPPORTED: {
  //   status: 405,
  //   message: 'Method Not Supported',
  // },
  NOT_ACCEPTABLE: {
    status: 406,
    message: 'Not Acceptable',
  },
  TIMEOUT: {
    status: 408,
    message: 'Request Timeout',
  },
  CONFLICT: {
    status: 409,
    message: 'Conflict',
  },
  PRECONDITION_FAILED: {
    status: 412,
    message: 'Precondition Failed',
  },
  PAYMENT_REQUIRED: {
    status: 402,
    message: 'Payment Required',
  },
  // PAYLOAD_TOO_LARGE: {
  //   status: 413,
  //   message: 'Payload Too Large',
  // },
  // UNSUPPORTED_MEDIA_TYPE: {
  //   status: 415,
  //   message: 'Unsupported Media Type',
  // },
  // UNPROCESSABLE_CONTENT: {
  //   status: 422,
  //   message: 'Unprocessable Content',
  // },
  TOO_MANY_REQUESTS: {
    status: 429,
    message: 'Too Many Requests',
  },
  // CLIENT_CLOSED_REQUEST: {
  //   status: 499,
  //   message: 'Client Closed Request',
  // },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    message: 'Internal Server Error',
  },
  // NOT_IMPLEMENTED: {
  //   status: 501,
  //   message: 'Not Implemented',
  // },
  // BAD_GATEWAY: {
  //   status: 502,
  //   message: 'Bad Gateway',
  // },
  // SERVICE_UNAVAILABLE: {
  //   status: 503,
  //   message: 'Service Unavailable',
  // },
  // GATEWAY_TIMEOUT: {
  //   status: 504,
  //   message: 'Gateway Timeout',
  // },
});

export const orpcRouter = toORPCRouter(
  createTRPCRouter({
    dnsRecords: dnsRecordsRouterOrpc,
    user: userDataRouterOrpc,
    orders: ordersRouterOrpc,
    balance: balanceRouterOrpc,
    search: searchRouterOrpc,
    siwe: siweRouter,
    eip712: eip712Router,
  }),
);

const openAPIGenerator = new OpenAPIGenerator({
  schemaConverters: [
    defaultEip712SchemaConverter,
    new ZodToJsonSchemaConverterWithEip712(),
  ],
});

const openApiDocument = await openAPIGenerator.generate(
  base.router(orpcRouter as any) as any,
  {
    info: {
      title: 'Namefi API',
      version: 'next',
    },
    servers: [
      ...(process.env.ENVIRONMENT === 'local'
        ? [
            {
              url: 'http://localhost:3000/v-next/',
            },
          ]
        : []),
      ...(process.env.ENVIRONMENT === 'development'
        ? [
            {
              description: 'Dev Server',
              url: 'https://api.namefi.dev/v-next/',
            },
          ]
        : []),
      ...(process.env.ENVIRONMENT === 'production'
        ? [
            {
              description: 'Live Server',
              url: 'https://api.namefi.io/v-next/',
            },
          ]
        : []),
    ],
    tags: [
      { name: 'dns' },
      { name: 'orders' },
      { name: 'user' },
      { name: 'balance' },
      { name: 'search' },
      { name: 'eip712' },
    ],
    security: [{ apiKeyAuth: [] }],
    components: {
      securitySchemes: {
        apiKeyAuth: {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header',
        },
      },
    },
  },
);

export const providersRouter = new Hono();
const _logger = createLogger({ context: 'providersRouter' });

providersRouter.get('/openapi/doc', (c, next) => {
  const path = `${c.req.routePath}.json`;
  return Scalar({
    url: path,
    theme: 'fastify',
    baseServerURL:
      process.env.ENVIRONMENT === 'production'
        ? 'https://api.namefi.io/v-next'
        : process.env.ENVIRONMENT === 'development'
          ? 'https://api.namefi.dev/v-next'
          : process.env.ENVIRONMENT === 'preview'
            ? '/v-next'
            : 'http://localhost:3300/v-next',
  })(c, next);
});

const handler = new OpenAPIHandler(orpcRouter, {
  plugins: [
    new SmartCoercionPlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  clientInterceptors: [
    onStart((options) => {
      if (
        options.context.apiAuthResult?.methodId ===
        EIP712_SIGNATURE_HEADER_METHOD_ID
      ) {
        const acceptedPrimaryTypes =
          options.procedure?.['~orpc']?.meta?.eip712?.input
            ?.acceptedPrimaryTypes ?? [];
        const headers = options.context.req.header();
        if (acceptedPrimaryTypes.length > 0) {
          const type = headers['x-namefi-eip712-type'];
          if (!type) {
            throw new ORPCError('UNAUTHORIZED', {
              status: 401,
              message: 'No EIP 712 type provided',
            });
          }
          const isValid = acceptedPrimaryTypes.includes(type);
          if (!isValid) {
            throw new ORPCError('UNAUTHORIZED', {
              status: 401,
              message: 'Invalid EIP712 type',
            });
          }
        }
      }
    }),
  ],
  interceptors: [
    onError((error: any) => {
      if (
        error instanceof ORPCError &&
        'cause' in error &&
        error.cause instanceof TRPCError
      ) {
        throw toOrpcError(error.cause);
      }
    }),
    async (options) => {
      try {
        return await options.next();
      } catch (error) {
        if (
          error instanceof ORPCError &&
          'cause' in error &&
          error.cause instanceof TRPCError &&
          error.cause.cause instanceof X402PaymentRequiredError
        ) {
          return {
            matched: true,
            response: {
              status: 402,
              headers: error?.cause?.cause?.data?.headers ?? {},
              body: error?.cause?.cause?.data?.paymentRequiredResponse ?? {},
            },
          };
        }
        throw error;
      }
    },
  ],
});

function getRequestForHandler({
  rawRequest,
  rawBody,
  authResult,
}: {
  rawRequest: Request;
  rawBody: string;
  authResult: AuthMethodResult;
}): Request {
  if (authResult.methodId !== EIP712_SIGNATURE_HEADER_METHOD_ID) {
    return rawRequest;
  }

  if (rawRequest.method === 'GET' || rawRequest.method === 'HEAD') {
    return rawRequest;
  }

  const parsedEnvelope = parseEIP712SignatureEnvelope(rawBody);
  if (!parsedEnvelope.valid || !parsedEnvelope.envelope) {
    return rawRequest;
  }

  const headers = new Headers(rawRequest.headers);
  headers.delete('content-length');
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return new Request(rawRequest, {
    headers,
    body: JSON.stringify(parsedEnvelope.envelope.payload ?? null),
  });
}

providersRouter.use('/*', async (c, next) => {
  const honoVars = c.var as { requestId: string; connInfo: ConnInfo };
  const clientIp = honoVars.connInfo?.remote?.address || null;
  const rawBody = await c.req.raw.clone().text();
  const authCtx = createAuthContext(
    c.req.header(),
    rawBody,
    c.req.path,
    c.req.method,
    clientIp,
  );
  authCtx.eip712Types = defaultEip712SchemaConverter.getTypes();
  const authResult: AuthMethodResult = await authenticateRequest(authCtx);
  let user: UserSelect | undefined;
  if (authResult.success) {
    user = authResult.user;
  }

  const requestForHandler = getRequestForHandler({
    rawRequest: c.req.raw,
    rawBody,
    authResult,
  });

  const { matched, response } = await handler.handle(requestForHandler, {
    prefix: '/v-next/',
    context: {
      apiAuthResult: authResult,
      req: c.req,
      res: c.res,
      honoCtx: c,
      db,
      /**
       * Cached list of the current user's permissions for this request lifecycle.
       * Populated in protected middleware when user is known.
       */
      userPermissions: [],
      poweredByNamefiDomain: null,
      /**
       * A test user we can provide to return when verifyUserAuthAndCreation is called from tests
       */
      testUser: null as UserSelect | null,
      sessionId: null as string | null,
      honoVars: c.var as {
        requestId: string;
        connInfo: ConnInfo;
      },
      user: user ?? null,
    } satisfies TrpcContextWithUserOrNull, // Provide initial context if needed
  });
  _logger.debug({
    matched,
    response: {
      status: response?.status,
    },
  });
  if (matched) {
    c.res.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    return c.newResponse(response.body, response);
  }

  await next();
});
initializeAuthRegistry();

providersRouter.get('/eip712/types', (c) => {
  return c.json(defaultEip712SchemaConverter.getTypes());
});

providersRouter.get('/openapi/doc.json', (c) => {
  const overridenOpenApiDocument = {
    ...openApiDocument,
    paths: mapObjIndexed((path) => {
      return mapObjIndexed((method: { tags?: string[]; 'x-badges'?: any }) => {
        if (method?.tags?.includes('EIP712')) {
          method.tags = method.tags?.filter((tag: any) => tag !== 'EIP712');
          method['x-badges'] = [{ name: 'EIP712', color: '#b5f5ce' }];
        }
        return method;
      }, path as any);
    }, openApiDocument.paths as any),
  };
  return c.json(overridenOpenApiDocument);
});
