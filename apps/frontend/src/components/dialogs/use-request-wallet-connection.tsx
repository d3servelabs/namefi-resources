'use client';

import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { UserWalletAvatar } from '@/components/user-avatar';
import { useConnectedWallets } from '@/hooks/use-user-wallet-addresses';
import { useConnectWallet } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import {
  type PromiseCallbackError,
  usePromiseCallback,
} from '@samyx/react-async-hooks';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { checksumWalletAddressSchema } from '@namefi-astra/utils/namefi-flavor';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Network,
  Wallet2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  type Config,
  useAccount,
  useChainId,
  useConfig,
  type UseConfigParameters,
  useSwitchChain,
} from 'wagmi';

/**
 * Target combo a caller wants to gate an action on.
 * `chainId` is the EVM chain id (e.g. 1 for mainnet).
 * `walletAddress` is any-case hex; matching is case-insensitive.
 * `actionDescription` overrides the hook-level default for this one call.
 */
export interface RequestWalletConnectionTarget {
  chainId: number;
  walletAddress: string;
  actionDescription?: string;
}

/** Error thrown by `request()` when the user dismisses the dialog. */
export interface RequestCancelledError extends Error {
  code: 'cancelled';
}

export type RequestWalletConnectionPhase =
  | 'idle'
  | 'connecting-wallet'
  | 'setting-active'
  | 'switching-chain';

export interface RequestWalletConnectionHookData {
  open: boolean;
  required: RequestWalletConnectionTarget | null;
  activeAddress: string | undefined;
  activeChainId: number;
  isRequestedWalletInConnectedList: boolean;
  phase: RequestWalletConnectionPhase;
  request: (
    target: RequestWalletConnectionTarget,
  ) => Promise<{ activeAddress: string; activeChainId: number }>;
  cancel: () => void;
  onConnectWallet: () => Promise<void>;
  onSetActiveWallet: () => Promise<void>;
  onSwitchChain: () => Promise<void>;
  actionDescription: string;
}

export interface RequestWalletConnectionDialogProps {
  open: boolean;
  required: RequestWalletConnectionTarget | null;
  activeAddress: string | undefined;
  activeChainId: number;
  isRequestedWalletInConnectedList: boolean;
  phase: RequestWalletConnectionPhase;
  onConnectWallet: () => Promise<void>;
  onSetActiveWallet: () => Promise<void>;
  onSwitchChain: () => Promise<void>;
  onCancel: () => void;
  actionDescription?: string;
}

const attemptGetChecksummedAddress = (address: string): string => {
  const parsed = checksumWalletAddressSchema.safeParse(address);
  return parsed.success ? parsed.data : address;
};

function useSafeConfig(parameters?: UseConfigParameters<Config> | undefined) {
  try {
    // biome-ignore lint/correctness/useHookAtTopLevel: matches sibling dialog's pattern to keep Storybook usable without a wagmi config
    const config = useConfig(parameters);
    return config;
  } catch (_e) {
    return null;
  }
}

interface UseRequestWalletConnectionOptions {
  actionDescription?: string;
}

type RequestArgs = [RequestWalletConnectionTarget];

interface WatchedState {
  activeAddress: string | undefined;
  activeChainId: number;
  cancelGeneration: number;
}

/**
 * Imperative hook that gates an action on a `[chainId, walletAddress]` combo.
 *
 * Returns a stable `request(target)` async function. Awaiting it resolves once
 * wagmi reports both the target wallet *and* the target chain as active. If
 * the user dismisses the dialog, the promise rejects with `code: 'cancelled'`.
 * If a call is made while another is in flight, it rejects with `code: 'blocked'`.
 *
 * The remaining fields on the return value (`open`, `required`, handlers, …)
 * feed the matching `RequestWalletConnectionDialog` via `{...bind(data)}`.
 */
export function useRequestWalletConnection(
  options?: UseRequestWalletConnectionOptions,
): RequestWalletConnectionHookData {
  const { actionDescription = 'to complete this action' } = options ?? {};

  const { address: activeAddress } = useAccount();
  const activeChainId = useChainId();
  const { connectedEthereumWallets } = useConnectedWallets();
  const { connectWallet } = useConnectWallet();
  const { setActiveWallet } = useSetActiveWallet();
  const { switchChainAsync } = useSwitchChain();

  const [open, setOpen] = useState(false);
  const [required, setRequired] =
    useState<RequestWalletConnectionTarget | null>(null);
  const [phase, setPhase] = useState<RequestWalletConnectionPhase>('idle');
  const [cancelGeneration, setCancelGeneration] = useState(0);
  const [perCallActionDescription, setPerCallActionDescription] = useState<
    string | undefined
  >(undefined);
  // TODO: drop the cancelGeneration + captured-ref dance once
  // `@samyx/react-async-hooks` exposes an AbortController-based cancel API.
  // Then `cancel()` aborts the in-flight promise directly and we no longer
  // need a "did the cancel counter advance since this call started?" check.
  //
  // For now: `cancelGeneration` is bumped by `cancel()` and lives in
  // `watchedState`, which triggers `hasFailedReachingTargetState` re-eval in
  // `usePromiseCallback`. The predicate fires when `state.cancelGeneration`
  // has advanced beyond the snapshot we took at the start of THIS request.
  //
  // `cancelGenerationRef` mirrors the state into a ref so the stable
  // `request` wrapper can read the latest value without being recreated on
  // every cancel. We write to it during render — refs are not observable
  // React state, so render-time writes are safe (no useEffect needed).
  const cancelGenerationRef = useRef(0);
  cancelGenerationRef.current = cancelGeneration;
  // Snapshot of `cancelGeneration` taken when each `request()` call starts.
  // The failure predicate runs synchronously *before* `action`, so without
  // a snapshot the very first call would compare initial state (0) against
  // some sentinel and either always-fail (init = -1) or always-pass even
  // after a stale cancel. Initialized to 0 so the first sync check matches.
  const capturedCancelGenAtCallTimeRef = useRef<number>(0);

  const isRequestedWalletInConnectedList = useMemo(() => {
    if (!required) return false;
    return connectedEthereumWallets.some(
      (w) => w.address.toLowerCase() === required.walletAddress.toLowerCase(),
    );
  }, [connectedEthereumWallets, required]);

  const watchedState = useMemo<WatchedState>(
    () => ({ activeAddress, activeChainId, cancelGeneration }),
    [activeAddress, activeChainId, cancelGeneration],
  );

  const rawRequest = usePromiseCallback<RequestArgs, WatchedState>({
    watchedState,
    action: ({ chainId, walletAddress, actionDescription: perCallDesc }) => {
      setRequired({ chainId, walletAddress });
      setPerCallActionDescription(perCallDesc);
      setPhase('idle');
      setOpen(true);
    },
    hasReachedTargetState: (state, [{ chainId, walletAddress }]) =>
      !!state.activeAddress &&
      state.activeAddress.toLowerCase() === walletAddress.toLowerCase() &&
      state.activeChainId === chainId,
    hasFailedReachingTargetState: (state) =>
      state.cancelGeneration > capturedCancelGenAtCallTimeRef.current,
    concurrency: 'block',
  });

  const request = useCallback(
    async (target: RequestWalletConnectionTarget) => {
      // Snapshot must happen BEFORE the library's sync predicate check (see
      // `capturedCancelGenAtCallTimeRef` declaration above). Putting it
      // inside `action` would be too late — `action` runs after the sync
      // failure check.
      capturedCancelGenAtCallTimeRef.current = cancelGenerationRef.current;
      try {
        const finalState = await rawRequest(target);
        return {
          activeAddress: finalState.activeAddress as string,
          activeChainId: finalState.activeChainId,
        };
      } catch (err) {
        if (err && typeof err === 'object' && 'code' in err) {
          const e = err as PromiseCallbackError;
          if (e.code === 'failed') {
            const cancelled = new Error(
              'Wallet connection request cancelled',
            ) as RequestCancelledError;
            cancelled.code = 'cancelled';
            throw cancelled;
          }
        }
        throw err;
      } finally {
        // The promise lifecycle IS the source of truth for "is the dialog
        // open" — resolved (target reached) or rejected (cancel / timeout /
        // unmount / action error), we tear down the UI here. No effect
        // watching `watchedState` needed.
        setOpen(false);
        setRequired(null);
        setPhase('idle');
        setPerCallActionDescription(undefined);
      }
    },
    [rawRequest],
  );

  const cancel = useCallback(() => {
    // Bump the counter; `hasFailedReachingTargetState` flips true on next
    // render, `rawRequest` rejects, and the `finally` in `request` closes
    // the dialog. No need to mutate UI state here.
    setCancelGeneration((g) => g + 1);
  }, []);

  const onConnectWallet = useCallback(async () => {
    if (!required) return;
    setPhase('connecting-wallet');
    try {
      await connectWallet({ suggestedAddress: required.walletAddress });
    } catch (error) {
      toast('Failed to connect wallet', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setPhase('idle');
    }
  }, [required, connectWallet]);

  const onSetActiveWallet = useCallback(async () => {
    if (!required) return;
    const target = connectedEthereumWallets.find(
      (w) => w.address.toLowerCase() === required.walletAddress.toLowerCase(),
    );
    if (!target) {
      toast('Wallet not connected', {
        description: 'The requested wallet is not in your connected wallets.',
      });
      return;
    }
    setPhase('setting-active');
    try {
      await setActiveWallet(target);
    } catch (error) {
      toast('Failed to switch wallet', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setPhase('idle');
    }
  }, [required, connectedEthereumWallets, setActiveWallet]);

  const onSwitchChain = useCallback(async () => {
    if (!required) return;
    setPhase('switching-chain');
    try {
      await switchChainAsync({ chainId: required.chainId });
    } catch (error) {
      toast('Failed to switch network', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setPhase('idle');
    }
  }, [required, switchChainAsync]);

  return {
    open,
    required,
    activeAddress,
    activeChainId,
    isRequestedWalletInConnectedList,
    phase,
    request,
    cancel,
    onConnectWallet,
    onSetActiveWallet,
    onSwitchChain,
    actionDescription: perCallActionDescription ?? actionDescription,
  };
}

/**
 * Pick the dialog-facing fields off the hook return so callers can do:
 * `<RequestWalletConnectionDialog {...bind(walletDialog)} />`.
 */
export function bind(
  data: RequestWalletConnectionHookData,
): RequestWalletConnectionDialogProps {
  return {
    open: data.open,
    required: data.required,
    activeAddress: data.activeAddress,
    activeChainId: data.activeChainId,
    isRequestedWalletInConnectedList: data.isRequestedWalletInConnectedList,
    phase: data.phase,
    onConnectWallet: data.onConnectWallet,
    onSetActiveWallet: data.onSetActiveWallet,
    onSwitchChain: data.onSwitchChain,
    onCancel: data.cancel,
    actionDescription: data.actionDescription,
  };
}

type DerivedState =
  | 'preparing'
  | 'wallet-not-connected'
  | 'wallet-in-list-not-active'
  | 'wrong-wallet'
  | 'wallet-matches-wrong-chain'
  | 'connecting-wallet'
  | 'setting-active'
  | 'switching-chain'
  | 'success';

function deriveState({
  required,
  activeAddress,
  activeChainId,
  isRequestedWalletInConnectedList,
  phase,
}: Pick<
  RequestWalletConnectionDialogProps,
  | 'required'
  | 'activeAddress'
  | 'activeChainId'
  | 'isRequestedWalletInConnectedList'
  | 'phase'
>): DerivedState {
  if (!required) return 'preparing';
  if (phase === 'connecting-wallet') return 'connecting-wallet';
  if (phase === 'setting-active') return 'setting-active';
  if (phase === 'switching-chain') return 'switching-chain';

  const walletMatches =
    !!activeAddress &&
    activeAddress.toLowerCase() === required.walletAddress.toLowerCase();
  const chainMatches = activeChainId === required.chainId;

  if (walletMatches && chainMatches) return 'success';
  if (walletMatches && !chainMatches) return 'wallet-matches-wrong-chain';
  if (!walletMatches && activeAddress) return 'wrong-wallet';
  if (!walletMatches && isRequestedWalletInConnectedList)
    return 'wallet-in-list-not-active';
  return 'wallet-not-connected';
}

export function RequestWalletConnectionDialog(
  props: RequestWalletConnectionDialogProps,
) {
  const t = useTranslations('shared');
  const tCommon = useTranslations('common');
  const config = useSafeConfig();
  const {
    open,
    required,
    activeAddress,
    activeChainId,
    isRequestedWalletInConnectedList,
    onConnectWallet,
    onSetActiveWallet,
    onSwitchChain,
    onCancel,
    actionDescription = 'to complete this action',
  } = props;

  const state = deriveState(props);
  useEffect(() => {
    const {
      required,
      activeAddress,
      activeChainId,
      isRequestedWalletInConnectedList,
      phase,
    } = props;

    console.log({
      required,
      activeAddress,
      activeChainId,
      isRequestedWalletInConnectedList,
      phase,
      state,
    });
  }, [state, props]);

  const checksummedRequired = useMemo(
    () =>
      required ? attemptGetChecksummedAddress(required.walletAddress) : '',
    [required],
  );
  const checksummedActive = useMemo(
    () => (activeAddress ? attemptGetChecksummedAddress(activeAddress) : ''),
    [activeAddress],
  );

  if (!config) return null;

  const isBusy =
    state === 'connecting-wallet' ||
    state === 'setting-active' ||
    state === 'switching-chain';

  const title =
    state === 'wrong-wallet'
      ? 'Wrong wallet connected'
      : state === 'wallet-matches-wrong-chain'
        ? 'Wrong network'
        : state === 'success'
          ? 'Wallet ready'
          : 'Connect your wallet';

  const description =
    state === 'wrong-wallet'
      ? 'Please connect the correct wallet to continue.'
      : state === 'wallet-matches-wrong-chain'
        ? `Switch your wallet to network ${required?.chainId} to continue.`
        : state === 'success'
          ? 'You are connected with the right wallet and network.'
          : `Please connect your wallet ${actionDescription}.`;

  return (
    <Dialog open={open} modal={true}>
      <DialogContent className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'max-w-md')}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {required ? (
          <div className="flex flex-col gap-3 py-2">
            <StepIndicator state={state} />

            {(state === 'wallet-not-connected' ||
              state === 'wallet-in-list-not-active' ||
              state === 'connecting-wallet' ||
              state === 'setting-active') && (
              <RequiredWalletPanel address={checksummedRequired} />
            )}

            {state === 'wrong-wallet' && (
              <WrongWalletPanel
                requiredAddress={checksummedRequired}
                connectedAddress={checksummedActive}
              />
            )}

            {(state === 'wallet-matches-wrong-chain' ||
              state === 'switching-chain') && (
              <NetworkPanel
                currentChainId={activeChainId}
                requiredChainId={required.chainId}
              />
            )}

            {state === 'success' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t('walletConnectionDialog.walletAndNetworkReady')}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t('walletConnectionDialog.preparing')}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isBusy}>
            {tCommon('actions.cancel')}
          </Button>
          {state === 'wallet-not-connected' && (
            <Button onClick={onConnectWallet} disabled={isBusy}>
              {t('walletConnectionDialog.connectWallet')}
            </Button>
          )}
          {state === 'wallet-in-list-not-active' && (
            <Button onClick={onSetActiveWallet} disabled={isBusy}>
              {t('walletConnectionDialog.useThisWallet')}
            </Button>
          )}
          {state === 'wrong-wallet' && (
            <Button
              onClick={
                isRequestedWalletInConnectedList
                  ? onSetActiveWallet
                  : onConnectWallet
              }
              disabled={isBusy}
            >
              {t('walletConnectionDialog.switchWallet')}
            </Button>
          )}
          {state === 'wallet-matches-wrong-chain' && (
            <Button onClick={onSwitchChain} disabled={isBusy}>
              {t('walletConnectionDialog.switchNetwork')}
            </Button>
          )}
          {state === 'connecting-wallet' && (
            <Button disabled>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              {t('walletConnectionDialog.connecting')}
            </Button>
          )}
          {state === 'setting-active' && (
            <Button disabled>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              {t('walletConnectionDialog.activating')}
            </Button>
          )}
          {state === 'switching-chain' && (
            <Button disabled>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              {t('walletConnectionDialog.switchingNetwork')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StepIndicator({ state }: { state: DerivedState }) {
  const t = useTranslations('shared');
  const walletDone =
    state === 'wallet-matches-wrong-chain' ||
    state === 'switching-chain' ||
    state === 'success';
  const chainDone = state === 'success';
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={`flex items-center gap-1 ${walletDone ? 'text-green-600 dark:text-green-400' : ''}`}
      >
        {walletDone ? (
          <CheckCircle className="h-3.5 w-3.5" />
        ) : (
          <Wallet2 className="h-3.5 w-3.5" />
        )}
        {t('walletConnectionDialog.walletStep')}
      </span>
      <span>→</span>
      <span
        className={`flex items-center gap-1 ${chainDone ? 'text-green-600 dark:text-green-400' : ''}`}
      >
        {chainDone ? (
          <CheckCircle className="h-3.5 w-3.5" />
        ) : (
          <Network className="h-3.5 w-3.5" />
        )}
        {t('walletConnectionDialog.networkStep')}
      </span>
    </div>
  );
}

function RequiredWalletPanel({ address }: { address: string }) {
  const t = useTranslations('shared');
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-gray-500 uppercase tracking-wide">
        {t('walletConnectionDialog.requiredWallet')}
      </span>
      <div className="flex items-center gap-2 px-2 py-2 bg-muted rounded-xl">
        <UserWalletAvatar address={address} className="size-8" />
        <div className="flex-1 min-w-0">
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={20}
            minCharactersToDisplay={12}
            className="font-mono text-sm"
          >
            {address}
          </AutoTruncateTextV2>
        </div>
        <Wallet2 className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}

function WrongWalletPanel({
  requiredAddress,
  connectedAddress,
}: {
  requiredAddress: string;
  connectedAddress: string;
}) {
  const t = useTranslations('shared');
  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {t('walletConnectionDialog.differentWalletConnected')}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          {t('walletConnectionDialog.youConnected')}
        </span>
        <div className="flex items-center gap-2 px-2 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl">
          <UserWalletAvatar address={connectedAddress} className="size-8" />
          <div className="flex-1 min-w-0">
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={20}
              minCharactersToDisplay={12}
              className="font-mono text-sm"
            >
              {connectedAddress}
            </AutoTruncateTextV2>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          {t('walletConnectionDialog.butWeNeed')}
        </span>
        <div className="flex items-center gap-2 px-2 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl">
          <UserWalletAvatar address={requiredAddress} className="size-8" />
          <div className="flex-1 min-w-0">
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={20}
              minCharactersToDisplay={12}
              className="font-mono text-sm"
            >
              {requiredAddress}
            </AutoTruncateTextV2>
          </div>
        </div>
      </div>
    </>
  );
}

function NetworkPanel({
  currentChainId,
  requiredChainId,
}: {
  currentChainId: number;
  requiredChainId: number;
}) {
  const t = useTranslations('shared');
  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
        <Network className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {t('walletConnectionDialog.switchNetworkPrompt')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {t('walletConnectionDialog.current')}
          </span>
          <div className="px-3 py-2 bg-muted rounded-lg font-mono text-sm">
            {t('walletConnectionDialog.chainLabel', { id: currentChainId })}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {t('walletConnectionDialog.required')}
          </span>
          <div className="px-3 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg font-mono text-sm text-green-600 dark:text-green-400">
            {t('walletConnectionDialog.chainLabel', { id: requiredChainId })}
          </div>
        </div>
      </div>
    </>
  );
}
