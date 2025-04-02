'use client';

import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Separator } from '@/components/ui/shadcn/separator';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { formatAmountInUSD } from '@/utils/number';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { Check, ClipboardCopy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';

export default function OrderDetailsPage({
  params,
}: { params: Promise<{ id: string }> }) {
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
    setCopiedFields({ ...copiedFields, [field]: true });

    setTimeout(() => {
      setCopiedFields((prev) => ({ ...prev, [field]: false }));
    }, 2000);
  };

  // Order status badge color mapping
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'CREATED':
        return (
          <Badge
            variant="secondary"
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Created
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            Processing
          </Badge>
        );
      case 'SUCCEEDED':
        return (
          <Badge className="bg-green-600 text-white hover:bg-green-700">
            Succeeded
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge
            variant="destructive"
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Failed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge
            variant="outline"
            className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
          >
            Cancelled
          </Badge>
        );
      case 'PARTIALLY_COMPLETED':
        return (
          <Badge
            variant="outline"
            className="border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
          >
            Partially Completed
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100"
          >
            {status || 'Unknown'}
          </Badge>
        );
    }
  };

  // Payment status badge color mapping
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'CREATED':
        return (
          <Badge
            variant="secondary"
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Created
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            Processing
          </Badge>
        );
      case 'SUCCEEDED':
        return (
          <Badge className="bg-green-600 text-white hover:bg-green-700">
            Succeeded
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge className="bg-green-600 text-white hover:bg-green-700">
            Completed
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge
            variant="destructive"
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Failed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge
            variant="outline"
            className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
          >
            Cancelled
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge
            variant="outline"
            className="border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
          >
            Pending
          </Badge>
        );
      case 'REFUND_REQUESTED':
        return (
          <Badge
            variant="outline"
            className="border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100"
          >
            Refund Requested
          </Badge>
        );
      case 'REQUIRES_CAPTURE':
        return (
          <Badge
            variant="outline"
            className="border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100"
          >
            Requires Capture
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100"
          >
            {status || 'Unknown'}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <p className="mt-4">
          The order you are looking for could not be found. Please check the
          order ID and try again.
        </p>
        <Button className="mt-4" onClick={() => router.push('/orders')}>
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <Button variant="outline" onClick={() => router.push('/orders')}>
          Back to Orders
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Order Information</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal text-gray-500">
                  Status:
                </span>
                {order.status ? (
                  getOrderStatusBadge(order.status)
                ) : (
                  <Badge
                    variant="outline"
                    className="border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100"
                  >
                    Unknown
                  </Badge>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Order #{order.id.substring(0, 8)} • Placed on{' '}
              {new Date(order.createdAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
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

              <div className="flex items-center justify-between">
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

              <div className="flex items-center justify-between">
                <span className="font-medium">Payment Status:</span>
                {order.payment?.status ? (
                  getPaymentStatusBadge(order.payment.status)
                ) : (
                  <span>-</span>
                )}
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

              <div className="flex items-center justify-between">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold">
                  {formatAmountInUSD(order.totalAmountInUSDCents, true)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>
              Details of domains purchased in this order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain Name</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.normalizedDomainName}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmountInUSD(item.amountInUSDCents, true)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator className="my-4" />

            <div className="flex justify-between items-center font-bold">
              <span>Total</span>
              <span>
                {formatAmountInUSD(order.totalAmountInUSDCents, true)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
