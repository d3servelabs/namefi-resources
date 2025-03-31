'use client';

import { Loader2, PencilIcon, PlusIcon } from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn, getShortAddress } from '@/lib/utils';
import { supportedChains } from '@/lib/wagmiConfig';
import { formatAmountInUSD } from '@/utils/number';
import type { paymentProviderEnum } from '@namefi-astra/db';
import { NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils';
import { useSolanaWallets, useWallets } from '@privy-io/react-auth';
import type { ConfirmationToken } from '@stripe/stripe-js';
import { formatUnits } from 'viem';
import { useBalance } from 'wagmi';
import { AddPaymentMethodDialog } from '../addPaymentMethod/addPaymentMethodDialog';

const SAVED_CARDS: SavedCardDetails[] = [
  {
    brand: 'visa',
    expMonth: 1,
    expYear: 2025,
    last4: '0102',
    paymentMethodId: 'visa1',
  },
  {
    brand: 'visa',
    expMonth: 2,
    expYear: 2025,
    last4: '0304',
    paymentMethodId: 'visa2',
  },
  {
    brand: 'visa',
    expMonth: 3,
    expYear: 2025,
    last4: '0506',
    paymentMethodId: 'visa3',
  },
];

export enum SelectedPaymentMethod {
  NEW_CARD = 'NEW_CARD',
  NFSC = 'NFSC',
  SAVED_CARD = 'SAVED_CARD',
}

export type PaymentMethodDetails = {
  paymentProvider: (typeof paymentProviderEnum.enumValues)[number];
  paymentProviderOptions: {
    chainId?: number;
    confirmationTokenId?: string;
    paymentMethodId?: string;
    walletAddress?: string;
  };
};

export type SavedCardDetails = {
  brand: string;
  expMonth: number;
  expYear: number;
  last4: string;
  paymentMethodId: string;
};

export type SelectPaymentMethodCardProps = {
  cartTotalInUsdCents: number;
  footerButton?: ReactNode;
  onPaymentMethodDetailsChanged: (
    paymentMethodDetails: PaymentMethodDetails | null,
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
    useState<PaymentMethodDetails | null>(null);
  const [savedCardPaymentMethodDetails, setSavedCardPaymentMethodDetails] =
    useState<PaymentMethodDetails | null>(null);
  const [newCardPaymentMethodDetails, setNewCardPaymentMethodDetails] =
    useState<PaymentMethodDetails | null>(null);

  const { ready: ethereumWalletsReady, wallets: ethereumWallets } =
    useWallets();
  const { ready: solanaWalletsReady, wallets: solanaWallets } =
    useSolanaWallets();

  const isMobile = useIsMobile();

  const connectedWalletAddresses = useMemo(() => {
    if (!(ethereumWalletsReady && solanaWalletsReady)) {
      return [];
    }

    return [...ethereumWallets, ...solanaWallets].map(
      (wallet) => wallet.address,
    );
  }, [
    ethereumWallets,
    ethereumWalletsReady,
    solanaWallets,
    solanaWalletsReady,
  ]);

  const {
    data: nfscBalanceData,
    refetch: refetchNfscBalance,
    isLoading: balanceIsLoading,
  } = useBalance({
    address: nfscPaymentMethodDetails?.paymentProviderOptions
      .walletAddress as `0x${string}`,
    chainId: nfscPaymentMethodDetails?.paymentProviderOptions.chainId,
    token: NFSC_CONTRACT_ADDRESS,
    query: {
      enabled:
        !!nfscPaymentMethodDetails &&
        !!nfscPaymentMethodDetails.paymentProviderOptions.walletAddress &&
        !!nfscPaymentMethodDetails.paymentProviderOptions.chainId,
    },
  });

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
        case SelectedPaymentMethod.SAVED_CARD:
          onPaymentMethodDetailsChanged(savedCardPaymentMethodDetails);
          break;
        case SelectedPaymentMethod.NEW_CARD:
          onPaymentMethodDetailsChanged(newCardPaymentMethodDetails);
          break;
        default:
        //passthrough
      }
      setSelectedPaymentMethod(value as SelectedPaymentMethod);
      onSelectedPaymentMethodChanged(value as SelectedPaymentMethod);
    },
    [
      newCardPaymentMethodDetails,
      nfscPaymentMethodDetails,
      onPaymentMethodDetailsChanged,
      onSelectedPaymentMethodChanged,
      savedCardPaymentMethodDetails,
    ],
  );

  const handleAddPaymentMethodSuccess = useCallback(
    (confirmationToken: ConfirmationToken) => {
      const newPaymentMethodDetails: PaymentMethodDetails = {
        paymentProvider: 'STRIPE',
        paymentProviderOptions: {
          confirmationTokenId: confirmationToken.id,
        },
      };
      setNewCardPaymentMethodDetails(newPaymentMethodDetails);
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
      setNewCardPaymentMethodDetails(null);
      setNewCardPreview(null);
      onPaymentMethodDetailsChanged(null);
      console.log(error);
    },
    [onPaymentMethodDetailsChanged],
  );

  const handleSavedCardSelectValueChange = useCallback(
    (value: string) => {
      const selectedSavedCard = SAVED_CARDS.find(
        (card) => card.paymentMethodId === value,
      );
      const savedCardPaymentMethodDetails: PaymentMethodDetails = {
        paymentProvider: 'STRIPE',
        paymentProviderOptions: {
          paymentMethodId: selectedSavedCard?.paymentMethodId,
        },
      };
      setSavedCardPaymentMethodDetails(savedCardPaymentMethodDetails);
      onPaymentMethodDetailsChanged(savedCardPaymentMethodDetails);
    },
    [onPaymentMethodDetailsChanged],
  );

  const handleNfscWalletOrChainSelectValueChange = useCallback(
    ({
      walletAddress,
      chainId,
    }: { walletAddress?: string; chainId?: number }) => {
      const newNfscPaymentMethodDetails: PaymentMethodDetails = {
        paymentProvider: chainId === 1 ? 'NFSC_ETHEREUM' : 'NFSC_BASE',
        paymentProviderOptions: {
          walletAddress:
            walletAddress ??
            nfscPaymentMethodDetails?.paymentProviderOptions.walletAddress,
          chainId:
            chainId ?? nfscPaymentMethodDetails?.paymentProviderOptions.chainId,
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
              <Label
                htmlFor={SelectedPaymentMethod.NFSC}
                className="font-medium"
              >
                NFSC
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
                balanceIsLoading ? (
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
              <Select
                disabled={selectedPaymentMethod !== SelectedPaymentMethod.NFSC}
                onValueChange={handleNfscWalletSelectValueChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a Wallet" />
                </SelectTrigger>
                <SelectContent>
                  {connectedWalletAddresses.map((walletAddress) => (
                    <SelectItem
                      key={`${walletAddress}`}
                      value={`${walletAddress}`}
                    >{`${isMobile ? getShortAddress(walletAddress) : walletAddress}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                disabled={selectedPaymentMethod !== SelectedPaymentMethod.NFSC}
                onValueChange={handleNfscChainSelectValueChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a Chain" />
                </SelectTrigger>
                <SelectContent>
                  {supportedChains.map((chain) => (
                    <SelectItem
                      key={`${chain.id}`}
                      value={`${chain.id}`}
                    >{`${chain.name}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={SelectedPaymentMethod.SAVED_CARD}
                id={SelectedPaymentMethod.SAVED_CARD}
              />
              <Label
                htmlFor={SelectedPaymentMethod.SAVED_CARD}
                className="font-medium"
              >
                Use saved card
              </Label>
            </div>
            <div className="flex items-center pl-6">
              <Select
                disabled={
                  selectedPaymentMethod !== SelectedPaymentMethod.SAVED_CARD
                }
                onValueChange={handleSavedCardSelectValueChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a saved card" />
                </SelectTrigger>
                <SelectContent>
                  {SAVED_CARDS.map((savedCard) => (
                    <SelectItem
                      key={savedCard.last4}
                      value={savedCard.paymentMethodId}
                    >{`•••• •••• •••• ${savedCard.last4}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={SelectedPaymentMethod.NEW_CARD}
                id={SelectedPaymentMethod.NEW_CARD}
              />
              <Label
                htmlFor={SelectedPaymentMethod.NEW_CARD}
                className="font-medium"
              >
                Add a new card
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
                    className="justify-start"
                    disabled={
                      selectedPaymentMethod !== SelectedPaymentMethod.NEW_CARD
                    }
                  >
                    {newCardPreview === null ? (
                      <PlusIcon className="mr-2 h-4 w-4" />
                    ) : (
                      <PencilIcon className="mr-2 h-4 w-4" />
                    )}
                    {newCardPreview ?? 'Add new payment method'}
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
