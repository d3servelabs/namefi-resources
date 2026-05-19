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
import { UserWalletAvatar } from '@/components/user-avatar';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { checksumWalletAddressSchema } from '@namefi-astra/utils/namefi-flavor';
import { Loader2, Wallet2, AlertCircle, CheckCircle } from 'lucide-react';
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
import { getAccount } from 'wagmi/actions';
import { useConnectedWallets } from '@/hooks/use-user-wallet-addresses';
import { useConnectWallet } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';

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
  const {
    onRequestedWalletConnected,
    actionDescription = 'to complete this action',
  } = props;
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
  const { connectWallet } = useConnectWallet();
  const { setActiveWallet } = useSetActiveWallet();

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

  // Handle setting the wallet as active
  const handleSetAsActiveWallet = useCallback(
    async (requestedWalletAddress: string) => {
      setConnectionState('setting-active');
      try {
        const targetWallet = connectedEthereumWallets.find(
          (w) =>
            requestedWalletAddress &&
            w.address.toLowerCase() === requestedWalletAddress.toLowerCase(),
        );

        if (!targetWallet) {
          console.error(
            'Wallet not found in connected wallets',
            requestedWalletAddress,
            connectedEthereumWallets,
          );
          throw new Error('Wallet not found in connected wallets');
        }

        await setActiveWallet(targetWallet);
        console.log('Wallet set as active', requestedWalletAddress);
        // Give wagmi a moment to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        setConnectionState('success');
        onRequestedWalletConnected(requestedWalletAddress);
        onOpenChange(false);
      } catch (error) {
        console.error('Failed to set active wallet', error);
        toast('Failed to set active wallet', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
        setConnectionState('waiting');
      }
    },
    [
      connectedEthereumWallets,
      setActiveWallet,
      onRequestedWalletConnected,
      onOpenChange,
    ],
  );

  // Handle connect wallet button click with callbacks
  const handleConnectClick = useCallback(
    async (requestedWalletAddress: string) => {
      if (!config) {
        return null;
      }
      setConnectionState('connecting');

      try {
        await connectWallet({
          suggestedAddress: requestedWalletAddress,
        });
        console.log('Wallet connected', requestedWalletAddress);
        const account = await getAccount(config);
        console.log('Account', account);
        if (account.status === 'disconnected') {
          throw new Error('Wallet not connected');
        }
        console.log('Account connected successfully', requestedWalletAddress);
        if (
          account.address &&
          requestedWalletAddress &&
          account.address.toLowerCase() === requestedWalletAddress.toLowerCase()
        ) {
          console.log('Wallet connected successfully', requestedWalletAddress);
          setConnectionState('success');
          onRequestedWalletConnected(requestedWalletAddress);
          onOpenChange(false);
        } else {
          handleSetAsActiveWallet(requestedWalletAddress);
        }
      } catch (error) {
        toast('Failed to connect wallet', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
        setConnectionState('waiting');
      }
    },
    [
      connectWallet,
      handleSetAsActiveWallet,
      config,
      onRequestedWalletConnected,
      onOpenChange,
    ],
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {connectionState === 'wrong-wallet'
              ? 'Wrong Wallet Connected'
              : connectionState === 'setting-active'
                ? 'Setting Active Wallet'
                : 'Connect Your Wallet'}
          </DialogTitle>
          <DialogDescription>
            {connectionState === 'wrong-wallet'
              ? 'Please connect the correct wallet to continue.'
              : connectionState === 'setting-active'
                ? 'Please wait while we set your wallet as active...'
                : `Please connect your wallet ${actionDescription}.`}
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
                  ? 'Checking wallet status...'
                  : 'Setting wallet as active...'}
              </p>
            </div>
          )}

          {/* Waiting/Connecting State */}
          {(connectionState === 'waiting' ||
            connectionState === 'connecting') && (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  Required Wallet
                </span>
                <div className="flex items-center gap-2 px-2 py-2 bg-muted rounded-xl">
                  <UserWalletAvatar
                    address={checksummedRequestedAddress}
                    className="size-8"
                  />
                  <div className="flex-1 min-w-0">
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
                    Waiting for wallet connection...
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
                  You connected a different wallet
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    You Connected
                  </span>
                  <div className="flex items-center gap-2 px-2 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <UserWalletAvatar
                      address={checksummedWrongAddress}
                      className="size-8"
                    />
                    <div className="flex-1 min-w-0">
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
                    But We Need
                  </span>
                  <div className="flex items-center gap-2 px-2 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl">
                    <UserWalletAvatar
                      address={checksummedRequestedAddress}
                      className="size-8"
                    />
                    <div className="flex-1 min-w-0">
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
                  Wallet connected successfully
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
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  requestedWalletAddress &&
                  handleConnectClick(requestedWalletAddress)
                }
                disabled={connectionState === 'connecting'}
              >
                {connectionState === 'connecting' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </Button>
            </>
          )}

          {connectionState === 'wrong-wallet' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleTryAgain}>Try Again</Button>
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
              >
                Next
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
