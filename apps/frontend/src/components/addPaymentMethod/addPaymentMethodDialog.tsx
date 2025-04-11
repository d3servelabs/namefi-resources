import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import { useTRPC } from '@/utils/trpc';
import type { ConfirmationToken } from '@stripe/stripe-js';
import { useMutation } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import { StripeProvider } from '../providers/stripeProvider';
import { AddPaymentMethodForm } from './addPaymentMethodForm';

export interface AddPaymentMethodDialogProps {
  amountInUsdCents: number;
  dialogTrigger: ReactNode;
  onAddPaymentMethodError: (error: Error) => void;
  onAddPaymentMethodSuccess: (confirmationToken: ConfirmationToken) => void;
  onOpenChange: (open: boolean) => void;
  showAddPaymentMethodDialog: boolean;
}

export function AddPaymentMethodDialog({
  amountInUsdCents,
  dialogTrigger,
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
      onError: (error) => {
        setCustomerSessionClientSecret(undefined);
      },
    }),
  );

  useEffect(() => {
    createCustomerSession();
  }, [createCustomerSession]);

  return (
    <Dialog open={showAddPaymentMethodDialog} onOpenChange={onOpenChange}>
      <DialogTrigger asChild={true}>{dialogTrigger}</DialogTrigger>
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
