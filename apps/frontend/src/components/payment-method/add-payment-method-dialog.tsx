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
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactElement, type ReactNode, useEffect, useState } from 'react';
import { StripeProvider } from '@/components/providers/stripe';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { cn } from '@namefi-astra/ui/lib/cn';
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
  const t = useTranslations('payment');
  const [customerSessionClientSecret, setCustomerSessionClientSecret] =
    useState<string | undefined>(undefined);
  const trpc = useTRPC();

  const { mutate: createCustomerSession, isError: isCustomerSessionError } =
    useMutation(
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
    if (!showAddPaymentMethodDialog) {
      setCustomerSessionClientSecret(undefined);
      return;
    }

    setCustomerSessionClientSecret(undefined);
    createCustomerSession();
  }, [createCustomerSession, showAddPaymentMethodDialog]);

  return (
    <Dialog
      open={showAddPaymentMethodDialog}
      onOpenChange={(open) => !disabled && onOpenChange(open)}
    >
      <DialogTrigger
        disabled={disabled}
        render={dialogTrigger as ReactElement}
      />
      <DialogContent
        className={cn(
          MOBILE_BOTTOM_SHEET_DIALOG,
          'sm:max-w-[425px] max-sm:max-h-[85%]',
        )}
      >
        <DialogHeader>
          <DialogTitle>{t('addPaymentMethodDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('addPaymentMethodDialog.description')}
          </DialogDescription>
        </DialogHeader>
        {customerSessionClientSecret ? (
          <StripeProvider
            amount={amountInUsdCents}
            customerSessionClientSecret={customerSessionClientSecret}
          >
            <AddPaymentMethodForm
              onSuccess={onAddPaymentMethodSuccess}
              onError={onAddPaymentMethodError}
            />
          </StripeProvider>
        ) : (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            {!isCustomerSessionError && (
              <Loader2 className="size-4 animate-spin" />
            )}
            <span>
              {isCustomerSessionError
                ? t('addPaymentMethodDialog.unableToLoad')
                : t('addPaymentMethodDialog.loading')}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
