'use client';

import { StatusBadge } from '@/components/badges/StatusBadge';
import { CartCard } from '@/components/cart-card';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import { Separator } from '@/components/ui/shadcn/separator';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { itemTypeSchema } from '@namefi-astra/db/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { Unauthorized } from '@/components/unauthorized';
import { useAuth } from '@/hooks/useAuth';
import { getShortAddress } from '@/lib/utils';
import { formatAmountInUSD } from '@/utils/number';
import { useTRPC } from '@/utils/trpc';
import { getChain } from '@namefi-astra/utils';
import { useQuery } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { format } from 'date-fns';
import { Check, ClipboardCopy, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useMemo, useState } from 'react';

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({});

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    ...trpc.orders.getOrder.queryOptions({ orderId: id }),
    enabled: !!id,
    retry(failureCount, error) {
      if (failureCount >= 3) {
        return false;
      }
      if (
        error instanceof TRPCClientError &&
        error.data?.code === 'UNAUTHORIZED'
      ) {
        return false;
      }
      return true;
    },
  });

  const {
    data: paymentMethodDetails,
    isLoading: arePaymentMethodDetailsLoading,
  } = useQuery({
    ...trpc.orders.getOrderPaymentMethodDetails.queryOptions({ orderId: id }),
    enabled: !!id && isAuthenticated,
    retry(failureCount, error) {
      if (failureCount >= 3) {
        return false;
      }
      if (
        error instanceof TRPCClientError &&
        error.data?.code === 'UNAUTHORIZED'
      ) {
        return false;
      }
      return true;
    },
  });

  const isCreditCardPayment = useMemo(
    () => order?.payment?.paymentProvider === 'STRIPE',
    [order?.payment?.paymentProvider],
  );

  const creditCardPreviewText = useMemo(() => {
    if (
      !isCreditCardPayment ||
      arePaymentMethodDetailsLoading ||
      !paymentMethodDetails
    ) {
      return '-';
    }

    if (!(paymentMethodDetails.brand && paymentMethodDetails.last4)) {
      return 'Credit Card';
    }

    return `${paymentMethodDetails.brand.toLocaleUpperCase()}(${paymentMethodDetails.last4})`;
  }, [
    arePaymentMethodDetailsLoading,
    isCreditCardPayment,
    paymentMethodDetails,
  ]);

  const onChainPaymentPreviewText = useMemo(() => {
    if (isCreditCardPayment) {
      return '';
    }

    if (!order?.payment?.nfscPaymentDetails) {
      return '-';
    }

    const chain = getChain(order.payment.nfscPaymentDetails.chainId);
    const chainName =
      chain?.name || `Chain ID ${order.payment.nfscPaymentDetails.chainId}`;
    return `(${chainName}) ${getShortAddress(order.payment.nfscPaymentDetails.walletAddress)}`;
  }, [isCreditCardPayment, order?.payment]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFields((prev) => ({ ...prev, [field]: true }));

    setTimeout(() => {
      setCopiedFields((prev) => ({ ...prev, [field]: false }));
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Order Information Skeleton */}
          <div>
            <CartCard title="Order Information">
              <div className="flex flex-col gap-4 mt-6">
                {/* Order Status */}
                <div className="flex items-center justify-between h-8">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
                {/* Order ID */}
                <div className="flex items-center justify-between h-8">
                  <Skeleton className="h-6 w-24" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
                {/* Payment ID */}
                <div className="flex items-center justify-between h-8">
                  <Skeleton className="h-6 w-24" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
                {/* Payment Status */}
                <div className="flex items-center justify-between h-8">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
                {/* Payment */}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-24" />
                  <div className="flex flex-col items-end gap-1">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                {/* Recipient */}
                <div className="flex items-center justify-between h-8">
                  <Skeleton className="h-6 w-24" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              </div>
            </CartCard>
          </div>

          {/* Order Items Skeleton */}
          <div>
            <CartCard title="Order Items">
              <div className="flex flex-col mt-6">
                {/* Order Items */}
                {[1, 2].map((_, index) => (
                  <div key={index}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-48" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                    {index < 1 && (
                      <div className="my-6">
                        <Separator />
                      </div>
                    )}
                  </div>
                ))}
                <div className="mt-6">
                  <Separator />
                </div>
                {/* Total */}
                <div className="flex items-center justify-between pt-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </CartCard>
          </div>
        </div>
      </div>
    );
  }
  if (
    error &&
    error instanceof TRPCClientError &&
    error.data?.code === 'UNAUTHORIZED'
  ) {
    return (
      <Unauthorized description="You are not authorized to view this order." />
    );
  }
  if (!order) {
    return (
      <div className="container mx-auto py-8 px-8">
        <CartCard
          title="Order not found"
          description="The order you are looking for could not be found. Please check the order ID and try again."
          footer={
            <Button onClick={() => router.push('/orders')}>
              Back to Orders
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column - Order Information */}
        <div className="space-y-4">
          <CartCard
            title="Order Information"
            description={`Placed on ${format(
              new Date(order.createdAt),
              'MMM d, yyyy h:mm a',
            )}`}
          >
            <div className="flex flex-col gap-4 mt-6">
              <div className="flex items-center justify-between h-8">
                <span className="font-medium">Order Status:</span>
                <div className="flex items-center">
                  {order.status ? (
                    <StatusBadge status={order.status} type="order" />
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between h-8">
                <span className="font-medium">Order ID:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{order.id}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild={true}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(order.id, 'orderId')}
                        >
                          {copiedFields.orderId ? (
                            <Check size={16} />
                          ) : (
                            <ClipboardCopy size={16} />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {copiedFields.orderId ? 'Copied!' : 'Copy Order ID'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="flex items-center justify-between h-8">
                <span className="font-medium">Payment ID:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {order.paymentId}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild={true}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            copyToClipboard(order.paymentId, 'paymentId')
                          }
                        >
                          {copiedFields.paymentId ? (
                            <Check size={16} />
                          ) : (
                            <ClipboardCopy size={16} />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {copiedFields.paymentId
                            ? 'Copied!'
                            : 'Copy Payment ID'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="flex items-center justify-between h-8">
                <span className="font-medium">Payment Status:</span>
                <div className="flex items-center">
                  {order.payment?.status ? (
                    <StatusBadge status={order.payment.status} type="payment" />
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between h-8">
                <span className="font-medium">Payment:</span>
                <div className="flex items-center gap-2">
                  {isCreditCardPayment ? (
                    isAuthLoading || arePaymentMethodDetailsLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <span className="text-sm text-gray-500">
                        {creditCardPreviewText}
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-gray-500">
                      {onChainPaymentPreviewText}
                    </span>
                  )}
                  {!isCreditCardPayment && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild={true}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              copyToClipboard(
                                order.payment?.nfscPaymentDetails
                                  ?.walletAddress ?? '',
                                'walletAddress',
                              )
                            }
                          >
                            {copiedFields.walletAddress ? (
                              <Check size={16} />
                            ) : (
                              <ClipboardCopy size={16} />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {copiedFields.walletAddress
                              ? 'Copied!'
                              : 'Copy Wallet Address'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between h-8">
                <span className="font-medium">Recipient:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {order.nftWalletAddress
                      ? `(${getChain(order.nftChainId)?.name || `Chain ID ${order.nftChainId}`}) ${getShortAddress(order.nftWalletAddress)}`
                      : '-'}
                  </span>
                  {order.nftWalletAddress && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild={true}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              copyToClipboard(
                                order.nftWalletAddress,
                                'recipientWalletAddress',
                              )
                            }
                          >
                            {copiedFields.recipientWalletAddress ? (
                              <Check size={16} />
                            ) : (
                              <ClipboardCopy size={16} />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {copiedFields.recipientWalletAddress
                              ? 'Copied!'
                              : 'Copy Recipient Address'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>
          </CartCard>
        </div>

        {/* Right Column - Order Items */}
        <div className="h-fit">
          <CartCard title="Order Items">
            <div className="flex flex-col mt-6">
              {order.items.map((item, index) => (
                <div key={item.id}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {item.normalizedDomainName}
                        </span>
                        {item.type === itemTypeSchema.Values.IMPORT && (
                          <Badge className="text-xs bg-blue-600/20 text-blue-400 border-blue-400/50">
                            Import
                          </Badge>
                        )}
                        {item.status ? (
                          <StatusBadge status={item.status} type="order" />
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xl">
                          {formatAmountInUSD(item.amountInUSDCents, true)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.durationInYears} year
                          {item.durationInYears > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  {index < order.items.length - 1 && (
                    <div className="my-6">
                      <Separator />
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-6">
                <Separator />
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="text-xl font-medium">Total</span>
                <span className="text-xl font-bold">
                  {formatAmountInUSD(order.totalAmountInUSDCents, true)}
                </span>
              </div>
            </div>
          </CartCard>
        </div>
      </div>
    </div>
  );
}
