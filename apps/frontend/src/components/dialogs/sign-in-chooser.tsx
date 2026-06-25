'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Loader2, Wallet2 } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getAddress, isAddressEqual, recoverMessageAddress } from 'viem';
import { useConfig, useSignMessage } from 'wagmi';
import { getAccount } from 'wagmi/actions';
import { useAppKit } from '@reown/appkit/react';
import {
  useAppKitWallet,
  type Wallet,
} from '@reown/appkit-wallet-button/react';
import { useLoginWithSiwe } from '@privy-io/react-auth';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { WagmiProvider } from '@/components/providers/wagmi';
import { waitForConnectFlowSettled } from '@/components/providers/reown-wallet-stack';
import { useLogin } from '@/hooks/use-login';
import { clientSideEnv } from '@/lib/env';
import { isClientDebugFlagEnabled } from '@/lib/debug-flag';

/**
 * ms to wait after closing this (modal) dialog before opening Privy's modal.
 *
 * The chooser is a Radix `modal` dialog: while open it marks the rest of the
 * DOM `aria-hidden` + `pointer-events:none` and traps focus. Privy renders its
 * email/login modal in a **sibling portal**, so opening it while the chooser is
 * still up gets it suppressed — the Privy modal flashes open then immediately
 * vanishes (reproduced live via headless Chrome; Privy's own network calls
 * succeed, so it's purely the modal-stacking conflict, not auth). Closing the
 * chooser first releases the dismissable-layer/focus lock; the dialog's close
 * animation is `duration-100`, so we wait just past it before mounting Privy.
 *
 * AppKit's wallet modal is a shadow-DOM web component and is NOT affected by the
 * chooser's `aria-hidden`, so the wallet path keeps the chooser open and only
 * this email→Privy handoff needs the delay.
 */
const PRIVY_HANDOFF_DELAY_MS = 300;

/**
 * Featured wallets shown as one-tap rows (Uniswap-style), top of the chooser.
 * Each id is a predefined Reown `WalletButtonsIds` key, so
 * `useAppKitWallet().connect(id)` connects that wallet directly and fires its
 * mobile deep link through the same AppKit engine the modal uses (so the
 * `installWalletDeepLinkShim` reroute to `location.href` still applies). Kept in
 * sync with `FEATURED_WALLET_IDS` in `reown-wallet-stack`.
 */
const FEATURED_WALLETS: ReadonlyArray<{ id: Wallet; name: string }> = [
  { id: 'metamask', name: 'MetaMask' },
  { id: 'imtoken', name: 'imToken' },
  { id: 'trust', name: 'Trust Wallet' },
  { id: 'rainbow', name: 'Rainbow' },
];
const isWalletSignInEnabled = Boolean(
  clientSideEnv.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
);

export interface SignInChooserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Sign-in chooser shown when a signed-out user clicks "Sign In". A single modal
 * (Uniswap-style) with the Namefi mark on top, a list of featured wallets, an
 * "or" divider, a single "Log in or Create Account" button, and Terms copy:
 *   - Wallet rows → Reown AppKit connect (featured-wallet deep link on mobile)
 *     → Privy `useLoginWithSiwe` to authenticate the identity. The wallet hooks
 *     live in {@link WalletList}, wrapped in {@link WagmiProvider} because the
 *     Sign In entry points render in the app shell, *outside* the per-route
 *     wagmi runtime (the provider is idempotent).
 *   - "Log in or Create Account" → the existing Privy email login via the app
 *     `requestLogin` machinery (`loginMethods: ['email']`). We close this dialog
 *     before handing off (see {@link PRIVY_HANDOFF_DELAY_MS}) so Privy's modal
 *     isn't suppressed.
 *
 * Keeping email on `requestLogin` means the whole session-settle pipeline in
 * `auth.tsx` is reused unchanged; the wallet path lets `loginWithSiwe` drive the
 * auth context (Privy authenticates + links the wallet), which the auth context
 * reacts to on its own — no hand-rolled session settling here.
 */
export function SignInChooserDialog({
  open,
  onOpenChange,
}: SignInChooserDialogProps) {
  const t = useTranslations('shared');
  const { login } = useLogin();
  const handoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasPendingEmailHandoff, setHasPendingEmailHandoff] = useState(false);

  // Clear any pending email-handoff timer if the chooser unmounts before it
  // fires, so we never pop Privy's modal after the flow was abandoned.
  useEffect(() => {
    return () => {
      if (handoffTimerRef.current !== null) {
        clearTimeout(handoffTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasPendingEmailHandoff || open) return;

    if (handoffTimerRef.current !== null) {
      clearTimeout(handoffTimerRef.current);
    }

    handoffTimerRef.current = setTimeout(() => {
      handoffTimerRef.current = null;
      setHasPendingEmailHandoff(false);
      void login({ loginMethods: ['email'] }).catch(() => {
        // The app login machinery surfaces its own load failures via a toast.
      });
    }, PRIVY_HANDOFF_DELAY_MS);

    return () => {
      if (handoffTimerRef.current !== null) {
        clearTimeout(handoffTimerRef.current);
        handoffTimerRef.current = null;
      }
    };
  }, [hasPendingEmailHandoff, login, open]);

  const handleLoginOrCreateAccount = useCallback(() => {
    // Close the chooser first. The effect above waits until `open=false` has
    // committed before opening Privy's modal, so the two modal stacks do not
    // fight over aria-hidden/focus state.
    // Guard against a rapid double-tap scheduling two handoffs (each would fire
    // its own login()): clear any pending timer before scheduling a new one.
    if (handoffTimerRef.current !== null) {
      clearTimeout(handoffTimerRef.current);
      handoffTimerRef.current = null;
    }
    setHasPendingEmailHandoff(true);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'sm:max-w-sm')}
        data-testid="shared.sign-in-chooser.dialog"
      >
        <DialogHeader className="items-center gap-3 text-center">
          <Image
            src="/logotype.svg"
            alt="Namefi"
            width={116}
            height={38}
            priority
            unoptimized
            data-testid="shared.sign-in-chooser.logo"
          />
          <DialogTitle data-testid="shared.sign-in-chooser.title">
            {t('signInChooser.title')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('signInChooser.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {isWalletSignInEnabled ? (
            <>
              <div className="flex flex-col gap-2">
                <p
                  className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  data-testid="shared.sign-in-chooser.wallet-heading"
                >
                  {t('signInChooser.walletHeading')}
                </p>
                <WagmiProvider>
                  <WalletList onSignedIn={() => onOpenChange(false)} />
                </WagmiProvider>
              </div>

              <div className="flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">
                  {t('signInChooser.or')}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          ) : null}

          <Button
            variant="outline"
            size="lg"
            className="h-auto justify-center py-3"
            onClick={handleLoginOrCreateAccount}
            data-testid="shared.sign-in-chooser.login"
          >
            {t('signInChooser.loginButton')}
          </Button>

          <p
            className="text-center text-xs text-muted-foreground"
            data-testid="shared.sign-in-chooser.tos"
          >
            {t.rich('signInChooser.tos', {
              link: (chunks) => (
                <a
                  href="/tos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface WalletListProps {
  onSignedIn: () => void;
}

/**
 * Diagnostic switch for the wallet sign-in SIWE step (`?siwe_debug=1`,
 * `localStorage.siwe_debug=1`, or `window.__SIWE_DEBUG=true`). When on, the
 * wallet branch recovers the signer from `(message, signature)` and surfaces the
 * expected-vs-recovered comparison in the console and error toast — so a Privy
 * "Invalid SIWE message and/or signature" rejection can be diagnosed from a
 * phone (recovered == expected → message/nonce side; != → signature/address
 * side) without a remote debugger.
 */
function isSiweDebug(): boolean {
  return isClientDebugFlagEnabled('siwe_debug', '__SIWE_DEBUG');
}

// Wallet-connect errors that mean "the user backed out", not a real failure —
// kept narrow so genuine errors (e.g. "connection closed", "AbortError") are NOT
// misclassified and swallowed.
const isUserAbortError = (message: string): boolean =>
  /\b(reject|denied|cancel|dismiss)/i.test(message);

/**
 * The wallet branch of the sign-in chooser — a list of one-tap featured wallets
 * plus an "all wallets" fallback. MUST render inside a wagmi runtime (its parent
 * wraps it in {@link WagmiProvider}) because it uses wagmi/AppKit hooks.
 *
 * Connect outcomes are driven by `useAppKitWallet`'s `onSuccess`/`onError`
 * callbacks rather than by awaiting `connect()` then polling global state:
 *   - `onSuccess` fires on the *active-address change* — i.e. the wallet the user
 *     just connected — so SIWE always targets the fresh wallet (never a stale,
 *     already-connected one) and a dismissed prompt cannot hang.
 *   - `onError` surfaces a genuine connect failure (the `connect()` promise
 *     itself resolves regardless, swallowing its own errors).
 * `attemptHandledRef` makes each tap settle exactly once across the two paths.
 *
 * Avoiding a double SIWE prompt: `loginWithSiwe` adds the wallet to Privy's
 * `linkedAccounts`, so the always-mounted `useReconcileConnectedWalletWithPrivy`
 * (in `reown-wallet-stack`) sees it as already-linked and does not fire its own
 * `linkWithSiwe`.
 */
function WalletList({ onSignedIn }: WalletListProps) {
  const t = useTranslations('shared');
  const config = useConfig();
  const { open } = useAppKit();
  const { signMessageAsync } = useSignMessage();
  const { generateSiweMessage, loginWithSiwe } = useLoginWithSiwe();
  // `null` = idle; a wallet id or 'other' = that row's connect is in flight.
  const [pending, setPending] = useState<Wallet | 'other' | null>(null);
  // One settle per tap, shared by the onSuccess/onError callbacks and the
  // "Other wallets" await path, so a connect never settles twice.
  const attemptHandledRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearPending = useCallback(() => {
    if (mountedRef.current) setPending(null);
  }, []);

  // SIWE-authenticate the just-connected wallet via Privy. Driven by the connect
  // payload (`connected`), which is authoritative for THIS connect, so we never
  // sign for a stale/lagging `getAccount` read; `getAccount` is consulted only
  // for the optional connector metadata Privy records.
  const completeSiweLogin = useCallback(
    async (connected: {
      address: string;
      caip2ChainId: `eip155:${number}`;
    }) => {
      let debugSuffix = '';
      try {
        // Privy's `generateSiweMessage` documents `address` as an EIP-55
        // mixed-case checksum address; normalize defensively since some mobile
        // WalletConnect connectors surface a lowercase address, which would make
        // the message Privy builds disagree with the recovered signer.
        const address = getAddress(connected.address);
        const caip2ChainId = connected.caip2ChainId;
        const connector = getAccount(config).connector;
        const message = await generateSiweMessage({
          address,
          chainId: caip2ChainId,
        });
        const signature = await signMessageAsync({ account: address, message });

        if (isSiweDebug()) {
          let recovered = 'n/a';
          let match = false;
          try {
            const recoveredAddress = await recoverMessageAddress({
              message,
              signature,
            });
            recovered = recoveredAddress;
            match = isAddressEqual(recoveredAddress, address);
          } catch (recoverError) {
            recovered = `recover-failed: ${String(recoverError)}`;
          }
          debugSuffix = ` [siwe-debug match=${match} expected=${address} recovered=${recovered} connector=${connector?.id}/${connector?.type}]`;
          console.info(
            '[siwe-debug] expected=%s recovered=%s match=%s chain=%s connector=%s/%s',
            address,
            recovered,
            match,
            caip2ChainId,
            connector?.id,
            connector?.type,
          );
          console.info('[siwe-debug] message=%s', message);
        }

        await loginWithSiwe({
          message,
          signature,
          walletClientType: connector?.id,
          connectorType: connector?.type,
        });

        // Privy is now authenticated and the wallet is linked; the app auth
        // context reacts on its own. Close the chooser.
        onSignedIn();
      } catch (error) {
        toast.error(t('signInChooser.errorTitle'), {
          description:
            (error instanceof Error
              ? error.message
              : t('signInChooser.errorDescription')) + debugSuffix,
        });
      }
    },
    [
      config,
      generateSiweMessage,
      signMessageAsync,
      loginWithSiwe,
      onSignedIn,
      t,
    ],
  );

  // `onSuccess` is invoked from inside `connect()`'s promise chain with the
  // freshly-connected CAIP address — use it directly (not a global re-read).
  const handleConnectSuccess = useCallback(
    (caip: { address: string; chainId: string | number }) => {
      if (attemptHandledRef.current) return;
      attemptHandledRef.current = true;
      void completeSiweLogin({
        address: caip.address,
        caip2ChainId: `eip155:${Number(caip.chainId)}`,
      }).finally(clearPending);
    },
    [completeSiweLogin, clearPending],
  );

  const handleConnectError = useCallback(
    (error: Error) => {
      if (attemptHandledRef.current) return;
      attemptHandledRef.current = true;
      clearPending();
      const message = error?.message ?? '';
      // A user-dismissed prompt is not an error; only surface real failures.
      if (message && !isUserAbortError(message)) {
        toast.error(t('signInChooser.errorTitle'), { description: message });
      }
    },
    [clearPending, t],
  );

  const { connect } = useAppKitWallet({
    onSuccess: handleConnectSuccess,
    onError: handleConnectError,
  });

  const handleConnect = useCallback(
    async (wallet: Wallet) => {
      attemptHandledRef.current = false;
      setPending(wallet);
      // AppKit connects the chosen wallet — on mobile this fires its deep link
      // (rerouted to `location.href` by installWalletDeepLinkShim). The outcome
      // arrives via onSuccess/onError, both invoked from inside `connect()`'s
      // own promise chain, so by the time this await resolves one has run.
      await connect(wallet);
      // Safety net only: release the spinner if neither callback settled it.
      if (!attemptHandledRef.current) clearPending();
    },
    [connect, clearPending],
  );

  // "Other wallets" → the full AppKit modal (QR + the long wallet list). This
  // path does NOT go through `useAppKitWallet().connect`, so onSuccess never
  // fires; we settle it here once the modal flow resolves.
  const handleOtherWallets = useCallback(async () => {
    attemptHandledRef.current = false;
    setPending('other');
    try {
      await open();
      await waitForConnectFlowSettled(config);
      const { address, chainId } = getAccount(config);
      if (address && chainId) {
        attemptHandledRef.current = true;
        await completeSiweLogin({
          address,
          caip2ChainId: `eip155:${chainId}`,
        });
      }
    } finally {
      clearPending();
    }
  }, [open, config, completeSiweLogin, clearPending]);

  const busy = pending !== null;

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-xl border border-border">
        {FEATURED_WALLETS.map((wallet, index) => (
          <button
            key={wallet.id}
            type="button"
            onClick={() => handleConnect(wallet.id)}
            disabled={busy}
            className={cn(
              'flex w-full items-center gap-3 px-4 py-3 text-start text-sm font-medium transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60',
              index > 0 && 'border-t border-border',
            )}
            data-testid={`shared.sign-in-chooser.wallet.${wallet.id}`}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Wallet2 className="size-4" />
            </span>
            <span className="flex-1">{wallet.name}</span>
            {pending === wallet.id && (
              <Loader2 className="size-4 shrink-0 animate-spin" />
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleOtherWallets}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 py-1 text-center text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
        data-testid="shared.sign-in-chooser.wallet.other"
      >
        {pending === 'other' && <Loader2 className="size-3 animate-spin" />}
        {pending === 'other'
          ? t('signInChooser.connecting')
          : t('signInChooser.otherWallets')}
      </button>
    </div>
  );
}
