import type { ConfirmationToken } from '@stripe/stripe-js';
import { PlusCircleIcon } from 'lucide-react';
import { StripeProvider } from '../providers/stripeProvider';
import { Button } from '../ui/shadcn/button';
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
  iconOnly: boolean;
  onAddPaymentMethodError: (error: Error) => void;
  onAddPaymentMethodSuccess: (confirmationToken: ConfirmationToken) => void;
  onOpenChange: (open: boolean) => void;
  paymentMethodAlreadyAdded: boolean;
  showAddPaymentMethodDialog: boolean;
}

export function AddPaymentMethodDialog({
  amountInUsdCents,
  iconOnly,
  onAddPaymentMethodError,
  onAddPaymentMethodSuccess,
  onOpenChange,
  paymentMethodAlreadyAdded,
  showAddPaymentMethodDialog,
}: AddPaymentMethodDialogProps) {
  return (
    <Dialog open={showAddPaymentMethodDialog} onOpenChange={onOpenChange}>
      <DialogTrigger asChild={true}>
        {iconOnly ? (
          <PlusCircleIcon />
        ) : (
          <Button disabled={paymentMethodAlreadyAdded}>
            {paymentMethodAlreadyAdded
              ? 'Payment Method Added'
              : 'Add Payment Method'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
