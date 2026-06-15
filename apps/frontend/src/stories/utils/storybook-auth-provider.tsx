import { AuthProvider } from '@/components/providers/auth';
import type { PropsWithChildren, ReactNode } from 'react';
import { WagmiProvider as BaseWagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, base, sepolia } from 'wagmi/chains';
import { useConfig } from 'wagmi';

const storybookWagmiConfig = createConfig({
  chains: [mainnet, base, sepolia],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
  },
});

function useOptionalWagmiConfig() {
  try {
    // biome-ignore lint/correctness/useHookAtTopLevel: Storybook adapter detects whether a story already provided wagmi.
    return useConfig();
  } catch {
    return null;
  }
}

export function StorybookAuthProvider({
  children,
  isAuthenticated,
}: {
  children: ReactNode;
  isAuthenticated: boolean;
}) {
  return (
    <AuthProvider
      initialCookieSnapshot={{
        hasPrivyToken: isAuthenticated,
        hasPrivySession: false,
      }}
    >
      {children}
    </AuthProvider>
  );
}

export function WagmiProvider({ children }: PropsWithChildren) {
  const existingConfig = useOptionalWagmiConfig();

  if (existingConfig) {
    return children;
  }

  return (
    <BaseWagmiProvider config={storybookWagmiConfig}>
      {children}
    </BaseWagmiProvider>
  );
}

export function useHasWagmiRuntime() {
  return Boolean(useOptionalWagmiConfig());
}
