'use client';

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
import { UserWalletAvatar } from '@/components/user-avatar';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { checksumWalletAddressSchema } from '@namefi-astra/utils/namefi-flavor';
import { Loader2, Wallet2, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { toast } from 'sonner';
import {
  type Config,
  useAccount,
  useConfig,
  type UseConfigParameters,
} from 'wagmi';
import { useConnectedWallets } from '@/hooks/use-user-wallet-addresses';
import { useWalletConnectionRuntime } from '@/components/providers/wallet-connection-runtime';

type ConnectionState =
  | 'checking'
  | 'waiting'
  | 'connecting'
  | 'wrong-wallet'
  | 'setting-active'
  | 'success';

export interface RequestWalletConnectionProps {
  // open: boolean;
  // onOpenChange: (open: boolean) => void;
  // requestedWalletAddress: string;
  onRequestedWalletConnected: (walletAddress: string) => void;
  actionDescription?: string;
}

const attemptGetChecksummedAddress = (address: string): string => {
  const parsed = checksumWalletAddressSchema.safeParse(address);
  return parsed.success ? parsed.data : address;
};

export type RequestWalletConnectionRef = {
  requestWalletConnection: (address: string) => void;
};
export const RequestWalletConnection = forwardRef<
  RequestWalletConnectionRef,
  RequestWalletConnectionProps
>(function RequestWalletConnection(props, ref) {
  const t = useTranslations('shared');
  const tCommon = useTranslations('common');
  const { onRequestedWalletConnected, actionDescription } = props;
  const resolvedActionDescription =
    actionDescription ?? t('requestWalletConnection.defaultActionDescription');
  const [open, setOpen] = useState(false);
  const onOpenChange = useCallback((open: boolean) => {
    setOpen(open);
    if (!open) {
      setRequestedWalletAddress(undefined);
      setConnectionState('checking');
    }
  }, []);
  const config = useSafeConfig();
  const [_connectionState, setConnectionState] =
    useState<ConnectionState>('checking');
  const [requestedWalletAddress, setRequestedWalletAddress] = useState<
    string | undefined
  >(undefined);

  const { address: activeWalletAddress } = useAccount();
  const { connectedEthereumWallets } = useConnectedWallets();
  const walletRuntime = useWalletConnectionRuntime();

  const checksummedRequestedAddress = useMemo(
    () =>
      requestedWalletAddress
        ? attemptGetChecksummedAddress(requestedWalletAddress)
        : '',
    [requestedWalletAddress],
  );

  const checksummedWrongAddress = useMemo(
    () =>
      activeWalletAddress
        ? attemptGetChecksummedAddress(activeWalletAddress)
        : null,
    [activeWalletAddress],
  );

  // Check if requested wallet is in connected wallets list
  const isRequestedWalletOneOfConnectedWallets = useMemo(() => {
    return connectedEthereumWallets.some(
      (w) =>
        requestedWalletAddress &&
        w.address.toLowerCase() === requestedWalletAddress.toLowerCase(),
    );
  }, [connectedEthereumWallets, requestedWalletAddress]);

  const connectionState = useMemo(() => {
    if (
      activeWalletAddress &&
      requestedWalletAddress &&
      activeWalletAddress.toLowerCase() !== requestedWalletAddress.toLowerCase()
    ) {
      return 'wrong-wallet';
    }
    if (
      activeWalletAddress &&
      requestedWalletAddress &&
      activeWalletAddress.toLowerCase() === requestedWalletAddress.toLowerCase()
    ) {
      return 'success';
    }
    return _connectionState;
  }, [_connectionState, activeWalletAddress, requestedWalletAddress]);

  // Initiate switching to the requested wallet. RainbowKit holds a single live
  // connection, so this re-opens the connect modal; success is NOT asserted here
  // — it is observed reactively (see `connectionState` deriving 'success' from
  // `useAccount`, and the effect below firing `onRequestedWalletConnected`).
  // Asserting success synchronously would report a false success because
  // `setActiveWalletByAddress` resolves before the active account actually changes.
  const handleSetAsActiveWallet = useCallback(
    async (requestedWalletAddress: string) => {
      setConnectionState('setting-active');
      try {
        await walletRuntime.setActiveWalletByAddress(requestedWalletAddress);
        // Hand off to the reactive success path; keep a cancel/retry affordance.
        setConnectionState('waiting');
      } catch (error) {
        console.error('Failed to set active wallet', error);
        toast(t('requestWalletConnection.toast.setActiveFailed'), {
          description:
            error instanceof Error
              ? error.message
              : t('requestWalletConnection.toast.unknownError'),
        });
        setConnectionState('waiting');
      }
    },
    [walletRuntime, t],
  );

  // Initiate the connect flow. `connectWallet` opens the RainbowKit modal and
  // resolves as soon as the modal is shown — it does NOT mean the wallet is
  // connected. So we must not read the account synchronously here (it would still
  // be disconnected while the user is in their wallet app, producing a spurious
  // connect-failed toast). The actual outcome is observed reactively:
  // `connectionState` derives 'success' / 'wrong-wallet' from `useAccount`, and
  // the effect below fires `onRequestedWalletConnected` on success.
  const handleConnectClick = useCallback(
    async (requestedWalletAddress: string) => {
      if (!config) {
        return null;
      }
      setConnectionState('connecting');

      try {
        await walletRuntime.connectWallet({
          suggestedAddress: requestedWalletAddress,
        });
        // Modal opened; wait for the user to complete it. Drop back to 'waiting'
        // so cancel/retry stays available — reactive state resolves success.
        setConnectionState('waiting');
      } catch (error) {
        toast(t('requestWalletConnection.toast.connectFailed'), {
          description:
            error instanceof Error
              ? error.message
              : t('requestWalletConnection.toast.unknownError'),
        });
        setConnectionState('waiting');
      }
    },
    [walletRuntime, config, t],
  );

  // Handle try again button click
  const handleTryAgain = useCallback(() => {
    if (requestedWalletAddress) {
      handleConnectClick(requestedWalletAddress);
    }
  }, [handleConnectClick, requestedWalletAddress]);

  useImperativeHandle(ref, () => ({
    requestWalletConnection: async (_requestedWalletAddress: string) => {
      console.log('Requesting wallet connection', _requestedWalletAddress);
      console.log(
        'Connection state',
        connectionState,
        'requestedWalletAddress',
        requestedWalletAddress,
        'activeWalletAddress',
        activeWalletAddress,
        'isRequestedWalletOneOfConnectedWallets',
        isRequestedWalletOneOfConnectedWallets,
      );
      if (connectionState === 'checking') {
        if (
          activeWalletAddress &&
          _requestedWalletAddress &&
          activeWalletAddress.toLowerCase() ===
            _requestedWalletAddress.toLowerCase()
        ) {
          console.log('Wallet already active', _requestedWalletAddress);
          // // Already active, call callback immediately
          onRequestedWalletConnected(_requestedWalletAddress);
          onOpenChange(false);
        } else {
          setRequestedWalletAddress(_requestedWalletAddress);
          onOpenChange(true);
          if (isRequestedWalletOneOfConnectedWallets) {
            console.log(
              'Wallet connected but not active',
              _requestedWalletAddress,
            );
            // Connected but not active, set as active
            await handleSetAsActiveWallet(_requestedWalletAddress);
          } else {
            console.log('Wallet not connected', _requestedWalletAddress);
            // Not connected, show waiting state
            setConnectionState('waiting');
            await handleConnectClick(_requestedWalletAddress);
          }
        }
      }
    },
  }));

  useEffect(() => {
    if (connectionState === 'success' && requestedWalletAddress) {
      onRequestedWalletConnected(requestedWalletAddress);
      onOpenChange(false);
    }
  }, [
    connectionState,
    requestedWalletAddress,
    onRequestedWalletConnected,
    onOpenChange,
  ]);
  if (!config) {
    return null;
  }
  return (
    <Dialog open={open} modal={true}>
      <DialogContent
        className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'max-w-md')}
        data-testid="shared.request-wallet-connection.dialog"
      >
        <DialogHeader>
          <DialogTitle data-testid="shared.request-wallet-connection.title">
            {connectionState === 'wrong-wallet'
              ? t('requestWalletConnection.title.wrongWallet')
              : connectionState === 'setting-active'
                ? t('requestWalletConnection.title.settingActive')
                : t('requestWalletConnection.title.connect')}
          </DialogTitle>
          <DialogDescription data-testid="shared.request-wallet-connection.description">
            {connectionState === 'wrong-wallet'
              ? t('requestWalletConnection.description.wrongWallet')
              : connectionState === 'setting-active'
                ? t('requestWalletConnection.description.settingActive')
                : t('requestWalletConnection.description.connect', {
                    actionDescription: resolvedActionDescription,
                  })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Checking/Loading State */}
          {(connectionState === 'checking' ||
            connectionState === 'setting-active') && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {connectionState === 'checking'
                  ? t('requestWalletConnection.checkingStatus')
                  : t('requestWalletConnection.settingAsActive')}
              </p>
            </div>
          )}

          {/* Waiting/Connecting State */}
          {(connectionState === 'waiting' ||
            connectionState === 'connecting') && (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  {t('requestWalletConnection.requiredWallet')}
                </span>
                <div className="flex items-center gap-2 px-2 py-2 bg-muted rounded-xl">
                  <UserWalletAvatar
                    address={checksummedRequestedAddress}
                    className="size-8"
                  />
                  <div
                    className="flex-1 min-w-0"
                    data-testid="shared.request-wallet-connection.requested-address"
                  >
                    <AutoTruncateTextV2
                      initialCharactersCountToDisplay={20}
                      minCharactersToDisplay={12}
                      className="font-mono text-sm"
                    >
                      {checksummedRequestedAddress}
                    </AutoTruncateTextV2>
                  </div>
                  <Wallet2 className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {connectionState === 'connecting' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {t('requestWalletConnection.waitingForConnection')}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Wrong Wallet State */}
          {connectionState === 'wrong-wallet' && checksummedWrongAddress && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {t('requestWalletConnection.differentWalletConnected')}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {t('requestWalletConnection.youConnected')}
                  </span>
                  <div className="flex items-center gap-2 px-2 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <UserWalletAvatar
                      address={checksummedWrongAddress}
                      className="size-8"
                    />
                    <div
                      className="flex-1 min-w-0"
                      data-testid="shared.request-wallet-connection.connected-address"
                    >
                      <AutoTruncateTextV2
                        initialCharactersCountToDisplay={20}
                        minCharactersToDisplay={12}
                        className="font-mono text-sm"
                      >
                        {checksummedWrongAddress}
                      </AutoTruncateTextV2>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {t('requestWalletConnection.butWeNeed')}
                  </span>
                  <div className="flex items-center gap-2 px-2 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl">
                    <UserWalletAvatar
                      address={checksummedRequestedAddress}
                      className="size-8"
                    />
                    <div
                      className="flex-1 min-w-0"
                      data-testid="shared.request-wallet-connection.needed-address"
                    >
                      <AutoTruncateTextV2
                        initialCharactersCountToDisplay={20}
                        minCharactersToDisplay={12}
                        className="font-mono text-sm"
                      >
                        {checksummedRequestedAddress}
                      </AutoTruncateTextV2>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          {connectionState === 'success' && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t('requestWalletConnection.connectedSuccessfully')}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {(connectionState === 'waiting' ||
            connectionState === 'connecting') && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={connectionState === 'connecting'}
                data-testid="shared.request-wallet-connection.cancel-button"
              >
                {tCommon('actions.cancel')}
              </Button>
              <Button
                onClick={() =>
                  requestedWalletAddress &&
                  handleConnectClick(requestedWalletAddress)
                }
                disabled={connectionState === 'connecting'}
                data-testid="shared.request-wallet-connection.connect-button"
              >
                {connectionState === 'connecting' ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {t('requestWalletConnection.connecting')}
                  </>
                ) : (
                  tCommon('actions.connectWallet')
                )}
              </Button>
            </>
          )}

          {connectionState === 'wrong-wallet' && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="shared.request-wallet-connection.wrong-wallet-cancel-button"
              >
                {tCommon('actions.cancel')}
              </Button>
              <Button
                onClick={handleTryAgain}
                data-testid="shared.request-wallet-connection.try-again-button"
              >
                {tCommon('actions.tryAgain')}
              </Button>
            </>
          )}
          {connectionState === 'success' && (
            <>
              <Button
                onClick={() => {
                  if (requestedWalletAddress) {
                    onRequestedWalletConnected(requestedWalletAddress);
                  }
                  onOpenChange(false);
                }}
                data-testid="shared.request-wallet-connection.next-button"
              >
                {t('requestWalletConnection.next')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

function useSafeConfig(parameters?: UseConfigParameters<Config> | undefined) {
  try {
    // biome-ignore lint/correctness/useHookAtTopLevel: this is need to get around setting up wagmi for storybook
    const config = useConfig(parameters);
    return config;
  } catch (e) {
    return null;
  }
}
