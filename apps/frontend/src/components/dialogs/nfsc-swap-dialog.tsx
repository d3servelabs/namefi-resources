'use client';

import {
  Alert,
  AlertDescription,
} from '@namefi-astra/ui/components/shadcn/alert';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { useBuyNfsc } from '@/hooks/use-buy-nfsc';
import useGetNfscExchangeRate from '@/hooks/use-get-nfsc-exchange-rate';
import useNfscBalance from '@/hooks/use-nfsc-balance';
import { AlertCircle, Info, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useMemo, useRef, useState } from 'react';
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
import { NfscOrdersList } from '@/components/payment-method/nfsc-orders-list';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useWalletConnectionRuntime } from '@/components/providers/wallet-connection-runtime';
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress?: string;
};

const DISPLAY_DECIMALS = 2;
const CALCULATION_DECIMALS = 6;
const DECIMAL_INPUT_PATTERN = /^\d*\.?\d*$/;

// Quick-pick amounts in whole USD. 1 USD buys 1 NFSC, so these double as the
// NFSC quantities; the ETH actually sent is derived from the live rate.
const PRESET_USD_AMOUNTS = [10, 25, 50, 100] as const;

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
  // can't honor a suggested address — so once a wallet is connected, target it
  // and fall back to the requested `walletAddress` only before one is connected.
  const displayAddress = connectedAddress || walletAddress;
  const checksummedAddress = useMemo(
    () =>
      displayAddress ? attemptGetChecksummedAddress(displayAddress) : null,
    [displayAddress],
  );
  // The amount of NFSC to buy, expressed in whole USD (1 USD = 1 NFSC). This is
  // the subject of the screen; the ETH the user sends is derived from it.
  const [amountUsd, setAmountUsd] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const { nfscBalanceChains: chains } = useAllowedChains();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const { nfscBalance, nativeBalance, isLoading } =
    useNfscBalance(checksummedAddress);
  const { data: conversionRate, isLoading: isConversionRateLoading } =
    useGetNfscExchangeRate();

  // Pending NFSC top-ups for this wallet — shown above the inputs so users see
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

  // 1 USD = 1 NFSC, so the entered USD value is also the NFSC quantity.
  const amountUsdNum = useMemo(() => {
    const parsed = Number.parseFloat(amountUsd);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [amountUsd]);
  // NFSC per ETH, from the on-chain price oracle.
  const rateNum = useMemo(() => {
    const parsed = conversionRate ? Number.parseFloat(conversionRate) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  }, [conversionRate]);

  // ETH the user must send to receive the requested NFSC: NFSC ÷ (NFSC per ETH).
  const ethToSendNum = useMemo(() => {
    if (amountUsdNum <= 0 || rateNum <= 0) return 0;
    return amountUsdNum / rateNum;
  }, [amountUsdNum, rateNum]);
  const ethToSendString = useMemo(
    () => (ethToSendNum > 0 ? ethToSendNum.toFixed(CALCULATION_DECIMALS) : ''),
    [ethToSendNum],
  );
  const displayEthAmount =
    ethToSendNum > 0 ? ethToSendNum.toFixed(CALCULATION_DECIMALS) : '0';

  // The exact wei the buy tx will send. `ethToSendString` is already rounded to
  // our display precision, so this is what the user actually pays — it gates
  // validity (a positive amount that rounds to 0 wei is not payable) and drives
  // the gas estimate. `undefined` until a valid, positive amount is entered.
  const payValueWei = useMemo(() => {
    if (!ethToSendString) return undefined;
    try {
      return parseEther(ethToSendString);
    } catch {
      return undefined;
    }
  }, [ethToSendString]);

  const insufficientBalance = useMemo(() => {
    if (!nativeBalance || ethToSendNum <= 0) return false;
    return ethToSendNum > Number.parseFloat(nativeBalance.formatted);
  }, [nativeBalance, ethToSendNum]);

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
          nfscAmount: amountUsdNum.toFixed(DISPLAY_DECIMALS),
          ethAmount: displayEthAmount,
        }),
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('NFSCSwap error', error);
      setErrorMessage(error?.message || t('swap.genericError'));
    },
  });

  const handleAmountChange = useCallback((value: string) => {
    // Only allow valid decimal numbers.
    if (value === '' || DECIMAL_INPUT_PATTERN.test(value)) {
      setAmountUsd(value);
      setErrorMessage('');
    }
  }, []);

  const handlePresetSelect = useCallback((usd: number) => {
    setAmountUsd(String(usd));
    setErrorMessage('');
  }, []);

  const handleCustomSelect = useCallback(() => {
    setAmountUsd('');
    setErrorMessage('');
    amountInputRef.current?.focus();
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

    // Note: insufficient balance is surfaced before this handler can run — the
    // button is disabled and labeled "Insufficient ETH Balance" (and the ETH
    // row shows an inline warning) whenever `insufficientBalance` is true, so
    // there's no insufficient-balance branch here. Putting it in a persistent
    // error would also go stale: the alert would linger after the balance
    // recovers, since errors only clear on amount edit or resubmit.

    // Guard the rounded-to-zero case: a tiny USD amount can leave a positive
    // `ethToSendNum` that still rounds to "0.000000" at our 6-decimal
    // precision, which would submit a 0-wei buy. `payValueWei` is the exact
    // value the tx sends, so require it to be positive.
    if (!payValueWei || payValueWei <= 0n) {
      setErrorMessage(t('swap.invalidAmountError'));
      return;
    }

    try {
      await exchangeNfsc(payValueWei);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('swap.transactionFailedError'),
      );
    }
  };

  // Total network fee for the `buyWithEthers` call (L2 execution + Base's L1
  // data fee). It depends on the ETH value being sent, so re-estimate as the
  // amount changes. Before a valid amount is entered — or if the user's own
  // params can't simulate — the hook falls back to a funded signer + a nominal
  // value so a representative fee still shows (flagged `isFallback`).
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

  const isBodyLoading = isLoading || isConversionRateLoading;
  // A positive USD amount alone isn't enough: without a live rate we can't
  // derive the ETH cost, and a cost that rounds to 0 at our display precision
  // is not payable. Gate "ready" on a positive payable wei value (the exact
  // amount the tx will send).
  const isAmountValid =
    amountUsdNum > 0 && payValueWei !== undefined && payValueWei > 0n;

  const swapButtonState = getSwapButtonState({
    hasReadyWallet: isWalletReady,
    isWalletConnecting: isWalletConnecting || isConnectingWallet,
    insufficientBalance,
    isPending,
    isAmountValid,
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
        return t('swap.button.pay', { amount: displayEthAmount });
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

  // The credit explainer mirrors the entered amount; fall back to a sample so
  // the popover still reads naturally before any amount is chosen.
  const creditTooltipAmount =
    amountUsdNum > 0 ? amountUsdNum.toFixed(DISPLAY_DECIMALS) : '25';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          MOBILE_BOTTOM_SHEET_DIALOG,
          SWAP_DIALOG_CONTENT_CLASSNAME,
        )}
        data-testid="nfsc-swap-dialog"
      >
        {/* Scrollable body — header, balances, and the amount inputs scroll
            here, full height, behind the floating action bar (#4578 / #4587). */}
        <div
          className={SWAP_DIALOG_SCROLL_CLASSNAME}
          data-testid="nfsc-swap-scroll"
        >
          <DialogHeader className="p-6 pb-4">
            <div className="flex flex-col gap-3">
              {/* Reserve space for the absolutely-positioned close button
                  (top-4 right-4, size-8) so a long/localized title never runs
                  under the X. */}
              <div className="flex flex-col gap-1">
                <DialogTitle className="pe-10 text-2xl font-bold">
                  {t('swap.title')}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {t('swap.subtitle')}
                </DialogDescription>
              </div>
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

          {isBodyLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              {tCommon('actions.loading')}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Amount — the subject of the screen, in USD value (1 USD = 1
                  NFSC). Quick-pick chips + a free-form field; the ⓘ explains
                  what the credit is without permanent help text. */}
              <div className="px-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {t('swap.amountLabel')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {t('swap.nfscBalance', { amount: formattedNfscBalance })}
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {PRESET_USD_AMOUNTS.map((usd) => {
                    const active = amountUsd === String(usd);
                    return (
                      <button
                        key={usd}
                        type="button"
                        onClick={() => handlePresetSelect(usd)}
                        data-testid={`nfsc-swap-preset-${usd}`}
                        className={cn(
                          'flex-1 min-w-[64px] rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'border-brand-primary bg-brand-primary/10 text-secondary-foreground'
                            : 'border-zinc-800 bg-zinc-900 text-gray-300 hover:border-zinc-700',
                        )}
                      >
                        ${usd}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleCustomSelect}
                    data-testid="nfsc-swap-preset-custom"
                    className={cn(
                      'flex-1 min-w-[80px] rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                      amountUsd !== '' &&
                        !PRESET_USD_AMOUNTS.some((u) => String(u) === amountUsd)
                        ? 'border-brand-primary bg-brand-primary/10 text-secondary-foreground'
                        : 'border-zinc-800 bg-zinc-900 text-gray-300 hover:border-zinc-700',
                    )}
                  >
                    {t('swap.presetCustom')}
                  </button>
                </div>

                <div className="mt-3 bg-zinc-900 rounded-lg p-4 flex items-center justify-center gap-1">
                  <span className="text-3xl font-bold text-gray-500">$</span>
                  <Input
                    ref={amountInputRef}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={amountUsd}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    data-testid="nfsc-swap-amount-input"
                    className="shadow-none ps-0 bg-transparent dark:bg-transparent border-0 text-secondary-foreground text-3xl dark:text-3xl font-bold focus-visible:ring-0 w-24 text-center"
                  />
                  <Popover>
                    <PopoverTrigger
                      aria-label={t('swap.creditInfoAriaLabel')}
                      data-testid="nfsc-swap-credit-info"
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      <Info className="h-4 w-4" />
                    </PopoverTrigger>
                    <PopoverContent className="w-60 text-sm text-gray-300">
                      {t('swap.creditTooltip', { amount: creditTooltipAmount })}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Pay with ETH — what actually leaves the wallet, derived from
                  the amount above at the live rate. */}
              <div className="px-6">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  {t('swap.payWithEth')}
                </p>
                <div className="bg-zinc-900 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span
                      className="text-secondary-foreground text-xl"
                      data-testid="nfsc-swap-eth-cost"
                    >
                      {displayEthAmount}
                    </span>
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
                  <p
                    className={`text-sm mt-2 ${insufficientBalance ? 'text-red-500' : 'text-gray-400'}`}
                  >
                    {t('swap.ethBalance', { amount: formattedEthBalance })}
                    {insufficientBalance && (
                      <span className="ms-2">
                        • {t('swap.insufficientBalanceInline')}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="px-6">
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

              {/* Rate/Gas stay in the scrollable body — trust-critical details
                  remain visible (#4587). The scroll body's bottom padding
                  provides clearance so these can scroll above the floating
                  action bar. */}
              <div className="px-6">
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
        </div>

        {/* Floating action bar: the primary action overlays the bottom of the
            scrollable body — always on screen and tappable, independent of
            scroll position or viewport height (#4587). The body scrolls full
            height behind it; only the button captures pointer events. */}
        {!isBodyLoading && (
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
