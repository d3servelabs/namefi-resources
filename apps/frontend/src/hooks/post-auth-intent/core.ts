'use client';

import { useAuth } from '@/hooks/use-auth';
import { useLogin } from '@/hooks/use-login';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { ZodType } from 'zod';

export type PostAuthIntentBase = {
  version: number;
  kind: string;
  returnPath: string;
};

export type PostAuthIntentHandlers<TIntent extends PostAuthIntentBase> =
  Partial<{
    [TKind in TIntent['kind']]: (
      intent: Extract<TIntent, { kind: TKind }>,
    ) => Promise<void> | void;
  }>;

type SessionIntentStoreParams<
  TIntent extends PostAuthIntentBase,
  TStageInput,
> = {
  storageKey: string;
  schema: ZodType<TIntent>;
  buildIntent: (input: TStageInput) => unknown;
};

function canUseSessionStorage() {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(window.sessionStorage);
  } catch {
    return false;
  }
}

export function getCurrentReturnPath() {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}`;
}

export function createSessionIntentStore<
  TIntent extends PostAuthIntentBase,
  TStageInput,
>({
  storageKey,
  schema,
  buildIntent,
}: SessionIntentStoreParams<TIntent, TStageInput>) {
  function clearIntent() {
    if (!canUseSessionStorage()) return;
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch {
      return;
    }
  }

  function readIntent() {
    if (!canUseSessionStorage()) return null;

    let raw: string | null = null;
    try {
      raw = window.sessionStorage.getItem(storageKey);
    } catch {
      return null;
    }
    if (!raw) return null;

    try {
      return schema.parse(JSON.parse(raw));
    } catch {
      clearIntent();
      return null;
    }
  }

  function stageIntent(input: TStageInput) {
    if (!canUseSessionStorage()) return false;

    let intent: TIntent;
    try {
      intent = schema.parse(buildIntent(input));
    } catch {
      return false;
    }

    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(intent));
      return true;
    } catch {
      return false;
    }
  }

  return {
    clearIntent,
    readIntent,
    stageIntent,
  };
}

export function useRequireStoredPostAuthIntent<TStageInput>(
  stageIntent: (input: TStageInput) => boolean,
) {
  const { isAuthenticated } = useAuth();
  const { login } = useLogin();

  return useCallback(
    (intent: TStageInput) => {
      if (isAuthenticated) return true;
      const didStageIntent = stageIntent(intent);
      if (!didStageIntent) {
        toast.error('Could not save this action before login', {
          description: 'Please sign in first, then try again.',
        });
        return false;
      }
      void login().catch((error) => {
        toast.error('Could not start sign in', {
          description:
            error instanceof Error ? error.message : 'Please try again.',
        });
      });
      return false;
    },
    [isAuthenticated, login, stageIntent],
  );
}

/**
 * Executes one staged post-auth intent after authentication. The store object
 * must be stable because store.readIntent and store.clearIntent are used from
 * the effect dependency path; create it at module scope or memoize it.
 */
export function useStoredPostAuthIntentExecutor<
  TIntent extends PostAuthIntentBase,
>(
  store: {
    clearIntent: () => void;
    readIntent: () => TIntent | null;
  },
  handlers: PostAuthIntentHandlers<TIntent>,
) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handlersRef = useRef(handlers);
  const executingIntentRef = useRef<string | null>(null);
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const intent = store.readIntent();
    if (!intent) return;

    const currentReturnPath = searchParamsString
      ? `${pathname}?${searchParamsString}`
      : pathname;
    if (currentReturnPath !== intent.returnPath) {
      router.replace(intent.returnPath as Route);
      return;
    }

    const handler = handlersRef.current[intent.kind as TIntent['kind']] as
      | ((intent: TIntent) => Promise<void> | void)
      | undefined;
    if (!handler) return;

    const executionKey = `${intent.kind}:${intent.returnPath}`;
    // Avoid duplicate execution while the same staged intent is already running.
    if (executingIntentRef.current === executionKey) return;
    executingIntentRef.current = executionKey;
    // Clear before executing so remounts or auth hydration cannot duplicate work.
    store.clearIntent();

    Promise.resolve(handler(intent))
      .catch((error) => {
        toast.error('Could not resume your action', {
          description:
            error instanceof Error ? error.message : 'Please try again.',
        });
      })
      .finally(() => {
        executingIntentRef.current = null;
      });
  }, [isAuthenticated, pathname, router, searchParamsString, store]);
}
