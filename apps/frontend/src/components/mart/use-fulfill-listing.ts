'use client';

import { useConnectWallet } from '@privy-io/react-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { type Config, useConfig } from 'wagmi';
import {
  getAccount,
  getPublicClient,
  waitForTransactionReceipt,
  watchAccount,
} from 'wagmi/actions';
import { useWalletActionClient } from '@/hooks/use-wallet-action-client';
import { getMarketplace } from '@/lib/marketplaces/factory';
import { toBuyErrorMessage } from './fulfill-error';
import type { CollectionListingRow } from './use-collection-listings';

/**
 * Drive the in-app "Buy Now" purchase for a single `/mart` listing row:
 *
 *   connect wallet (any) → switch to the listing's chain → ask the adapter to
 *   fulfill the Seaport order from the buyer's wallet → wait for the receipt →
 *   refresh the grid so the bought listing drops off.
 *
 * Returns a react-query mutation; callers pass `onPurchased` to close their
 * confirm dialog on success. Toast lifecycle (submitted / success / error) is
 * handled here so every entry point gets consistent feedback.
 */
export function useFulfillListing(options?: {
  onPurchased?: (row: CollectionListingRow) => void;
}) {
  const t = useTranslations('mart');
  const config = useConfig();
  const queryClient = useQueryClient();
  const { connectWallet } = useConnectWallet();
  const resolveWalletClient = useWalletActionClient();

  return useMutation({
    mutationFn: async (row: CollectionListingRow) => {
      // A buyer can be any wallet. Read the live wagmi status at execution time
      // (not a render-time hook value, which can lag wagmi) and handle each
      // state distinctly:
      const status = getAccount(config).status;
      if (status === 'disconnected') {
        // No session — open Privy's connect modal. It resolves even if the user
        // dismisses it, and Privy can settle before wagmi reflects the account,
        // so wait briefly for `connected`; only a window that never resolves is
        // a genuine dismissal.
        await connectWallet();
        if (
          !(await waitForAccountConnected(config, CONNECT_READY_TIMEOUT_MS))
        ) {
          throw new Error('Wallet connection was cancelled.');
        }
      } else if (status !== 'connected') {
        // 'connecting' / 'reconnecting' — a session restore is already in
        // flight. Don't pop the modal; just give it longer to settle (restore
        // can outrun the short post-dismiss window).
        if (!(await waitForAccountConnected(config, RECONNECT_TIMEOUT_MS))) {
          throw new Error(
            'Wallet did not finish connecting. Please try again.',
          );
        }
      }
      const publicClient = getPublicClient(config, { chainId: row.chainId });
      if (!publicClient) {
        throw new Error('No RPC client available for this network.');
      }
      // Resolve fresh inside the mutation so a just-completed chain switch is
      // reflected (no expectedAddress — any connected wallet may buy).
      const walletClient = await resolveWalletClient({ chainId: row.chainId });
      const adapter = await getMarketplace({
        id: row.marketplaceId,
        chainId: row.chainId,
        publicClient,
        walletClient,
      });

      const { txHash } = await adapter.fulfillListing(row.listing);
      if (txHash) {
        await waitForTransactionReceipt(config, {
          hash: txHash,
          chainId: row.chainId,
        });
      }
      return { txHash, row };
    },
    onMutate: () => {
      toast.loading(t('buyToastSubmitted'), { id: 'mart-buy' });
    },
    onSuccess: ({ row }) => {
      toast.success(t('buyToastSuccess'), { id: 'mart-buy' });
      // Drop the just-bought listing from the grid.
      queryClient.invalidateQueries({ queryKey: ['mart-collection-listings'] });
      options?.onPurchased?.(row);
    },
    onError: (error) => {
      // Log the full error for debugging — the toast only shows a short reason.
      console.error('[mart] Buy Now failed:', error);
      toast.error(
        toBuyErrorMessage(error, {
          fallback: t('buyToastError'),
          rateLimited: t('buyToastRateLimited'),
        }),
        { id: 'mart-buy' },
      );
    },
  });
}

/** How long to wait for wagmi to reflect a wallet connection after Privy's
 *  `connectWallet` resolves. Long enough to absorb the Privy→wagmi sync, short
 *  enough that a dismissed modal fails fast (vs. the 5s readiness timeout). */
const CONNECT_READY_TIMEOUT_MS = 2500;

/** Longer window for an in-progress session restore (`reconnecting` /
 *  `connecting`), which there's no modal to dismiss and can take several
 *  seconds — so we don't misreport a slow restore as a failure. */
const RECONNECT_TIMEOUT_MS = 10_000;

/**
 * Resolve `true` once the wagmi account reports `connected`, or `false` if it
 * doesn't within `timeoutMs`. Watches account changes instead of polling once,
 * so a connection that lands a beat after `connectWallet` resolves isn't misread
 * as a cancellation.
 */
function waitForAccountConnected(
  config: Config,
  timeoutMs: number,
): Promise<boolean> {
  if (getAccount(config).status === 'connected') return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    let unwatch: () => void = () => {};
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      unwatch();
      resolve(value);
    };
    const timer = globalThis.setTimeout(() => finish(false), timeoutMs);
    unwatch = watchAccount(config, {
      onChange(account) {
        if (account.status === 'connected') finish(true);
      },
    });
    // Close the subscribe-after-check race: the account may have flipped to
    // `connected` in the gap between the initial read and the watcher taking
    // effect, and `onChange` only fires on *subsequent* changes.
    if (getAccount(config).status === 'connected') finish(true);
  });
}
