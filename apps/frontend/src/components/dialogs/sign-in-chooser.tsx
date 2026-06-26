'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Loader2, Mail, Wallet2 } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { getAddress, isAddressEqual, recoverMessageAddress } from 'viem';
import { useConfig, useSignMessage } from 'wagmi';
import { getAccount } from 'wagmi/actions';
import { useAppKit } from '@reown/appkit/react';
import { useLoginWithSiwe, type LoginModalOptions } from '@privy-io/react-auth';
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
 * login modal in a **sibling portal**, so opening it while the chooser is still
 * up gets it suppressed — the Privy modal flashes open then immediately vanishes
 * (reproduced live via headless Chrome; Privy's own network calls succeed, so
 * it's purely the modal-stacking conflict, not auth). Closing the chooser first
 * releases the dismissable-layer/focus lock; the dialog's close animation is
 * `duration-100`, so we wait just past it before mounting Privy.
 *
 * AppKit's wallet modal is a shadow-DOM web component and is NOT affected by the
 * chooser's `aria-hidden`, so the wallet path keeps the chooser open and only
 * this Google/email→Privy handoff needs the delay.
 */
const PRIVY_HANDOFF_DELAY_MS = 300;

/**
 * Privy login methods behind the chooser's two non-wallet rows.
 *
 *   - The Google row is a one-tap social path (Google is the highest-converting
 *     social login, so it earns its own row instead of hiding in the modal).
 *   - The "email or others" row opens Privy's modal with email plus the
 *     remaining social/messenger methods; Google is omitted here because it
 *     already has its own row above.
 *
 * Each method must also be enabled in the Privy dashboard for the deployment to
 * surface it — the array only controls which enabled methods this entry point
 * requests. (`whatsapp` is not part of this Privy SDK's `LoginMethod` union, so
 * it is not listed; add it here if/when the SDK gains support.)
 */
const GOOGLE_LOGIN_METHODS: LoginModalOptions['loginMethods'] = ['google'];
const EMAIL_OR_OTHERS_LOGIN_METHODS: LoginModalOptions['loginMethods'] = [
  'email',
  'apple',
  'github',
  'linkedin',
  'telegram',
  'sms',
];

const isWalletSignInEnabled = Boolean(
  clientSideEnv.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
);

// Shared row styling for the stacked options in the single bordered group
// (Uniswap-style): full-width, icon + label, divider drawn by the caller via a
// `border-t` on every row but the first.
const OPTION_ROW_CLASS =
  'flex w-full items-center gap-3 px-4 py-3 text-start text-sm font-medium transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60';
const OPTION_ICON_CLASS =
  'flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted';

/** The multicolor Google "G" mark, inline so the Google row needs no asset. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export interface SignInChooserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Sign-in chooser shown when a signed-out user clicks "Sign In". A single modal
 * (Uniswap-style) with the Namefi mark on top and one bordered group of stacked
 * options, then Terms copy:
 *   - "Sign in with crypto wallet" → Reown AppKit modal (its own featured-wallet
 *     deep links on mobile) → Privy `useLoginWithSiwe` to authenticate the
 *     identity. The wallet hooks live in {@link WalletConnectController}, which
 *     is mounted **out-of-band** (a hidden, zero-size subtree) and **only after
 *     the user taps the crypto row** — so the Reown chunk's lazy load never
 *     blocks the always-visible Google/email rows, and is never fetched at all
 *     for users who don't pick crypto.
 *   - "Sign in with Google" / "Sign in with email or others" → the existing
 *     Privy login via the app `requestLogin` machinery, scoped to the relevant
 *     `loginMethods`. We close this dialog before handing off (see
 *     {@link PRIVY_HANDOFF_DELAY_MS}) so Privy's modal isn't suppressed.
 *
 * Keeping the non-wallet paths on `requestLogin` reuses the whole session-settle
 * pipeline in `auth.tsx` unchanged; the wallet path lets `loginWithSiwe` drive
 * the auth context (Privy authenticates + links the wallet), which the auth
 * context reacts to on its own — no hand-rolled session settling here.
 */
export function SignInChooserDialog({
  open,
  onOpenChange,
}: SignInChooserDialogProps) {
  const { login } = useLogin();
  const handoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Login methods queued for the Privy handoff once the chooser has closed, or
  // null when nothing is pending. Stored (rather than a boolean) so the same
  // close→reopen machinery drives both the Google and the email/others rows.
  const [pendingLoginMethods, setPendingLoginMethods] = useState<
    LoginModalOptions['loginMethods'] | null
  >(null);

  // Clear any pending handoff timer if the chooser unmounts before it fires, so
  // we never pop Privy's modal after the flow was abandoned.
  useEffect(() => {
    return () => {
      if (handoffTimerRef.current !== null) {
        clearTimeout(handoffTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingLoginMethods || open) return;

    if (handoffTimerRef.current !== null) {
      clearTimeout(handoffTimerRef.current);
    }

    const loginMethods = pendingLoginMethods;
    handoffTimerRef.current = setTimeout(() => {
      handoffTimerRef.current = null;
      setPendingLoginMethods(null);
      void login({ loginMethods }).catch(() => {
        // The app login machinery surfaces its own load failures via a toast.
      });
    }, PRIVY_HANDOFF_DELAY_MS);

    return () => {
      if (handoffTimerRef.current !== null) {
        clearTimeout(handoffTimerRef.current);
        handoffTimerRef.current = null;
      }
    };
  }, [pendingLoginMethods, login, open]);

  const requestPrivyLogin = useCallback(
    (loginMethods: LoginModalOptions['loginMethods']) => {
      // Close the chooser first. The effect above waits until `open=false` has
      // committed before opening Privy's modal, so the two modal stacks do not
      // fight over aria-hidden/focus state. Guard against a rapid double-tap
      // scheduling two handoffs by clearing any pending timer first.
      if (handoffTimerRef.current !== null) {
        clearTimeout(handoffTimerRef.current);
        handoffTimerRef.current = null;
      }
      setPendingLoginMethods(loginMethods);
      onOpenChange(false);
    },
    [onOpenChange],
  );

  const onGoogle = useCallback(
    () => requestPrivyLogin(GOOGLE_LOGIN_METHODS),
    [requestPrivyLogin],
  );
  const onEmailOrOthers = useCallback(
    () => requestPrivyLogin(EMAIL_OR_OTHERS_LOGIN_METHODS),
    [requestPrivyLogin],
  );

  // Crypto-wallet connect is wired out-of-band so the Google/email rows never
  // wait on (or are blocked by a failed) Reown chunk load: the wallet runtime
  // mounts in a hidden subtree, and only after the user picks the crypto row
  // (`walletRuntimeRequested`) — so non-wallet sign-in stays instant and the
  // wallet chunk is never fetched for users who don't choose it.
  const [walletRuntimeRequested, setWalletRuntimeRequested] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  // The controller publishes its imperative connect here once the runtime is
  // ready; `pendingConnectRef` remembers a tap that landed before then so the
  // first click still connects as soon as the chunk finishes loading.
  const connectWalletRef = useRef<(() => void) | null>(null);
  const pendingConnectRef = useRef(false);

  const handleWalletRuntimeReady = useCallback((connect: () => void) => {
    connectWalletRef.current = connect;
    if (pendingConnectRef.current) {
      pendingConnectRef.current = false;
      connect();
    }
  }, []);

  const onConnectWallet = useCallback(() => {
    setIsConnectingWallet(true);
    if (connectWalletRef.current) {
      connectWalletRef.current();
    } else {
      // Runtime not mounted yet — request it and connect once it's ready.
      pendingConnectRef.current = true;
      setWalletRuntimeRequested(true);
    }
  }, []);

  // When the chooser closes, cancel any crypto tap still waiting on the wallet
  // runtime to load and reset the row. Without this, a tap made just before the
  // user dismissed the chooser would flush once the chunk arrives and pop AppKit
  // unprompted, and reopening would leave the wallet row stuck on "Connecting…".
  useEffect(() => {
    if (open) return;
    pendingConnectRef.current = false;
    setIsConnectingWallet(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SignInChooserDialogContent>
        <SignInChooserContent
          walletEnabled={isWalletSignInEnabled}
          isConnectingWallet={isConnectingWallet}
          onConnectWallet={onConnectWallet}
          onGoogle={onGoogle}
          onEmailOrOthers={onEmailOrOthers}
        />
      </SignInChooserDialogContent>

      {isWalletSignInEnabled && walletRuntimeRequested && (
        // Mount the wallet runtime off-screen so its `next/dynamic` loading
        // fallback can never replace the always-visible Google/email rows. The
        // AppKit modal is a body-portaled web component, so clipping this
        // subtree to zero size does not hide the modal it opens.
        <div
          aria-hidden
          className="pointer-events-none fixed h-0 w-0 overflow-hidden opacity-0"
        >
          <WagmiProvider>
            <WalletConnectController
              onReady={handleWalletRuntimeReady}
              onConnectingChange={setIsConnectingWallet}
              onSignedIn={() => onOpenChange(false)}
            />
          </WagmiProvider>
        </div>
      )}
    </Dialog>
  );
}

/**
 * The dialog's inner card — the Namefi mark, an options group (passed as
 * `children`), and the Terms copy. Presentational: it renders only the chrome,
 * so a Storybook story can show the full `shared.sign-in-chooser.dialog` by
 * feeding it a {@link SignInChooserContent} without booting the wallet runtime.
 * Must be rendered inside a `<Dialog>` (it returns a `DialogContent`).
 */
export function SignInChooserDialogContent({
  children,
}: {
  children: ReactNode;
}) {
  const t = useTranslations('shared');
  return (
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
        {/* Kept for screen readers + Radix's required-title contract; the
            visible title was dropped — the logo + options are self-explanatory. */}
        <DialogTitle
          className="sr-only"
          data-testid="shared.sign-in-chooser.title"
        >
          {t('signInChooser.title')}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {t('signInChooser.description')}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-1">
        {children}

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
  );
}

export interface SignInChooserContentProps {
  /** Whether the crypto-wallet row is shown (needs a WalletConnect project id). */
  walletEnabled: boolean;
  /** True while the wallet connect + SIWE flow is in progress. */
  isConnectingWallet: boolean;
  onConnectWallet: () => void;
  onGoogle: () => void;
  onEmailOrOthers: () => void;
}

/**
 * Presentational body of the chooser: the three stacked options in one bordered
 * group (crypto wallet, Google, email or others). Pure — it takes plain handlers
 * and renders no wallet runtime, so the Storybook story can show every row
 * (including the wallet row) without booting Reown AppKit.
 */
export function SignInChooserContent({
  walletEnabled,
  isConnectingWallet,
  onConnectWallet,
  onGoogle,
  onEmailOrOthers,
}: SignInChooserContentProps) {
  const t = useTranslations('shared');

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {walletEnabled && (
        <button
          type="button"
          onClick={onConnectWallet}
          disabled={isConnectingWallet}
          className={OPTION_ROW_CLASS}
          data-testid="shared.sign-in-chooser.wallet"
        >
          <span className={OPTION_ICON_CLASS}>
            <Wallet2 className="size-4" />
          </span>
          <span className="flex-1">
            {isConnectingWallet
              ? t('signInChooser.connecting')
              : t('signInChooser.walletButton')}
          </span>
          {isConnectingWallet && (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          )}
        </button>
      )}

      <button
        type="button"
        onClick={onGoogle}
        className={cn(
          OPTION_ROW_CLASS,
          walletEnabled && 'border-t border-border',
        )}
        data-testid="shared.sign-in-chooser.google"
      >
        <span className={OPTION_ICON_CLASS}>
          <GoogleMark />
        </span>
        <span className="flex-1">{t('signInChooser.googleButton')}</span>
      </button>

      <button
        type="button"
        onClick={onEmailOrOthers}
        className={cn(OPTION_ROW_CLASS, 'border-t border-border')}
        data-testid="shared.sign-in-chooser.login"
      >
        <span className={OPTION_ICON_CLASS}>
          <Mail className="size-4" />
        </span>
        <span className="flex-1">{t('signInChooser.loginButton')}</span>
      </button>
    </div>
  );
}

interface WalletConnectControllerProps {
  /** Publishes the imperative connect fn once the wallet runtime is ready. */
  onReady: (connect: () => void) => void;
  /** Reports connect/SIWE in-flight state up to the crypto-wallet row. */
  onConnectingChange: (connecting: boolean) => void;
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

/**
 * Headless controller for the crypto-wallet row. MUST render inside a wagmi
 * runtime (the parent mounts it inside {@link WagmiProvider}) because it uses
 * wagmi/AppKit hooks. It renders nothing — it owns the connect + SIWE flow and
 * hands the parent an imperative `connect` (via `onReady`) plus connecting-state
 * updates, so the always-visible {@link SignInChooserContent} rows are never
 * gated by the wallet runtime's lazy load.
 *
 * The single "Sign in with crypto wallet" row opens the full AppKit modal
 * (`open()`), which already surfaces the featured wallets (MetaMask / imToken /
 * Trust / Rainbow, configured in `reown-wallet-stack`) and the full list — so
 * collapsing the per-wallet rows loses nothing. `open()` resolves when the modal
 * mounts, so we await {@link waitForConnectFlowSettled} for the real outcome,
 * then SIWE-authenticate the connected wallet through Privy.
 *
 * Avoiding a double SIWE prompt: `loginWithSiwe` adds the wallet to Privy's
 * `linkedAccounts`, so the always-mounted `useReconcileConnectedWalletWithPrivy`
 * (in `reown-wallet-stack`) sees it as already-linked and does not fire its own
 * `linkWithSiwe`.
 */
function WalletConnectController({
  onReady,
  onConnectingChange,
  onSignedIn,
}: WalletConnectControllerProps) {
  const t = useTranslations('shared');
  const config = useConfig();
  const { open } = useAppKit();
  const { signMessageAsync } = useSignMessage();
  const { generateSiweMessage, loginWithSiwe } = useLoginWithSiwe();

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

  // "Sign in with crypto wallet" → the full AppKit modal (featured wallets + QR
  // + the long wallet list). `open()` only resolves when the modal mounts, so we
  // await the settle signal, then SIWE the connected account. Never rejects, so
  // the parent can fire it without awaiting — open()/settle failures are
  // non-fatal here, and completeSiweLogin surfaces its own errors via toast.
  const connect = useCallback(async () => {
    onConnectingChange(true);
    try {
      await open();
      await waitForConnectFlowSettled(config);
      const { address, chainId } = getAccount(config);
      if (address && chainId) {
        await completeSiweLogin({
          address,
          caip2ChainId: `eip155:${chainId}`,
        });
      }
    } catch {
      // Swallow so the connect promise never rejects (see above).
    } finally {
      onConnectingChange(false);
    }
  }, [open, config, completeSiweLogin, onConnectingChange]);

  // Publish the connect fn up to the parent's crypto-wallet row (and flush a tap
  // that landed before this runtime finished loading). Re-publishing on a new
  // `connect` identity just refreshes the stored fn; the pending tap flushes once.
  useEffect(() => {
    onReady(connect);
  }, [onReady, connect]);

  return null;
}
