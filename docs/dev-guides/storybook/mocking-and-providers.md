# Mocking and Providers

This guide covers how to mock TRPC, set up provider stacks, and troubleshoot common provider-related errors in Storybook stories.

## Mocking TRPC for Page Stories

Use the mock link in `apps/frontend/src/lib/mock/trpc.ts` (imported as `@/lib/mock/trpc`), as demonstrated in `apps/frontend/src/stories/pages/my-orders.stories.tsx`.

### Pattern

1. Create a `QueryClient` with `retry: false` and `staleTime: Infinity`
2. Build a `trpcClient` with `createTRPCClient` and `createMockLink`
3. Provide `isAuthenticated` (and optionally `user` or `impersonationData` for built-in `users.getUser` and `users.getImpersonationStatus` mocks)
4. In `getMockData`, switch on `opts.op.path` and return a tuple:
   - Success: `[null, data]`
   - Error: `[{ textCode, httpStatus, message }, null]`
   - Loading: `new Promise(() => {})` to keep the request pending
5. Wrap the page with `QueryClientProvider` and `TRPCProvider`, then any app providers required by the page

### Example

```tsx
const trpcClient = createTRPCClient<AppRouter>({
  links: [
    createMockLink({
      isAuthenticated: true,
      getMockData: async (opts) => {
        if (opts.op.path === 'orders.getOrderItems') {
          return [null, mockOrderItems];
        }
        return [
          { textCode: 'BAD_REQUEST', httpStatus: 400, message: 'unknown path' },
          null,
        ];
      },
    }),
  ],
});
```

If you need an unauthenticated state, set `isAuthenticated: false`. `createMockLink` returns `UNAUTHORIZED` for `users.getUser` and `users.getImpersonationStatus`; for other protected procedures return an `UNAUTHORIZED` error tuple from `getMockData`.

## Provider Stack Checklist

Components using `useAuth()` require multiple providers. Here's the typical provider stack for authenticated component stories:

1. **MockPrivyProvider** - Mocks Privy authentication state (from `@/lib/mock/privy`)
2. **WagmiProvider** - Required for wallet-related hooks
3. **QueryClientProvider** - Required for React Query
4. **TRPCProvider** - Required for TRPC hooks (useAuth uses useTRPC internally)
5. **ConsentManagerProvider** - Required for consent hooks (useAuth uses useConsentIdentify)

### Mock Wagmi Config

```tsx
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, base } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';

const MOCK_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';

const mockWagmiConfig = createConfig({
  chains: [mainnet, sepolia, base],
  connectors: [mock({ accounts: [MOCK_WALLET_ADDRESS as `0x${string}`] })],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
  },
});
```

### Full Authenticated Provider Setup

```tsx
import { MockPrivyProvider, privyMockUser } from '@/lib/mock/privy';
import { TRPCProvider } from '@/lib/trpc';
import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '@namefi-astra/backend/trpc';
import { createMockLink } from '@/lib/mock/trpc';
import { ConsentManagerProvider } from '@c15t/nextjs';

function AuthenticatedStoryProviders({
  children,
  walletAddress,
}: {
  children: ReactNode;
  walletAddress: string;
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      createMockLink({
        isAuthenticated: true,
        getMockData: async () => [null, {}] as const,
      }),
    ],
  });

  return (
    <MockPrivyProvider
      value={{
        ready: true,
        authenticated: true,
        user: {
          ...privyMockUser,
          wallet: { ...privyMockUser.wallet, address: walletAddress },
          linkedAccounts: privyMockUser.linkedAccounts.map((account) =>
            account.type === 'wallet'
              ? { ...account, address: walletAddress }
              : account,
          ),
        },
      }}
    >
      <WagmiProvider config={mockWagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
            <ConsentManagerProvider options={{ mode: 'offline' }}>
              {children}
            </ConsentManagerProvider>
          </TRPCProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MockPrivyProvider>
  );
}
```

## Common Errors and Fixes

### Error: "An unknown Component is an async Client Component"

**Cause**: You imported a Next.js App Router route module (`@/app/**/page.tsx`, etc.) into a story. These modules may be async Server Components.

**Fix**: Extract the UI into a sync leaf component and import that instead. See [Writing Stories - App Router Pitfalls](./writing-stories.md#app-router--server-components-pitfalls).

### Error: "useConfig must be used within WagmiProvider"

**Cause**: A component in the story calls a wagmi hook (directly or indirectly) but the story's provider stack is missing `WagmiProvider`.

**Fix**: Wrap your story with `WagmiProvider` and pass a mocked wagmi config (see example above).

### Error: "invariant expected app router to be mounted"

**Cause**: A component uses `next/navigation` hooks (`useRouter`, `useSearchParams`, etc.) but Next.js app router context is not mocked.

**Fix**: Add `nextjs.appDirectory: true` to your story's meta parameters:

```tsx
parameters: {
  nextjs: {
    appDirectory: true,
    navigation: {
      pathname: '/',
    },
  },
},
```

### Error: "must be used within a Provider" (generic)

**Cause**: A component expects a React context provider that's missing from the story's provider stack.

**Fix**: Check which provider is missing based on the hook being used:

| Hook/Feature | Required Provider |
|--------------|-------------------|
| `useAuth()` | `MockPrivyProvider` + `TRPCProvider` + `ConsentManagerProvider` |
| TRPC queries/mutations | `TRPCProvider` + `QueryClientProvider` |
| `useConsentIdentify` | `ConsentManagerProvider options={{ mode: 'offline' }}` |
| Wagmi hooks (`useAccount`, `useBalance`, etc.) | `WagmiProvider config={mockWagmiConfig}` |
| React Query hooks | `QueryClientProvider` |

## Debugging Provider Errors Checklist

When a story fails with provider-related errors, check:

1. **Next.js navigation hooks** - Add `nextjs.appDirectory: true` to parameters
2. **TRPC hooks** - Wrap with `TRPCProvider` and mocked `trpcClient`
3. **Consent hooks** - Wrap with `ConsentManagerProvider options={{ mode: 'offline' }}`
4. **Auth hooks** - Wrap with `MockPrivyProvider` with appropriate auth state
5. **Wagmi hooks** - Wrap with `WagmiProvider config={mockWagmiConfig}`
