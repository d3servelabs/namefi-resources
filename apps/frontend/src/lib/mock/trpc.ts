import superjson from 'superjson';
import {
  controlledLink,
  type ControlledLinkHandlerOptions,
} from '@samyx/trpc-utils';
import type { AppRouterOutput } from '@/lib/trpc';

export function createMockLink({
  isAuthenticated,
  user: $user,
  impersonationData: $impersonationData,
  permissionsData = [],
  getMockData = async () => [null, {}] as [null, any],
}: {
  isAuthenticated: boolean;
  user?: AppRouterOutput['users']['getUser'];
  impersonationData?: AppRouterOutput['users']['getImpersonationStatus'];
  permissionsData?: AppRouterOutput['users']['getMyPermissions'];
  getMockData: (
    opts: ControlledLinkHandlerOptions<unknown, unknown>,
  ) => Promise<
    [null | { textCode: string; httpStatus: number; message: string }, any]
  >;
}) {
  function wrapResponse(res: any) {
    return {
      json: {
        result: {
          data: superjson.serialize(res),
        },
      },
    };
  }

  const user = $user ?? {
    id: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
    stripeCustomerId: 'cus_SEo212w712hXZm',
    privyUserId: 'did:privy:cmcjax6ya00123z0nch67ge9x',
    subscribeToEmails: true,
    lastSignInAt: new Date('2026-01-28T17:20:47.000Z'),
    lastAccessedSessionAt: new Date('2026-01-28T17:20:55.411Z'),
    createdAt: new Date('2025-05-02T14:18:18.531Z'),
    updatedAt: new Date('2026-01-28T17:22:15.729Z'),
  };
  const impersonationData = $impersonationData ?? {
    impersonating: false,
    actorUserId: user.id,
    targetUserId: null,
    actor: null,
    target: null,
    targetPrivyUser: null,
    effectiveUser: user,
  };
  const unAuthedRes = (path: string) => ({
    json: {
      error: superjson.serialize({
        message: 'UNAUTHORIZED',
        code: -32001,
        data: {
          code: 'UNAUTHORIZED',
          httpStatus: 401,
          path,
          zodError: null,
        },
      }),
    },
  });

  return controlledLink({
    handler: async (opts) => {
      const path = opts.op.path;
      switch (opts.op.path) {
        case 'users.getUser':
          if (isAuthenticated && user) {
            return wrapResponse(user);
          }
          return unAuthedRes(path);

        case 'users.getSessionSnapshot':
          if (isAuthenticated && user) {
            return wrapResponse({
              user,
              permissions: permissionsData,
              impersonationStatus: impersonationData,
            });
          }
          return unAuthedRes(path);

        case 'users.getImpersonationStatus':
          if (isAuthenticated && impersonationData) {
            return wrapResponse(impersonationData);
          }
          return unAuthedRes(path);

        case 'users.getMyPermissions':
          if (isAuthenticated) {
            return wrapResponse(permissionsData);
          }
          return unAuthedRes(path);

        default:
          return getMockData(opts)
            .then(([error, data]: any) => {
              if (error) {
                return {
                  json: {
                    error: superjson.serialize({
                      message: error.message,
                      code: -32001,
                      data: {
                        code: error.textCode,
                        httpStatus: error.httpStatus,
                        path,
                        zodError: null,
                      },
                    }),
                  },
                };
              }

              return {
                json: { result: { data: superjson.serialize(data ?? {}) } },
                meta: {},
              };
            })
            .catch((error: any) => {
              return {
                json: {
                  error: superjson.serialize({
                    message: 'ERROR',
                    code: -32001,
                    data: {
                      code: 'INTERNAL_SERVER_ERROR',
                      httpStatus: 500,
                      path,
                      zodError: null,
                    },
                  }),
                },
              };
            });
      }
    },
    transformer: superjson,
  });
}
