'use client';

import { config } from '@/lib/env';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { LaunchDarklyClientProvider } from '@openfeature/launchdarkly-client-provider';
import { OpenFeature, OpenFeatureProvider } from '@openfeature/react-sdk';
import { useQuery } from '@tanstack/react-query';
import { useEffect, type FC, type PropsWithChildren } from 'react';

let providerRegistered = false;
let unconfiguredWarned = false;

function ensureProviderRegistered() {
  if (providerRegistered) return;
  const clientSideId = config.LAUNCHDARKLY_CLIENT_SIDE_ID;
  if (!clientSideId) {
    if (!unconfiguredWarned) {
      unconfiguredWarned = true;
      // biome-ignore lint/suspicious/noConsole: one-shot bootstrap notice; no logger plumbing at this level
      console.warn(
        '[openfeature] LAUNCHDARKLY_CLIENT_SIDE_ID is not set; feature flags will fall back to defaults.',
      );
    }
    providerRegistered = true;
    return;
  }
  OpenFeature.setProvider(
    new LaunchDarklyClientProvider(clientSideId, { streaming: true }),
  );
  providerRegistered = true;
}

if (typeof window !== 'undefined') {
  ensureProviderRegistered();
}

export const OpenFeatureClientProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const {
    user,
    privyUser,
    isAuthenticated,
    isImpersonating,
    isSkipAuthActive,
  } = useAuth();

  const trpc = useTRPC();
  const permissionsQuery = useQuery(
    trpc.users.getMyPermissions.queryOptions(void 0, {
      enabled: isAuthenticated && !isSkipAuthActive,
      staleTime: 60_000,
      trpc: { context: { skipBatch: true } },
    }),
  );

  const namefiUserId = user?.id;
  const privyUserId = privyUser?.id;
  const email = user?.primaryEmail ?? privyUser?.email?.address ?? undefined;
  const mainWalletAddress = user?.mainWalletAddress ?? undefined;
  const isAdmin = (permissionsQuery.data?.length ?? 0) > 0;

  useEffect(() => {
    ensureProviderRegistered();
    if (!config.LAUNCHDARKLY_CLIENT_SIDE_ID) return;
    const targetingKey = namefiUserId ?? privyUserId ?? 'anonymous';
    void OpenFeature.setContext({
      targetingKey,
      kind: 'user',
      anonymous: !isAuthenticated,
      namefiUserId,
      privyUserId,
      email,
      mainWalletAddress,
      isAdmin,
      isImpersonating,
      isSkipAuth: isSkipAuthActive,
    });
  }, [
    namefiUserId,
    privyUserId,
    email,
    mainWalletAddress,
    isAdmin,
    isAuthenticated,
    isImpersonating,
    isSkipAuthActive,
  ]);

  return <OpenFeatureProvider>{children}</OpenFeatureProvider>;
};
