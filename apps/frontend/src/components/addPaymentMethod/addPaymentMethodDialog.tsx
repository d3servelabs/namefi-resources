import type { ConfirmationToken } from '@stripe/stripe-js';
import type { ReactNode } from 'react';
import { StripeProvider } from '../providers/stripeProvider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/shadcn/dialog';
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
  return (
    <Dialog open={showAddPaymentMethodDialog} onOpenChange={onOpenChange}>
      <DialogTrigger asChild={true}>{dialogTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-sm:max-h-[85%] overflow-auto">
        <DialogHeader>
          <DialogTitle>Payment Method Details</DialogTitle>
          <DialogDescription>
            Enter your payment method details. We won't charge you until you
            confirm your order.
          </DialogDescription>
        </DialogHeader>
        <StripeProvider amount={amountInUsdCents}>
          <AddPaymentMethodForm
            onSuccess={onAddPaymentMethodSuccess}
            onError={onAddPaymentMethodError}
          />
        </StripeProvider>
      </DialogContent>
    </Dialog>
  );
}
