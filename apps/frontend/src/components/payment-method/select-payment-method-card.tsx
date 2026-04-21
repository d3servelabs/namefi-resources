import { Loader2, PencilIcon, PlusIcon } from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';

import { CartCard } from '@/components/cart-card';
import {
  RadioGroup,
  RadioGroupItem,
} from '@namefi-astra/ui/components/shadcn/radio-group';
import { cn } from '@namefi-astra/ui/lib/cn';
import { formatAmountInUSD } from '@/lib/number';
import type { DeepPartial } from '@/lib/types/utils';
import {
  type PaymentProviderDetails,
  isNfscPayment,
} from '@namefi-astra/common/payment-provider';
import { CHAINS } from '@namefi-astra/utils/chains';
import { NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import type { ConfirmationToken } from '@stripe/stripe-js';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { useBalance } from 'wagmi';
import { SelectChain, SelectWallet } from '../select-wallet-and-chain';
import { AddPaymentMethodDialog } from './add-payment-method-dialog';
import { Separator } from '@namefi-astra/ui/components/shadcn/separator';
import { useAllowedChains } from '@/hooks/use-allowed-chains';

export enum SelectedPaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  NFSC = 'NFSC',
}

type PaymentDetails = {
  paymentProviderDetails: DeepPartial<PaymentProviderDetails>;
  paymentMetadata?: {
    confirmationTokenId?: string;
  };
};

export type SelectPaymentMethodCardProps = {
  cartTotalInUsdCents: number;
  parentDomain?: string;
  footerButton?: ReactNode;
  disabled?: boolean;
  onPaymentMethodDetailsChanged: (
    paymentMethodDetails: PaymentDetails | null,
  ) => void;
  onSelectedPaymentMethodChanged: (
    selectedPaymentMethod: SelectedPaymentMethod | null | undefined,
  ) => void;
};

export function SelectPaymentMethodCard({
  cartTotalInUsdCents,
  parentDomain,
  footerButton,
  disabled = false,
  onPaymentMethodDetailsChanged,
  onSelectedPaymentMethodChanged,
}: SelectPaymentMethodCardProps) {
  const { defaultNfscBalanceChainId: defaultPaymentChainId } =
    useAllowedChains(parentDomain);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    SelectedPaymentMethod | undefined
  >(SelectedPaymentMethod.NFSC);
  const [showAddPaymentMethodDialog, setShowAddPaymentMethodDialog] =
    useState(false);
  const [newCardPreview, setNewCardPreview] = useState<string | null>(null);

  const [nfscPaymentMethodDetails, setNfscPaymentMethodDetails] =
    useState<PaymentDetails | null>(null);
  const [creditCardPaymentMethodDetails, setCreditCardPaymentMethodDetails] =
    useState<PaymentDetails | null>(null);

  const isUseBalanceQueryEnabled = useMemo(() => {
    if (isNfscPayment(nfscPaymentMethodDetails?.paymentProviderDetails)) {
      return (
        !!nfscPaymentMethodDetails &&
        !!nfscPaymentMethodDetails.paymentProviderDetails.nfscPaymentDetails
          ?.walletAddress &&
        !!nfscPaymentMethodDetails.paymentProviderDetails.nfscPaymentDetails
          .chainId
      );
    }
    return false;
  }, [nfscPaymentMethodDetails]);

  const {
    data: nfscBalanceData,
    refetch: refetchNfscBalance,
    isLoading: balanceIsLoading,
  } = useBalance(
    (() => {
      if (
        nfscPaymentMethodDetails?.paymentProviderDetails &&
        isNfscPayment(nfscPaymentMethodDetails.paymentProviderDetails)
      ) {
        const { nfscPaymentDetails } =
          nfscPaymentMethodDetails.paymentProviderDetails;
        return {
          address: nfscPaymentDetails?.walletAddress as `0x${string}`,
          chainId: nfscPaymentDetails?.chainId,
          token: NFSC_CONTRACT_ADDRESS,
          query: {
            enabled: isUseBalanceQueryEnabled,
          },
        };
      }

      return {
        query: {
          enabled: false,
        },
      };
    })(),
  );

  const selectedWalletChainNfscBalanceInUsdCents = useMemo(() => {
    if (!nfscBalanceData) {
      return undefined;
    }

    return Number(
      formatUnits(nfscBalanceData.value, nfscBalanceData.decimals - 2),
    );
  }, [nfscBalanceData]);

  // TODO: (sid->zim) use this to render add nfsc dialog
  const _hasSufficientBalance = useMemo(() => {
    return (
      selectedWalletChainNfscBalanceInUsdCents &&
      selectedWalletChainNfscBalanceInUsdCents >= cartTotalInUsdCents
    );
  }, [cartTotalInUsdCents, selectedWalletChainNfscBalanceInUsdCents]);

  const handleRadioGroupValueChanged = useCallback(
    (value: string) => {
      switch (value as SelectedPaymentMethod) {
        case SelectedPaymentMethod.NFSC:
          onPaymentMethodDetailsChanged(nfscPaymentMethodDetails);
          break;
        case SelectedPaymentMethod.CREDIT_CARD:
          onPaymentMethodDetailsChanged(creditCardPaymentMethodDetails);
          break;
        default:
        //passthrough
      }
      setSelectedPaymentMethod(value as SelectedPaymentMethod);
      onSelectedPaymentMethodChanged(value as SelectedPaymentMethod);
    },
    [
      creditCardPaymentMethodDetails,
      nfscPaymentMethodDetails,
      onPaymentMethodDetailsChanged,
      onSelectedPaymentMethodChanged,
    ],
  );

  const handleAddPaymentMethodSuccess = useCallback(
    (confirmationToken: ConfirmationToken) => {
      const newPaymentMethodDetails: PaymentDetails = {
        paymentProviderDetails: {
          paymentProvider: 'STRIPE',
          stripePaymentDetails: {
            paymentMethodId: undefined,
          },
        },
        paymentMetadata: {
          confirmationTokenId: confirmationToken.id,
        },
      };
      setCreditCardPaymentMethodDetails(newPaymentMethodDetails);
      setShowAddPaymentMethodDialog(false);
      setNewCardPreview(
        `•••• •••• •••• ${confirmationToken?.payment_method_preview?.card?.last4}`,
      );
      onPaymentMethodDetailsChanged(newPaymentMethodDetails);
    },
    [onPaymentMethodDetailsChanged],
  );

  const handleAddPaymentMethodError = useCallback(
    (error: Error) => {
      setCreditCardPaymentMethodDetails(null);
      setNewCardPreview(null);
      onPaymentMethodDetailsChanged(null);
      console.error(error);
    },
    [onPaymentMethodDetailsChanged],
  );

  const handleNfscWalletOrChainSelectValueChange = useCallback(
    ({
      walletAddress,
      chainId,
    }: {
      walletAddress?: string;
      chainId?: number;
    }) => {
      const newNfscPaymentMethodDetails: PaymentDetails = {
        paymentProviderDetails: {
          paymentProvider:
            chainId === CHAINS.mainnet.id
              ? 'NFSC_ETHEREUM'
              : chainId === CHAINS.base.id
                ? 'NFSC_BASE'
                : 'NFSC_ETHEREUM_SEPOLIA',
          nfscPaymentDetails: {
            walletAddress:
              walletAddress ??
              ((isNfscPayment(nfscPaymentMethodDetails?.paymentProviderDetails)
                ? nfscPaymentMethodDetails.paymentProviderDetails
                    .nfscPaymentDetails?.walletAddress
                : undefined) ||
                undefined),
            chainId:
              chainId ??
              ((isNfscPayment(nfscPaymentMethodDetails?.paymentProviderDetails)
                ? nfscPaymentMethodDetails.paymentProviderDetails
                    .nfscPaymentDetails?.chainId
                : defaultPaymentChainId) ||
                defaultPaymentChainId),
          },
        },
      };
      setNfscPaymentMethodDetails(newNfscPaymentMethodDetails);
      onPaymentMethodDetailsChanged(newNfscPaymentMethodDetails);
      refetchNfscBalance();
    },
    [
      nfscPaymentMethodDetails,
      onPaymentMethodDetailsChanged,
      refetchNfscBalance,
      defaultPaymentChainId,
    ],
  );

  const handleNfscWalletSelectValueChange = useCallback(
    (value: string) => {
      const walletAddress = value;
      handleNfscWalletOrChainSelectValueChange({ walletAddress });
    },
    [handleNfscWalletOrChainSelectValueChange],
  );

  const handleNfscChainSelectValueChange = useCallback(
    (value: string) => {
      const chainId = Number.parseInt(value);
      handleNfscWalletOrChainSelectValueChange({ chainId });
    },
    [handleNfscWalletOrChainSelectValueChange],
  );

  return (
    <CartCard
      title="Payment Method"
      footer={
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between text-xl">
            <span>Total</span>
            <span>{formatAmountInUSD(cartTotalInUsdCents, true)} USD</span>
          </div>
          {footerButton}
        </div>
      }
    >
      <RadioGroup
        value={selectedPaymentMethod}
        onValueChange={handleRadioGroupValueChanged}
        className="flex flex-col gap-6"
      >
        {/* NFSC Balance Option */}
        <div className="space-y-2">
          <p className="text-xl">Use balance</p>
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value={SelectedPaymentMethod.NFSC}
              id={SelectedPaymentMethod.NFSC}
              disabled={disabled}
            />
            <div
              className={cn(
                'flex-1 bg-[#18181B] rounded-lg p-4',
                disabled && 'opacity-50',
              )}
            >
              <div className="flex items-center gap-4">
                <Image
                  src={'/nfsc.svg'}
                  alt="nfsc icon"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <SelectWallet
                      onValueChange={handleNfscWalletSelectValueChange}
                      selectTriggerDisabled={
                        selectedPaymentMethod !== SelectedPaymentMethod.NFSC ||
                        disabled
                      }
                    />
                    <SelectChain
                      baseChainOnly={false}
                      parentDomain={parentDomain}
                      onValueChange={handleNfscChainSelectValueChange}
                      selectTriggerDisabled={
                        selectedPaymentMethod !== SelectedPaymentMethod.NFSC ||
                        disabled
                      }
                    />
                  </div>
                  {selectedWalletChainNfscBalanceInUsdCents === undefined ? (
                    isUseBalanceQueryEnabled && balanceIsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null
                  ) : (
                    <span className="text-secondary-foreground/50 text-sm">
                      {formatAmountInUSD(
                        selectedWalletChainNfscBalanceInUsdCents,
                        true,
                      )}{' '}
                      available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Card Option */}
        <div className="space-y-2">
          <p className="text-xl">Use credit card</p>
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value={SelectedPaymentMethod.CREDIT_CARD}
              id={SelectedPaymentMethod.CREDIT_CARD}
              disabled={disabled}
            />
            <AddPaymentMethodDialog
              amountInUsdCents={cartTotalInUsdCents}
              onAddPaymentMethodSuccess={handleAddPaymentMethodSuccess}
              onAddPaymentMethodError={handleAddPaymentMethodError}
              onOpenChange={setShowAddPaymentMethodDialog}
              showAddPaymentMethodDialog={showAddPaymentMethodDialog}
              disabled={
                disabled ||
                selectedPaymentMethod !== SelectedPaymentMethod.CREDIT_CARD
              }
              dialogTrigger={
                <div
                  className={cn(
                    'flex justify-between items-center w-full p-4 rounded-lg bg-[#18181B] cursor-pointer',
                    selectedPaymentMethod === SelectedPaymentMethod.CREDIT_CARD
                      ? ''
                      : 'opacity-50',
                    (disabled ||
                      selectedPaymentMethod !==
                        SelectedPaymentMethod.CREDIT_CARD) &&
                      'opacity-50 cursor-not-allowed',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {newCardPreview ?? 'Add or Select A Saved Card'}
                    </span>
                  </div>
                  {newCardPreview === null ? (
                    <PlusIcon className="h-4 w-4" />
                  ) : (
                    <PencilIcon className="h-4 w-4" />
                  )}
                </div>
              }
            />
          </div>
        </div>
      </RadioGroup>

      <Separator className="my-6" />
    </CartCard>
  );
}

export type NoPaymentMethodRequiredCardProps = {
  footerButton?: ReactNode;
  disabled?: boolean;
};

export function NoPaymentMethodRequiredCard({
  footerButton,
}: NoPaymentMethodRequiredCardProps) {
  return (
    <CartCard
      title="Payment Method"
      footer={<div className="flex flex-col gap-4 w-full">{footerButton}</div>}
    >
      <div className="flex flex-col items-center justify-center">
        <p className="text-muted-foreground text-center">
          We hope you'll enjoy your new domains! We'll send them to the wallet
          address you've provided.
        </p>
      </div>
      <Separator className="my-6" />
    </CartCard>
  );
}

export type AuthRequiredCardProps = {
  footerButton?: ReactNode;
  cartTotalInUsdCents: number;
};

export function AuthRequiredCard({
  footerButton,
  cartTotalInUsdCents,
}: AuthRequiredCardProps) {
  return (
    <CartCard
      title="Summary"
      footer={
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between text-xl">
            <span>Total</span>
            <span>{formatAmountInUSD(cartTotalInUsdCents, true)} USD</span>
          </div>
          {footerButton}
        </div>
      }
    />
  );
}
