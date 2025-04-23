'use client';

import { StatusBadge } from '@/components/badges/StatusBadge';
import { CartCard } from '@/components/cart-card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { Separator } from '@/components/ui/shadcn/separator';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { formatAmountInUSD } from '@/utils/number';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Check, ClipboardCopy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({});

  const trpc = useTRPC();

  const { data: order, isLoading } = useQuery({
    ...trpc.orders.getOrder.queryOptions({ orderId: id }),
    enabled: !!id,
  });

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
                {/* Payment Method */}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-24" />
                  <div className="flex flex-col items-end gap-1">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
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

              <div className="flex items-center justify-between">
                <span className="font-medium">Payment Method:</span>
                <div className="flex flex-col items-end gap-1">
                  {order.payment?.paymentProvider ? (
                    <>
                      <Badge
                        variant="outline"
                        className="border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100"
                      >
                        {order.payment.paymentProvider
                          .replace('NFSC_', 'NFSC on ')
                          .replace('_', ' ')}
                      </Badge>
                      {order.payment.nfscPaymentDetails?.walletAddress && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {order.payment.nfscPaymentDetails.walletAddress.substring(
                              0,
                              6,
                            )}
                            ...
                            {order.payment.nfscPaymentDetails.walletAddress.substring(
                              order.payment.nfscPaymentDetails.walletAddress
                                .length - 4,
                            )}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild={true}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    copyToClipboard(
                                      order.payment.nfscPaymentDetails
                                        ?.walletAddress || '',
                                      'walletAddress',
                                    )
                                  }
                                >
                                  {copiedFields.walletAddress ? (
                                    <Check size={12} />
                                  ) : (
                                    <ClipboardCopy size={12} />
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
                        </div>
                      )}
                    </>
                  ) : (
                    <span>-</span>
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
                        {item.status ? (
                          <StatusBadge status={item.status} type="order" />
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                      <span className="text-xl">
                        {formatAmountInUSD(item.amountInUSDCents, true)}
                      </span>
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
