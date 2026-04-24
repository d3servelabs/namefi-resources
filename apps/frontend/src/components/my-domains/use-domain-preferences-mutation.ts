'use client';

import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type AppRouterInput, useTRPC } from '@/lib/trpc';
import type { DomainRow } from './types';

type UpdateInput =
  AppRouterInput['domainConfig']['updateDomainPreferencesAndConfig'];

/**
 * Toggle per-domain preferences (autoRenew / autoEns / autoPark / forwardTo)
 * with TanStack Query optimistic updates. `onMutate` patches the cached
 * `getCurrentUserDomains` rows; `onError` rolls back via the captured
 * snapshot; `onSettled` invalidates so the server response reconciles any
 * drift.
 */
export function useDomainPreferencesMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => trpc.users.getCurrentUserDomains.queryKey(),
    [trpc],
  );

  // Spreading `mutationOptions()` pre-types `onMutate`'s context as
  // `undefined`, which blocks our rollback snapshot. Pull only the
  // `mutationFn` (same pattern as `hooks/use-cart.ts` clearMutation).
  const mutationFn =
    trpc.domainConfig.updateDomainPreferencesAndConfig.mutationOptions()
      .mutationFn;

  return useMutation({
    mutationFn,
    onMutate: async ({
      domainName,
      domainPreferencesAndConfig: patch,
    }: UpdateInput) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<DomainRow[]>(queryKey);
      queryClient.setQueryData<DomainRow[]>(queryKey, (old) =>
        old?.map((d) =>
          d.normalizedDomainName === domainName
            ? {
                ...d,
                autoRenewEnabled: patch.autoRenewEnabled ?? d.autoRenewEnabled,
                autoEnsEnabled: patch.autoEnsEnabled ?? d.autoEnsEnabled,
              }
            : d,
        ),
      );
      return { prev };
    },
    onError: (_error, _input, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(queryKey, ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
