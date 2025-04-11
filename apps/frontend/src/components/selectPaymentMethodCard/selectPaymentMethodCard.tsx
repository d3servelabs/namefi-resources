'use client';

import { CreditCardIcon, Loader2, PencilIcon, PlusIcon } from 'lucide-react';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Label } from '@/components/ui/shadcn/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group';
import { cn } from '@/lib/utils';
import { formatAmountInUSD } from '@/utils/number';
import type { DeepPartial } from '@/utils/types';
import {
  type PaymentProviderDetails,
  isNfscPayment,
  paymentProviderSchema,
} from '@namefi-astra/db/types';
import { CHAINS, NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils';
import { useWallets } from '@privy-io/react-auth';
import type { ConfirmationToken } from '@stripe/stripe-js';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { useBalance } from 'wagmi';
import { SelectChain, SelectWallet } from '../SelectWalletAndChain';
import { AddPaymentMethodDialog } from '../addPaymentMethod/addPaymentMethodDialog';

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
  footerButton?: ReactNode;
  onPaymentMethodDetailsChanged: (
    paymentMethodDetails: PaymentDetails | null,
  ) => void;
  onSelectedPaymentMethodChanged: (
    selectedPaymentMethod: SelectedPaymentMethod | null | undefined,
  ) => void;
};

export function SelectPaymentMethodCard({
  cartTotalInUsdCents,
  footerButton,
  onPaymentMethodDetailsChanged,
  onSelectedPaymentMethodChanged,
}: SelectPaymentMethodCardProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    SelectedPaymentMethod | undefined
  >(undefined);
  const [showAddPaymentMethodDialog, setShowAddPaymentMethodDialog] =
    useState(false);
  const [newCardPreview, setNewCardPreview] = useState<string | null>(null);

  const [nfscPaymentMethodDetails, setNfscPaymentMethodDetails] =
    useState<PaymentDetails | null>(null);
  const [creditCardPaymentMethodDetails, setCreditCardPaymentMethodDetails] =
    useState<PaymentDetails | null>(null);

  const { ready: ethereumWalletsReady, wallets: ethereumWallets } =
    useWallets();

  const connectedWalletAddresses = useMemo(() => {
    if (!ethereumWalletsReady) {
      return [];
    }

    return [...ethereumWallets].map((wallet) => wallet.address);
  }, [ethereumWallets, ethereumWalletsReady]);

  useEffect(() => {
    setNfscPaymentMethodDetails({
      paymentProviderDetails: {
        paymentProvider: paymentProviderSchema.Values.NFSC_BASE,
        nfscPaymentDetails: {
          walletAddress:
            connectedWalletAddresses.length > 0
              ? connectedWalletAddresses[0]
              : undefined,
          chainId: CHAINS.base.id,
        },
      },
    });
  }, [connectedWalletAddresses]);

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

  const hasSufficientBalance = useMemo(() => {
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
          paymentProvider: paymentProviderSchema.Values.STRIPE,
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
      console.log(error);
    },
    [onPaymentMethodDetailsChanged],
  );

  const handleNfscWalletOrChainSelectValueChange = useCallback(
    ({
      walletAddress,
      chainId,
    }: { walletAddress?: string; chainId?: number }) => {
      const newNfscPaymentMethodDetails: PaymentDetails = {
        paymentProviderDetails: {
          paymentProvider:
            chainId === 1
              ? paymentProviderSchema.Values.NFSC_ETHEREUM
              : paymentProviderSchema.Values.NFSC_BASE,
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
                : CHAINS.base.id) ||
                CHAINS.base.id),
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
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
        <CardDescription>
          Select a payment method or add a new card.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <RadioGroup
          value={selectedPaymentMethod}
          onValueChange={handleRadioGroupValueChanged}
          className="space-y-4"
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={SelectedPaymentMethod.NFSC}
                id={SelectedPaymentMethod.NFSC}
              />
              <Image
                src={'/nfsc.svg'}
                alt="nfsc icon"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <Label
                htmlFor={SelectedPaymentMethod.NFSC}
                className="font-medium"
              >
                Use $NFSC balance
              </Label>
            </div>
            <div
              className={cn(
                'flex items-center pl-6',
                selectedPaymentMethod === SelectedPaymentMethod.NFSC
                  ? ''
                  : 'opacity-50',
              )}
            >
              {selectedWalletChainNfscBalanceInUsdCents === undefined ? (
                isUseBalanceQueryEnabled && balanceIsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <></>
                )
              ) : (
                <span
                  className={cn(
                    'text-sm',
                    hasSufficientBalance ? 'text-green-500' : 'text-red-500',
                  )}
                >
                  Your Credit Balance:{' '}
                  {formatAmountInUSD(
                    selectedWalletChainNfscBalanceInUsdCents,
                    true,
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center pl-6">
              <SelectWallet
                onValueChange={handleNfscWalletSelectValueChange}
                selectTriggerDisabled={
                  selectedPaymentMethod !== SelectedPaymentMethod.NFSC
                }
              />

              <SelectChain
                baseChainOnly={false}
                onValueChange={handleNfscChainSelectValueChange}
                selectTriggerDisabled={
                  selectedPaymentMethod !== SelectedPaymentMethod.NFSC
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={SelectedPaymentMethod.CREDIT_CARD}
                id={SelectedPaymentMethod.CREDIT_CARD}
              />
              <CreditCardIcon className="h-10 w-10" />
              <Label
                htmlFor={SelectedPaymentMethod.CREDIT_CARD}
                className="font-medium"
              >
                Credit Card
              </Label>
            </div>
            <div className="flex items-center pl-6">
              <AddPaymentMethodDialog
                amountInUsdCents={cartTotalInUsdCents}
                onAddPaymentMethodSuccess={handleAddPaymentMethodSuccess}
                onAddPaymentMethodError={handleAddPaymentMethodError}
                onOpenChange={setShowAddPaymentMethodDialog}
                showAddPaymentMethodDialog={showAddPaymentMethodDialog}
                dialogTrigger={
                  <Button
                    variant="outline"
                    className="justify-start disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background"
                    disabled={
                      selectedPaymentMethod !==
                      SelectedPaymentMethod.CREDIT_CARD
                    }
                  >
                    {newCardPreview === null ? (
                      <PlusIcon className="mr-2 h-4 w-4" />
                    ) : (
                      <PencilIcon className="mr-2 h-4 w-4" />
                    )}
                    {newCardPreview ?? 'Add or Select A Card'}
                  </Button>
                }
              />
            </div>
          </div>
        </RadioGroup>
      </CardContent>
      <CardFooter>{footerButton}</CardFooter>
    </Card>
  );
}
