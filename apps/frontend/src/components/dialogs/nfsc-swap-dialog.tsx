'use client';

import {
  Alert,
  AlertDescription,
} from '@namefi-astra/ui/components/shadcn/alert';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { useBuyNfsc } from '@/hooks/use-buy-nfsc';
import useGetNfscExchangeRate from '@/hooks/use-get-nfsc-exchange-rate';
import useNfscBalance from '@/hooks/use-nfsc-balance';
import { AlertCircle, ArrowDown, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { parseEther } from 'viem';
import { useAccount, useSwitchChain } from 'wagmi';
import { useEstimateNamefiNfscCall } from '@/hooks/use-estimate-contract-call';
import { UserWalletAvatar } from '@/components/user-avatar';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { checksumWalletAddressSchema } from '@namefi-astra/utils/namefi-flavor';
import { useAllowedChains } from '@/hooks/use-allowed-chains';
import { NetworkLogo } from '@/components/network-logo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { NfscOrdersList } from '@/components/payment-method/nfsc-orders-list';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useWalletConnectionRuntime } from '@/components/providers/wallet-connection-runtime';
import dynamic from 'next/dynamic';
import {
  getSwapButtonState,
  isConnectAction,
  isSwapButtonBusy,
  isSwapButtonDisabled,
  type SwapButtonState,
  SWAP_DIALOG_ACTION_BAR_CLASSNAME,
  SWAP_DIALOG_CONTENT_CLASSNAME,
  SWAP_DIALOG_SCROLL_CLASSNAME,
} from '@/components/dialogs/nfsc-swap-dialog-utils';
import { WagmiProvider } from '@/components/providers/wagmi';

function TabLoadingFallback() {
  const tCommon = useTranslations('common');
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      {tCommon('actions.loading')}
    </div>
  );
}

const NfscCardTopUpTab = dynamic(
  () =>
    import('@/components/dialogs/nfsc-card-topup-tab').then(
      (mod) => mod.NfscCardTopUpTab,
    ),
  {
    loading: () => <TabLoadingFallback />,
  },
);

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress?: string;
};

const DISPLAY_DECIMALS = 2;
const CALCULATION_DECIMALS = 6;
const DECIMAL_INPUT_PATTERN = /^\d*\.?\d*$/;

// Funded admin/treasury wallet used ONLY to simulate a representative fee
// estimate (eth_estimateGas + the OP-stack L1-fee oracle read — read-only, no
// signing, no state change) when the user's own params can't run: wallet not
// connected, no amount entered yet, or the user's balance can't cover the
// simulated value. `0.0001 ETH` clears the contract's minimum so the simulation
// doesn't revert. Surfaced in the UI as an approximate (≈) figure.
const NFSC_FEE_ESTIMATE_FALLBACK = {
  account: '0x1b0f291c8fFebE891886351CDfF8A304a840C8Ad',
  value: parseEther('0.0001'),
} as const;

const attemptGetChecksummedAddress = (address: string): string => {
  const parsed = checksumWalletAddressSchema.safeParse(address);
  return parsed.success ? parsed.data : address;
};

export default function NFSCSwapDialog(props: Props) {
  return (
    <WagmiProvider>
      <NFSCSwapDialogInner {...props} />
    </WagmiProvider>
  );
}

function NFSCSwapDialogInner(props: Props) {
  const t = useTranslations('nfsc');
  const tCommon = useTranslations('common');
  const { open, onOpenChange, walletAddress } = props;
  const { address: connectedAddress, chainId } = useAccount();
  const walletRuntime = useWalletConnectionRuntime();
  // `buyWithEthers` always credits the *connected* signer, and Reown AppKit
  // can't honor a suggested address — so once a wallet is connected, target it.
  // (Flag-off Privy mode keeps prioritizing the requested `walletAddress`, since
  // its connect flow can switch to that exact wallet.)
  const displayAddress =
    walletRuntime.mode === 'reown'
      ? connectedAddress || walletAddress
      : walletAddress || connectedAddress;
  const checksummedAddress = useMemo(
    () =>
      displayAddress ? attemptGetChecksummedAddress(displayAddress) : null,
    [displayAddress],
  );
  const [amountPay, setAmountPay] = useState('');
  const [amountReceive, setAmountReceive] = useState('');
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentTab, setPaymentTab] = useState<'eth' | 'card'>('eth');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  const { nfscBalanceChains: chains } = useAllowedChains();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const { nfscBalance, nativeBalance, isLoading } =
    useNfscBalance(checksummedAddress);
  const { data: conversionRate, isLoading: isConversionRateLoading } =
    useGetNfscExchangeRate();

  // Pending NFSC top-ups for this wallet — shown above the tabs so users see
  // anything already in flight before they start another. Polled while the
  // dialog is open so newly-started top-ups appear without manual refresh.
  const trpc = useTRPC();
  const { data: pendingNfscOrders } = useQuery({
    ...trpc.orders.getMyNfscOrders.queryOptions(
      checksummedAddress
        ? {
            recipientWalletAddress: checksummedAddress,
            statuses: ['CREATED', 'PROCESSING'],
            limit: 5,
          }
        : { limit: 5 },
    ),
    enabled: open && Boolean(checksummedAddress),
    refetchInterval: open ? 5000 : false,
  });
  const {
    writeContractAsync: exchangeNfsc,
    isPending,
    isWalletReady,
    isWalletConnecting,
  } = useBuyNfsc({
    walletAddress: checksummedAddress ?? undefined,
    onSuccess: () => {
      toast.success(t('swap.submittedToastTitle'), {
        description: t('swap.submittedToastDescription', {
          payAmount: amountPay,
          receiveAmount: displayReceiveAmount(),
        }),
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('NFSCSwap error', error);
      setErrorMessage(error?.message || t('swap.genericError'));
    },
  });

  // Check if user has sufficient balance
  useEffect(() => {
    if (!nativeBalance || amountPay === '') return;

    try {
      const payAmount = Number.parseFloat(amountPay);
      const nativeBalanceNum = Number.parseFloat(nativeBalance.formatted);

      setInsufficientBalance(payAmount > nativeBalanceNum);

      if (errorMessage) {
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Error checking balance:', error);
    }
  }, [amountPay, nativeBalance, errorMessage]);

  // Calculate the corresponding amount when inputs change
  useEffect(() => {
    if (!conversionRate || conversionRate === '0') return;

    try {
      const rate = Number.parseFloat(conversionRate);

      if (amountPay !== '') {
        const payAmount = Number.parseFloat(amountPay);
        const receiveAmount = (payAmount * rate).toFixed(CALCULATION_DECIMALS);
        setAmountReceive(receiveAmount);
      } else {
        setAmountReceive('');
      }
    } catch (error) {
      console.error('Error calculating amounts:', error);
    }
  }, [amountPay, conversionRate]);

  const handlePayChange = useCallback((value: string) => {
    // Only allow valid decimal numbers
    if (value === '' || DECIMAL_INPUT_PATTERN.test(value)) {
      setAmountPay(value);
    }
  }, []);

  const handleChainChange = useCallback(
    (value: string | null) => {
      if (!value) return;
      const selectedChainId = Number.parseInt(value, 10);
      if (switchChain && selectedChainId !== chainId) {
        switchChain(
          { chainId: selectedChainId },
          {
            onSuccess: () => {
              toast.success(t('swap.networkSwitchedToastTitle'), {
                description: t('swap.networkSwitchedToastDescription', {
                  network:
                    chains.find((c) => c.id === selectedChainId)?.name ?? '',
                }),
              });
            },
            onError: (error) => {
              toast.error(t('swap.networkSwitchFailedToastTitle'), {
                description: error.message,
              });
            },
          },
        );
      }
    },
    [switchChain, chainId, chains, t],
  );

  const handleConnectWallet = useCallback(async () => {
    setErrorMessage('');
    setIsConnectingWallet(true);
    try {
      // Suggest the charging wallet shown in the dialog so the user connects the
      // wallet they intend to top up. `buyWithEthers` credits the connected
      // signer, so connecting a different wallet would fund the wrong account.
      await walletRuntime.connectWallet(
        checksummedAddress
          ? { suggestedAddress: checksummedAddress }
          : undefined,
      );
    } catch (error) {
      // A user dismissing the connect modal is expected — only surface real
      // failures, not cancellations.
      if (
        error instanceof Error &&
        !/cancel|reject|close/i.test(error.message)
      ) {
        setErrorMessage(error.message);
      }
    } finally {
      setIsConnectingWallet(false);
    }
  }, [walletRuntime, checksummedAddress]);

  const handleOnExchange = async () => {
    setErrorMessage('');

    if (insufficientBalance) {
      setErrorMessage(t('swap.insufficientEthError'));
      return;
    }

    if (!isInputValid()) {
      setErrorMessage(t('swap.invalidAmountError'));
      return;
    }

    try {
      await exchangeNfsc(parseEther(amountPay));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('swap.transactionFailedError'),
      );
    }
  };

  const isInputValid = useCallback(() => {
    try {
      const payValue = Number.parseFloat(amountPay) || 0;
      return payValue > 0 && !Number.isNaN(payValue);
    } catch {
      return false;
    }
  }, [amountPay]);

  const displayReceiveAmount = useCallback(() => {
    if (amountReceive === '') return '';
    try {
      return Number.parseFloat(amountReceive).toFixed(DISPLAY_DECIMALS);
    } catch {
      return '';
    }
  }, [amountReceive]);

  // Total network fee for the `buyWithEthers` swap (L2 execution + Base's L1
  // data fee). It depends on the ETH value being sent, so re-estimate as the
  // pay amount changes. Before a valid amount is entered — or if the user's own
  // params can't simulate — the hook falls back to a funded signer + a nominal
  // value so a representative fee still shows (flagged `isFallback`).
  const payValueWei = useMemo(() => {
    if (!isInputValid()) return undefined;
    try {
      return parseEther(amountPay);
    } catch {
      return undefined;
    }
  }, [amountPay, isInputValid]);

  const {
    feeFormatted: gasFeeEth,
    isLoading: isGasFeeLoading,
    isFallback: isGasFeeFallback,
  } = useEstimateNamefiNfscCall({
    functionName: 'buyWithEthers',
    value: payValueWei,
    fallback: NFSC_FEE_ESTIMATE_FALLBACK,
  });

  const gasFee = useMemo(() => {
    if (isGasFeeLoading) return t('swap.estimatingGasFee');
    if (gasFeeEth == null) return '—';
    const formatted = `${Number.parseFloat(gasFeeEth).toFixed(CALCULATION_DECIMALS)} ETH`;
    // A fallback estimate is a representative figure, not the user's exact tx —
    // mark it approximate so the number isn't read as a precise quote.
    return isGasFeeFallback ? `≈ ${formatted}` : formatted;
  }, [isGasFeeLoading, gasFeeEth, isGasFeeFallback, t]);

  const isEthTabLoading = isLoading || isConversionRateLoading;

  const swapButtonState = getSwapButtonState({
    hasReadyWallet: isWalletReady,
    isWalletConnecting: isWalletConnecting || isConnectingWallet,
    insufficientBalance,
    isPending,
    isAmountValid: isInputValid(),
  });
  const isButtonDisabled = isSwapButtonDisabled(swapButtonState);
  const isSwapButtonActionConnect = isConnectAction(swapButtonState);
  const swapButtonLabel = ((state: SwapButtonState): string => {
    switch (state) {
      case 'processing':
        return tCommon('actions.processing');
      case 'wallet-loading':
        return t('swap.button.connectingWallet');
      case 'connect-wallet':
        return t('swap.button.connectWallet');
      case 'insufficient-balance':
        return t('swap.button.insufficientEthBalance');
      case 'enter-amount':
        return t('swap.button.enterAmount');
      case 'ready':
        return t('swap.button.swapTokens');
    }
  })(swapButtonState);
  const formattedRate = conversionRate
    ? Number.parseFloat(conversionRate).toFixed(DISPLAY_DECIMALS)
    : '0';
  const formattedNfscBalance = nfscBalance
    ? Number.parseFloat(nfscBalance.formatted).toFixed(DISPLAY_DECIMALS)
    : '0';
  const formattedEthBalance = nativeBalance
    ? Number.parseFloat(nativeBalance.formatted).toFixed(DISPLAY_DECIMALS)
    : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          MOBILE_BOTTOM_SHEET_DIALOG,
          SWAP_DIALOG_CONTENT_CLASSNAME,
        )}
        data-testid="nfsc-swap-dialog"
      >
        {/* Scrollable body — header, balances, and the swap inputs scroll here,
            full height, behind the floating action bar (#4578 / #4587). */}
        <div
          className={SWAP_DIALOG_SCROLL_CLASSNAME}
          data-testid="nfsc-swap-scroll"
        >
          <DialogHeader className="p-6 pb-4">
            <div className="flex flex-col gap-3">
              {/* Reserve space for the absolutely-positioned close button
                  (top-4 right-4, size-8) so a long/localized title never runs
                  under the X. */}
              <DialogTitle className="pe-10 text-2xl font-bold">
                {t('swap.title')}
              </DialogTitle>
              {checksummedAddress && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {t('swap.chargingWallet')}
                  </span>
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 bg-muted rounded-xl max-w-full"
                    data-testid="nfsc-swap-charging-wallet"
                  >
                    <UserWalletAvatar
                      address={checksummedAddress}
                      className="size-6"
                    />
                    <div className="flex-1 min-w-0">
                      <AutoTruncateTextV2
                        initialCharactersCountToDisplay={16}
                        minCharactersToDisplay={16}
                        className="font-mono text-xs"
                        copyable
                      >
                        {checksummedAddress}
                      </AutoTruncateTextV2>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  {t('swap.network')}
                </span>
                <Select
                  value={chainId?.toString()}
                  onValueChange={handleChainChange}
                  disabled={isSwitchingChain}
                >
                  <SelectTrigger
                    className="bg-muted"
                    data-testid="nfsc-swap-network-select"
                  >
                    <SelectValue>
                      {isSwitchingChain ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{t('swap.switchingNetwork')}</span>
                        </div>
                      ) : chainId ? (
                        <div className="flex items-center gap-2">
                          <NetworkLogo network={chainId} className="w-5 h-5" />
                          <span>
                            {chains.find((c) => c.id === chainId)?.name ||
                              t('swap.unknownNetwork')}
                          </span>
                        </div>
                      ) : (
                        t('swap.selectNetwork')
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {chains.map((chain) => (
                      <SelectItem key={chain.id} value={chain.id.toString()}>
                        <div className="flex items-center gap-2">
                          <NetworkLogo network={chain.id} className="w-5 h-5" />
                          <span>{chain.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogHeader>

          {pendingNfscOrders && pendingNfscOrders.length > 0 && (
            <div className="px-6 pb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                {t('swap.pendingTopUps')}
              </p>
              <NfscOrdersList orders={pendingNfscOrders} />
            </div>
          )}

          <Tabs
            value={paymentTab}
            onValueChange={(value) => setPaymentTab(value as 'eth' | 'card')}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mx-6">
              <TabsTrigger value="eth">{t('swap.payWithEth')}</TabsTrigger>
              <TabsTrigger value="card">{t('swap.payWithCard')}</TabsTrigger>
            </TabsList>
            <TabsContent value="eth">
              {isEthTabLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {tCommon('actions.loading')}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="relative mx-6">
                    <div className="bg-zinc-900 rounded-lg p-4 mb-1">
                      <p className="text-gray-400 mb-2">
                        {t('swap.youPayExcludingGas')}
                      </p>
                      <div className="flex justify-between items-center">
                        <Input
                          type="text"
                          placeholder={'0'}
                          value={amountPay}
                          onChange={(e) => handlePayChange(e.target.value)}
                          data-testid="nfsc-swap-pay-input"
                          className="shadow-none ps-0 bg-transparent dark:bg-transparent border-0 text-secondary-foreground text-xl dark:text-xl focus-visible:ring-0 w-1/2"
                        />
                        <div className="flex items-center gap-2 bg-zinc-700 p-2 px-4 rounded-lg">
                          <Image
                            src="/assets/payment/eth.svg"
                            alt="ETH"
                            width={16}
                            height={16}
                            className="text-secondary-foreground"
                          />
                          <span className="font-medium">ETH</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p
                          className={`text-sm mt-2 ${insufficientBalance ? 'text-red-500' : 'text-gray-400'}`}
                        >
                          {t('swap.ethBalance', {
                            amount: formattedEthBalance,
                          })}
                          {insufficientBalance && (
                            <span className="ms-2">
                              • {t('swap.insufficientBalanceInline')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="size-[48px] bg-zinc-950 rounded-full border-2 border-zinc-800 p-2 flex items-center justify-center">
                        <ArrowDown className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    <div className="bg-zinc-900 rounded-lg p-4">
                      <p className="text-gray-400 mb-2">
                        {t('swap.youReceive')}
                      </p>
                      <div className="flex justify-between items-center">
                        <Input
                          type="text"
                          placeholder={'0'}
                          readOnly={true}
                          value={displayReceiveAmount()}
                          data-testid="nfsc-swap-receive-output"
                          className="shadow-none ps-0 bg-transparent dark:bg-transparent border-0 text-secondary-foreground text-xl dark:text-xl focus-visible:ring-0 w-1/2"
                        />
                        <div className="flex items-center bg-zinc-700 gap-2 p-2 px-4 rounded-md">
                          <Image
                            src="/nfsc.svg"
                            alt="Swap"
                            width={24}
                            height={24}
                          />
                          <span className="font-medium">NFSC</span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mt-2">
                        {t('swap.nfscBalance', {
                          amount: formattedNfscBalance,
                        })}
                      </p>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="px-6 pt-2">
                      <Alert
                        variant="destructive"
                        className="bg-red-900/50 border-red-800 text-red-300"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="break-words overflow-auto max-h-[200px] text-ellipsis max-w-full">
                          {errorMessage}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Rate/Gas stay in the scrollable body — trust-critical
                    details remain visible (#4587). The scroll body's bottom
                    padding (not here) provides clearance so these can scroll
                    above the floating action bar. */}
                  <div className="px-6 pt-2">
                    <div className="flex justify-between text-gray-400 mb-4">
                      <span>{t('swap.rate')}</span>
                      <span data-testid="nfsc-swap-rate">
                        {t('swap.rateValue', { rate: formattedRate })}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-400">
                      <span>{t('swap.gasFee')}</span>
                      <span data-testid="nfsc-swap-gas-fee">{gasFee}</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="card">
              {paymentTab === 'card' && (
                <NfscCardTopUpTab
                  recipientWalletAddress={checksummedAddress}
                  chainId={chainId}
                  onClose={() => onOpenChange(false)}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Floating action bar: the primary Swap action overlays the bottom of
            the scrollable body — always on screen and tappable, independent of
            scroll position or viewport height (#4587). The body scrolls full
            height behind it; only the button captures pointer events. Rendered
            for the ETH tab only — the card tab carries its own submit affordance. */}
        {paymentTab === 'eth' && !isEthTabLoading && (
          <div
            className={SWAP_DIALOG_ACTION_BAR_CLASSNAME}
            data-testid="nfsc-swap-action-bar"
          >
            <Button
              // The button floats over the scrollable content, so it must stay
              // opaque even when disabled — the base `disabled:opacity-50` would
              // let the content behind bleed through. Override to opacity-100 and
              // convey "disabled" by dimming the brand itself (`brightness-50`),
              // which stays opaque and on-brand for every white-label origin
              // (a muted green on the default brand) instead of a fixed color.
              className="pointer-events-auto w-full items-center bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-100 disabled:brightness-50 text-secondary-foreground font-medium py-6 rounded-full flex justify-center gap-2"
              onClick={
                isSwapButtonActionConnect
                  ? handleConnectWallet
                  : handleOnExchange
              }
              disabled={isButtonDisabled}
              data-testid="nfsc-swap-submit"
            >
              {isSwapButtonBusy(swapButtonState) && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
              {swapButtonLabel}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
