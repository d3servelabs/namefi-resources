'use client';

import { SavePaymentMethodDialog } from '@/components/savePaymentMethod/savePaymentMethodDialog';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/utils/trpc';
import type { SetupIntent } from '@stripe/stripe-js';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import type { inferOutput } from '@trpc/tanstack-react-query';
import { CreditCardIcon, Loader2, PlusIcon, TrashIcon } from 'lucide-react';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PaymentMethodsManagerPlaceholder } from './PaymentMethodsManagerPlaceholder';

const LoadingPlaceholder = () => (
  <PaymentMethodsManagerPlaceholder
    title="Loading payment methods"
    description="Please wait while we load your payment methods"
    icon={<Loader2 className="animate-spin" />}
  />
);

const EmptyPlaceholder = () => (
  <PaymentMethodsManagerPlaceholder
    title="No payment methods found"
    description="Consider adding a new payment method"
    icon={<CreditCardIcon className="size-10 text-muted-foreground" />}
  />
);

export default function PaymentMethodsManager() {
  const [showSavePaymentMethodDialog, setShowSavePaymentMethodDialog] =
    useState(false);
  const [paymentMethodsRefetchRequired, setPaymentMethodsRefetchRequired] =
    useState(true);

  const { isAuthenticated } = useAuth();

  const handleSavePaymentMethodSuccess = useCallback(
    (_setupIntent: SetupIntent) => {
      setShowSavePaymentMethodDialog(false);
      setPaymentMethodsRefetchRequired(true);
    },
    [],
  );

  const handleSavePaymentMethodError = useCallback((error: Error) => {
    toast('Failed to save your payment method', { description: error.message });
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Please sign in to view your payment methods
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Payment Methods</h2>
        <SavePaymentMethodDialog
          amountInUsdCents={1000}
          dialogTrigger={
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          }
          onSavePaymentMethodError={handleSavePaymentMethodError}
          onSavePaymentMethodSuccess={handleSavePaymentMethodSuccess}
          onOpenChange={setShowSavePaymentMethodDialog}
          showSavePaymentMethodDialog={showSavePaymentMethodDialog}
        />
      </div>
      <Suspense fallback={<LoadingPlaceholder />}>
        <PaymentMethodsGrid
          paymentMethodsRefetchRequired={paymentMethodsRefetchRequired}
          onPaymentMethodsRefetch={() =>
            setPaymentMethodsRefetchRequired(false)
          }
        />
      </Suspense>
    </div>
  );
}

interface PaymentMethodsGridProps {
  paymentMethodsRefetchRequired: boolean;
  onPaymentMethodsRefetch: () => void;
}

function PaymentMethodsGrid({
  paymentMethodsRefetchRequired,
  onPaymentMethodsRefetch,
}: PaymentMethodsGridProps) {
  type CreditCard = inferOutput<typeof trpc.payments.getPaymentMethods>[number];

  const [deletedPaymentMethodIds, setDeletedPaymentMethodIds] = useState<
    string[]
  >([]);

  const trpc = useTRPC();

  const {
    data: getPaymentMethodsData,
    refetch: refetchPaymentMethods,
    isFetching: getPaymentMethodsFetching,
  } = useSuspenseQuery({
    ...trpc.payments.getPaymentMethods.queryOptions(),
  });

  const {
    mutate: deletePaymentMethod,
    isPending: deletePaymentMethodPending,
    variables: deletePaymentMethodVariables,
  } = useMutation(
    trpc.payments.deletePaymentMethod.mutationOptions({
      onSuccess: (
        data: inferOutput<typeof trpc.payments.deletePaymentMethod>,
      ) => {
        if (data.isSuccess && deletePaymentMethodVariables?.paymentMethodId) {
          setDeletedPaymentMethodIds([
            ...deletedPaymentMethodIds,
            deletePaymentMethodVariables.paymentMethodId,
          ]);
          toast('Successfully deleted your payment method');
        }
      },
      onError: (error) => {
        setDeletedPaymentMethodIds(
          deletedPaymentMethodIds.filter(
            (id) => id !== deletePaymentMethodVariables?.paymentMethodId,
          ),
        );

        toast('Failed to delete your payment method', {
          description: error.message,
        });
      },
    }),
  );

  const creditCards: CreditCard[] = useMemo(() => {
    return (
      getPaymentMethodsData?.filter(
        (method) => !deletedPaymentMethodIds.includes(method.id),
      ) ?? []
    );
  }, [getPaymentMethodsData, deletedPaymentMethodIds]);

  const handleDeleteMethod = useCallback(
    (id: string) => {
      deletePaymentMethod({ paymentMethodId: id });
    },
    [deletePaymentMethod],
  );

  useEffect(() => {
    if (paymentMethodsRefetchRequired) {
      refetchPaymentMethods();
      onPaymentMethodsRefetch();
    }
  }, [
    onPaymentMethodsRefetch,
    paymentMethodsRefetchRequired,
    refetchPaymentMethods,
  ]);

  if (getPaymentMethodsFetching) {
    return <LoadingPlaceholder />;
  }

  if (creditCards.length === 0) {
    return <EmptyPlaceholder />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {creditCards.map((method) => (
        <Card key={method.id} className={cn('relative')}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-muted">
                <CreditCardIcon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{method.last4}</h3>
                <>
                  <p className="text-sm text-muted-foreground">
                    {method.brand} •••• {method.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">{`Expires ${method.exp_month}/${method.exp_year}`}</p>
                </>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  (deletePaymentMethodPending &&
                    deletePaymentMethodVariables?.paymentMethodId ===
                      method.id) ||
                  getPaymentMethodsFetching
                }
                onClick={() => handleDeleteMethod(method.id)}
              >
                {deletePaymentMethodPending &&
                deletePaymentMethodVariables?.paymentMethodId === method.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
