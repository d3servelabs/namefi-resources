import type { User as PrivyUser, PrivyInterface } from '@privy-io/react-auth';
import { useMemo, useContext, createContext, type ReactNode } from 'react';

const MockPrivy = createContext<PrivyInterface | null>(null);
export const useMockPrivy = () => useContext(MockPrivy);

export const privyMockUser = Object.freeze({
  id: 'did:privy:cmcjax6ya00123z0nch67ge9x',
  createdAt: new Date('2025-06-27T06:47:06.000Z'),
  linkedAccounts: [
    {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      type: 'wallet',
      verifiedAt: new Date('2025-06-27T06:47:06.000Z'),
      firstVerifiedAt: new Date('2025-06-27T06:47:06.000Z'),
      latestVerifiedAt: new Date('2026-01-29T10:18:46.000Z'),
      chainType: 'ethereum',
      walletClientType: 'metamask',
      connectorType: 'injected',
    },
    {
      address: 'dev-team@d3serve.xyz',
      type: 'email',
      verifiedAt: new Date('2025-06-27T12:20:35.000Z'),
      firstVerifiedAt: new Date('2025-06-27T12:20:35.000Z'),
      latestVerifiedAt: new Date('2026-01-29T11:13:10.000Z'),
    },
  ],
  email: {
    address: 'dev-team@d3serve.xyz',
  },
  wallet: {
    address: '0xB5856d4598c919834913b8656ebc15a64d3C7836',
    chainType: 'ethereum',
    walletClientType: 'metamask',
    connectorType: 'injected',
  },
  delegatedWallets: [],
  mfaMethods: [],
  hasAcceptedTerms: false,
  isGuest: false,
  customMetadata: {
    data: '{"fullName":"D3Serve Team","address":{"city":"LA","state":"CA","zipCode":"90210","country":"US"}}',
  },
} as unknown as PrivyUser);

export function MockPrivyProvider({
  children,
  value: privyContext,
}: {
  children: ReactNode;
  value: Partial<PrivyInterface> | null;
}) {
  const context = useMemo(() => {
    const interm = {
      ready: true,
      authenticated: false,
      ...(privyContext || {}),
    };

    if (interm.ready && interm.authenticated && !interm.user) {
      interm.user = privyMockUser;
    }
    return interm;
  }, [privyContext]);
  return (
    <MockPrivy.Provider value={context as any}>{children}</MockPrivy.Provider>
  );
}
