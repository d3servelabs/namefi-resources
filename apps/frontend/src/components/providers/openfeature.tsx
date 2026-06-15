'use client';

import { config } from '@/lib/env';
import { useAuth, useMyPermissions } from '@/hooks/use-auth';
import { LaunchDarklyClientProvider } from '@openfeature/launchdarkly-client-provider';
import { OpenFeature, OpenFeatureProvider } from '@openfeature/react-sdk';
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

  const permissionsQuery = useMyPermissions();

  const namefiUserId = user?.id;
  const privyUserId = privyUser?.id;
  const email =
    user?.displayProfile?.email ?? privyUser?.email?.address ?? undefined;
  const userMainWalletAddress = (
    user as { mainWalletAddress?: string | null } | undefined
  )?.mainWalletAddress;
  const mainWalletAddress = userMainWalletAddress ?? undefined;
  const isAdmin = (permissionsQuery.data?.length ?? 0) > 0;

  useEffect(() => {
    ensureProviderRegistered();
    if (!config.LAUNCHDARKLY_CLIENT_SIDE_ID) return;
    const targetingKey = namefiUserId ?? privyUserId ?? 'anonymous';
    void OpenFeature.setContext({
      targetingKey,
      kind: 'user',
      anonymous: !isAuthenticated,
      ...(namefiUserId ? { namefiUserId } : {}),
      ...(privyUserId ? { privyUserId } : {}),
      ...(email ? { email } : {}),
      ...(mainWalletAddress ? { mainWalletAddress } : {}),
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
