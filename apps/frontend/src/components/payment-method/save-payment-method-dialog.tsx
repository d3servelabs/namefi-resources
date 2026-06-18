import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { useTRPC } from '@/lib/trpc';
import type { SetupIntent } from '@stripe/stripe-js';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { type ReactElement, useEffect, useState } from 'react';
import { StripeProvider } from '@/components/providers/stripe';
import { SavePaymentMethodForm } from './save-payment-method-form';

export interface SavePaymentMethodDialogProps {
  amountInUsdCents: number;
  dialogTrigger: ReactElement;
  onSavePaymentMethodError: (error: Error) => void;
  onSavePaymentMethodSuccess: (setupIntent: SetupIntent) => void;
  onOpenChange: (open: boolean) => void;
  showSavePaymentMethodDialog: boolean;
  returnUrl?: string;
}

export function SavePaymentMethodDialog({
  amountInUsdCents,
  dialogTrigger,
  onSavePaymentMethodError,
  onSavePaymentMethodSuccess,
  onOpenChange,
  showSavePaymentMethodDialog,
  returnUrl,
}: SavePaymentMethodDialogProps) {
  const t = useTranslations('paymentMethods');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerSessionClientSecret, setCustomerSessionClientSecret] =
    useState<string | null>(null);
  const trpc = useTRPC();

  const { mutate: prepareSavePaymentMethod } = useMutation(
    trpc.payments.createSetupIntent.mutationOptions({
      onSuccess: (data) => {
        setClientSecret(data?.setupIntentClientSecret);
        setCustomerSessionClientSecret(data?.customerSessionClientSecret);
      },
      onError: (error) => {
        console.error('Error preparing save payment method:', error);
        setClientSecret(null);
      },
    }),
  );

  useEffect(() => {
    if (showSavePaymentMethodDialog) {
      prepareSavePaymentMethod();
    }
  }, [showSavePaymentMethodDialog, prepareSavePaymentMethod]);

  return (
    <Dialog open={showSavePaymentMethodDialog} onOpenChange={onOpenChange}>
      <DialogTrigger render={dialogTrigger} />
      <DialogContent className="sm:max-w-[425px] max-sm:max-h-[85%] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t('saveDialog.title')}</DialogTitle>
          <DialogDescription>{t('saveDialog.description')}</DialogDescription>
        </DialogHeader>
        <StripeProvider
          amount={amountInUsdCents}
          clientSecret={clientSecret ?? undefined}
          customerSessionClientSecret={customerSessionClientSecret ?? undefined}
        >
          <SavePaymentMethodForm
            onSuccess={onSavePaymentMethodSuccess}
            onError={onSavePaymentMethodError}
            returnUrl={returnUrl}
          />
        </StripeProvider>
      </DialogContent>
    </Dialog>
  );
}
