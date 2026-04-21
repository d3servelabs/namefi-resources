import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { useTRPC } from '@/lib/trpc';
import type { ConfirmationToken } from '@stripe/stripe-js';
import { useMutation } from '@tanstack/react-query';
import { type ReactElement, type ReactNode, useEffect, useState } from 'react';
import { StripeProvider } from '@/components/providers/stripe';
import { AddPaymentMethodForm } from './add-payment-method-form';

export interface AddPaymentMethodDialogProps {
  amountInUsdCents: number;
  dialogTrigger: ReactNode;
  disabled?: boolean;
  onAddPaymentMethodError: (error: Error) => void;
  onAddPaymentMethodSuccess: (confirmationToken: ConfirmationToken) => void;
  onOpenChange: (open: boolean) => void;
  showAddPaymentMethodDialog: boolean;
}

export function AddPaymentMethodDialog({
  amountInUsdCents,
  dialogTrigger,
  disabled,
  onAddPaymentMethodError,
  onAddPaymentMethodSuccess,
  onOpenChange,
  showAddPaymentMethodDialog,
}: AddPaymentMethodDialogProps) {
  const [customerSessionClientSecret, setCustomerSessionClientSecret] =
    useState<string | undefined>(undefined);
  const trpc = useTRPC();

  const { mutate: createCustomerSession } = useMutation(
    trpc.payments.createCustomerSession.mutationOptions({
      onSuccess: (data) => {
        setCustomerSessionClientSecret(data.customerSessionClientSecret);
      },
      onError: (_error) => {
        setCustomerSessionClientSecret(undefined);
      },
    }),
  );

  useEffect(() => {
    createCustomerSession();
  }, [createCustomerSession]);

  return (
    <Dialog
      open={showAddPaymentMethodDialog}
      onOpenChange={(open) => !disabled && onOpenChange(open)}
    >
      <DialogTrigger
        disabled={disabled}
        render={dialogTrigger as ReactElement}
      />
      <DialogContent className="sm:max-w-[425px] max-sm:max-h-[85%]">
        <DialogHeader>
          <DialogTitle>Payment Method Details</DialogTitle>
          <DialogDescription>
            Enter your payment method details. We won't charge you until you
            confirm your order.
          </DialogDescription>
        </DialogHeader>
        <StripeProvider
          amount={amountInUsdCents}
          customerSessionClientSecret={customerSessionClientSecret}
        >
          <AddPaymentMethodForm
            onSuccess={onAddPaymentMethodSuccess}
            onError={onAddPaymentMethodError}
          />
        </StripeProvider>
      </DialogContent>
    </Dialog>
  );
}
