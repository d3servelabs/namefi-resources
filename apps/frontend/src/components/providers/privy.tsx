'use client';

import { useOrigin } from '@/components/providers/origin';
import { config } from '@/lib/env';
import {
  getAccessToken,
  PrivyProvider,
  useLogout as usePrivyLogout,
} from '@privy-io/react-auth';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
  type PropsWithChildren,
} from 'react';
import { toHex } from '@/lib/color';
import { registerAuthTokenSupplier } from '@/lib/auth-token-supplier';
import { PrivyAuthBridge } from './privy-auth-bridge';
import {
  PrivyRuntimeContext,
  registerPrivyRuntimeLogoutHandler,
  useHasPrivyRuntime,
} from './privy-runtime-context';
import {
  type AuthLogoutCallbacks,
  PrivyLogoutProvider,
} from './privy-logout-context';
import { PrivyLoginCommandBridge } from './privy-login-runtime';
import { PrivySessionRefreshCommandBridge } from './privy-session-runtime';

registerAuthTokenSupplier(getAccessToken);

export const SessionsProvider: FC<PropsWithChildren> = ({ children }) => {
  const origin = useOrigin();
  const hasPrivyRuntime = useHasPrivyRuntime();
  const [brandPrimary, setBrandPrimary] = useState<string>('#1cd17d');

  useEffect(() => {
    // Only access document on the client side
    const styles = getComputedStyle(document.documentElement);
    const primaryColor = styles.getPropertyValue('--color-brand-primary');
    if (primaryColor) {
      setBrandPrimary(primaryColor);
    }
  }, []);

  const logoSrc = origin.config?.pbnLogo?.image ?? '/logotype.svg';

  if (hasPrivyRuntime) {
    return children;
  }

  return (
    <PrivyProvider
      appId={config.PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: toHex(brandPrimary) as `#${string}`,
          logo: logoSrc,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'off',
          },
        },
      }}
    >
      <PrivyRuntimeContext.Provider value={true}>
        <PrivySessionRuntimeServices>
          <PrivyAuthBridge />
          {children}
        </PrivySessionRuntimeServices>
      </PrivyRuntimeContext.Provider>
    </PrivyProvider>
  );
};

export const PrivyRuntimeHost = SessionsProvider;

function PrivySessionRuntimeServices({ children }: PropsWithChildren) {
  const logoutCallbacksRef = useRef<AuthLogoutCallbacks | null>(null);
  const logoutSettledRef = useRef(false);

  const settleLogoutSuccess = useCallback(() => {
    if (logoutSettledRef.current) return;

    logoutSettledRef.current = true;
    logoutCallbacksRef.current?.onSuccess?.();
  }, []);

  const { logout } = usePrivyLogout({ onSuccess: settleLogoutSuccess });

  const requestLogout = useCallback(
    async ({ callbacks }: { callbacks?: AuthLogoutCallbacks } = {}) => {
      logoutCallbacksRef.current = callbacks ?? null;
      logoutSettledRef.current = false;

      try {
        await logout();
        settleLogoutSuccess();
      } finally {
        logoutCallbacksRef.current = null;
      }
    },
    [logout, settleLogoutSuccess],
  );

  useEffect(
    () => registerPrivyRuntimeLogoutHandler(requestLogout),
    [requestLogout],
  );

  return (
    <PrivyLogoutProvider requestLogout={requestLogout}>
      <PrivyLoginCommandBridge />
      <PrivySessionRefreshCommandBridge />
      {children}
    </PrivyLogoutProvider>
  );
}
