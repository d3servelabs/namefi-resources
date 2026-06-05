import { Hono } from 'hono';
import type { ConnInfo } from 'hono/conninfo';
import type { RequestInfo } from '#lib/request-info';

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
import { dnsRecordsRouterOrpc } from '#trpc/routers/orpc/dnsRecordsRouter.orpc';
import { domainConfigRouterOrpc } from '#trpc/routers/orpc/domainConfigRouter.orpc';
import { userDataRouterOrpc } from '#trpc/routers/orpc/userDataRouter.orpc';
import { ordersRouterOrpc } from '#trpc/routers/orpc/ordersRouter.orpc';
import { balanceRouterOrpc } from '#trpc/routers/orpc/balanceRouter.orpc';
import { searchRouterOrpc } from '#trpc/routers/orpc/searchRouter.orpc';
import { outboundRouterOrpc } from '#trpc/routers/orpc/outboundRouter.orpc';
import { siweRouter } from '#trpc/routers/orpc/siwe.orpc';
import { eip712Router } from '#trpc/routers/orpc/eip712.orpc';

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
import {
  ERC1271_ACCOUNT_HEADER,
  EIP1271_ACCOUNT_HEADER,
  EIP7702_ACCOUNT_HEADER,
} from '#lib/auth/wallet-auth';
import { X402PaymentRequiredError } from '#lib/x402/helpers';
import { createRedisRateLimiter } from '#lib/rate-limit';
import {
  parseAcceptMediaTypes,
  acceptIncludesHtml,
  acceptOnlyHtml,
  isBrowserUserAgent,
} from '#lib/content-negotiation';

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

const _orpcRouter = toORPCRouter(
  createTRPCRouter({
    dnsRecords: dnsRecordsRouterOrpc,
    domainConfig: domainConfigRouterOrpc,
    user: userDataRouterOrpc,
    orders: ordersRouterOrpc,
    balance: balanceRouterOrpc,
    search: searchRouterOrpc,
    outbound: outboundRouterOrpc,
    siwe: siweRouter,
    eip712: eip712Router,
  }),
);
export const orpcRouter = os
  .$config({
    initialOutputValidationIndex: Number.NaN,
  })
  .router(_orpcRouter as never) as unknown as typeof _orpcRouter;

const openAPIGenerator = new OpenAPIGenerator({
  schemaConverters: [
    defaultEip712SchemaConverter,
    new ZodToJsonSchemaConverterWithEip712(),
  ],
});

const openApiDocument = await openAPIGenerator.generate(
  base.router(orpcRouter as never) as never,
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
      { name: 'domain-config' },
      { name: 'orders' },
      { name: 'user' },
      { name: 'balance' },
      { name: 'search' },
      { name: 'outbound' },
      { name: 'eip712' },
    ],
    security: [{ apiKeyAuth: [] }, { bearerAuth: [] }],
    components: {
      securitySchemes: {
        apiKeyAuth: {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
);

export const providersRouter = new Hono();
const _logger = createLogger({ context: 'providersRouter' });

// Limit each client IP to 60 requests per minute across the OpenAPI/oRPC
// surface, enforced via the shared Redis store so the limit holds across all
// backend instances. Registered first so it runs ahead of every route.
providersRouter.use(
  '/*',
  createRedisRateLimiter({
    points: 60,
    duration: 60,
    keyPrefix: 'rl:v-next:ip',
  }),
);

const EIP7702_ACCOUNT_HEADER_PARAMETER_REF =
  '#/components/parameters/Eip7702AccountHeader';
const EIP1271_ACCOUNT_HEADER_PARAMETER_REF =
  '#/components/parameters/Eip1271AccountHeader';
const ERC1271_ACCOUNT_HEADER_PARAMETER_REF =
  '#/components/parameters/Erc1271AccountHeader';

type OpenApiParameter = {
  in?: string;
  name?: string;
} & Partial<Record<'$ref', string>>;

type OpenApiMethod = {
  parameters?: OpenApiParameter[];
  tags?: string[];
  responses?: unknown;
  operationId?: string;
  'x-badges'?: Array<{ name: string; color: string }>;
  'x-openai-isConsequential'?: boolean;
};

const CONSEQUENTIAL_OPERATION_IDS = new Set([
  'startOutboundRun',
  'prepareOutboundOutreach',
  'registerDomain',
  'registerWithRecords',
]);

function isOpenApiMethod(method: unknown): method is OpenApiMethod {
  return !!method && typeof method === 'object' && !Array.isArray(method);
}

function withDelegatedAccountHeaders(method: unknown) {
  if (!isOpenApiMethod(method)) {
    return method;
  }

  const parameters = Array.isArray(method.parameters) ? method.parameters : [];
  const existingRefs = new Set(
    parameters
      .map((parameter) => parameter.$ref)
      .filter((parameterRef): parameterRef is string => !!parameterRef),
  );
  const existingHeaderNames = new Set(
    parameters
      .filter((parameter) => parameter.in === 'header')
      .map((parameter) => parameter.name)
      .filter((parameterName): parameterName is string => !!parameterName),
  );
  const nextParameters = [...parameters];

  if (
    !existingRefs.has(EIP7702_ACCOUNT_HEADER_PARAMETER_REF) &&
    !existingHeaderNames.has(EIP7702_ACCOUNT_HEADER)
  ) {
    nextParameters.push({
      $ref: EIP7702_ACCOUNT_HEADER_PARAMETER_REF,
    });
  }

  if (
    !existingRefs.has(EIP1271_ACCOUNT_HEADER_PARAMETER_REF) &&
    !existingHeaderNames.has(EIP1271_ACCOUNT_HEADER)
  ) {
    nextParameters.push({
      $ref: EIP1271_ACCOUNT_HEADER_PARAMETER_REF,
    });
  }

  if (
    !existingRefs.has(ERC1271_ACCOUNT_HEADER_PARAMETER_REF) &&
    !existingHeaderNames.has(ERC1271_ACCOUNT_HEADER)
  ) {
    nextParameters.push({
      $ref: ERC1271_ACCOUNT_HEADER_PARAMETER_REF,
    });
  }

  return {
    ...method,
    parameters: nextParameters,
  };
}

function mapOpenApiMethod(method: unknown) {
  if (!isOpenApiMethod(method)) {
    return method;
  }

  const nextMethod = withDelegatedAccountHeaders(method);
  if (!isOpenApiMethod(nextMethod)) {
    return nextMethod;
  }
  const methodWithConsequentialFlag = CONSEQUENTIAL_OPERATION_IDS.has(
    nextMethod.operationId ?? '',
  )
    ? {
        ...nextMethod,
        'x-openai-isConsequential': true,
      }
    : nextMethod;

  if (!methodWithConsequentialFlag?.tags?.includes('EIP712')) {
    return methodWithConsequentialFlag;
  }

  return {
    ...methodWithConsequentialFlag,
    tags: methodWithConsequentialFlag.tags?.filter((tag) => tag !== 'EIP712'),
    'x-badges': [{ name: 'EIP712', color: '#b5f5ce' }],
  };
}

function buildOpenApiDocument() {
  return {
    ...openApiDocument,
    components: {
      ...openApiDocument.components,
      parameters: {
        ...(openApiDocument.components?.parameters ?? {}),
        Eip7702AccountHeader: {
          name: EIP7702_ACCOUNT_HEADER,
          in: 'header',
          required: false,
          schema: {
            type: 'string',
          },
          description:
            'Optional delegated account address to authenticate as when the signer is an approved signer. Preferred header name.',
        },
        Eip1271AccountHeader: {
          name: EIP1271_ACCOUNT_HEADER,
          in: 'header',
          required: false,
          schema: {
            type: 'string',
          },
          description:
            'Legacy alias for x-namefi-erc1271-account. When multiple delegated account headers are present, x-namefi-eip7702-account takes precedence, then x-namefi-erc1271-account.',
        },
        Erc1271AccountHeader: {
          name: ERC1271_ACCOUNT_HEADER,
          in: 'header',
          required: false,
          schema: {
            type: 'string',
          },
          description:
            'Optional delegated account address to authenticate as when the signer is an approved signer. Preferred ERC-1271 header name.',
        },
      },
    },
    paths: mapObjIndexed(
      (path) => {
        return mapObjIndexed(
          (method) => mapOpenApiMethod(method),
          path as Record<string, unknown>,
        );
      },
      openApiDocument.paths as Record<string, Record<string, unknown>>,
    ),
  };
}

/**
 * Decide whether `/openapi/doc` should render the Scalar HTML reference or
 * return the raw OpenAPI JSON. HTML is reserved for human/browser traffic:
 * either a browser user-agent that explicitly accepts HTML, or a request whose
 * Accept header asks for HTML and nothing else. Everything else (API clients,
 * curl, programmatic fetch without an HTML Accept) receives JSON.
 */
function shouldServeHtmlReference(
  userAgent: string | undefined,
  acceptHeader: string | undefined,
): boolean {
  const mediaTypes = parseAcceptMediaTypes(acceptHeader);

  return (
    (isBrowserUserAgent(userAgent) && acceptIncludesHtml(mediaTypes)) ||
    acceptOnlyHtml(mediaTypes)
  );
}

providersRouter.get('/openapi/doc', (c, next) => {
  // The representation depends on both Accept and User-Agent, so tell caches to
  // key on them and avoid serving HTML to an API client (or vice versa).
  c.header('Vary', 'Accept, User-Agent');

  if (
    !shouldServeHtmlReference(
      c.req.header('user-agent'),
      c.req.header('accept'),
    )
  ) {
    return c.json(buildOpenApiDocument());
  }

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
  })(c, next) as Promise<Response>;
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
    onError((error: unknown) => {
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
  const honoVars = c.var as {
    requestId: string;
    connInfo: ConnInfo;
    requestInfo: RequestInfo;
  };
  const clientIp =
    honoVars.requestInfo?.ipAddress ??
    honoVars.connInfo?.remote?.address ??
    null;
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
        requestInfo: RequestInfo;
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
  return c.json(buildOpenApiDocument());
});
