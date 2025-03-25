'use client';

import { PencilIcon, PlusIcon } from 'lucide-react';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { paymentProviderEnum } from '@namefi-astra/db';
import type { ConfirmationToken } from '@stripe/stripe-js';
import { AddPaymentMethodDialog } from '../addPaymentMethod/addPaymentMethodDialog';
import { Button } from '../ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/shadcn/card';
import { Label } from '../ui/shadcn/label';
import { RadioGroup, RadioGroupItem } from '../ui/shadcn/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/shadcn/select';

const USER_BALANCE_IN_USD_CENTS = 2000;
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
    confirmationToken?: string;
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

  const { isAuthenticated, privyUser } = useAuth();

  useEffect(() => {
    const walletAddress = privyUser?.wallet?.address;
    const chainType = privyUser?.wallet?.chainType;
    if (
      !isAuthenticated ||
      walletAddress === null ||
      walletAddress === undefined ||
      chainType === null ||
      chainType === undefined
    ) {
      setNfscPaymentMethodDetails(null);
      return;
    }

    setNfscPaymentMethodDetails({
      paymentProvider: chainType === 'ethereum' ? 'NFSC_ETHEREUM' : 'NFSC_BASE',
      paymentProviderOptions: { walletAddress: privyUser?.wallet?.address },
    });
  }, [isAuthenticated, privyUser]);

  const hasSufficientBalance = useMemo(() => {
    return USER_BALANCE_IN_USD_CENTS >= cartTotalInUsdCents;
  }, [cartTotalInUsdCents]);

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
          confirmationToken: confirmationToken.id,
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
              {hasSufficientBalance
                ? `Your balance: ${USER_BALANCE_IN_USD_CENTS}`
                : 'Not enough funds'}
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
