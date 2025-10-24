'use client';

import { StatusBadge } from '@/components/status-badge';
import { CartCard } from '@/components/cart-card';
import { Button } from '@/components/ui/shadcn/button';
import { Separator } from '@/components/ui/shadcn/separator';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  itemTypeSchema,
  type PaymentSelect,
  type OrderMintTransactionMetadata,
} from '@namefi-astra/db/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { Unauthorized } from '@/components/unauthorized';
import { useAuth } from '@/hooks/use-auth';
import { getShortAddress } from '@/lib/string';
import { formatAmountInUSD } from '@/lib/number';
import { useTRPC } from '@/lib/trpc';
import {
  getChain,
  getNftExplorerUrl,
  getTokenIdFromDomainName,
} from '@namefi-astra/utils';
import { useQuery } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { format } from 'date-fns';
import {
  Check,
  ClipboardCopy,
  Loader2,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useMemo, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/shadcn/alert-dialog';
import { NetworkLogo } from '@/components/network-logo';
import type { OrderItemSelect } from '@namefi-astra/db';

type MintTransactionsByItemId = Record<string, OrderMintTransactionMetadata>;

type MintedItemSummary = {
  itemId: string;
  label: string;
  tokenId: string;
  chainId: number | null;
};

function getShortId(id: string, start = 6, end = 4): string {
  if (!id) return '-';
  if (id.length <= start + end) return id;
  return `${id.slice(0, start)}…${id.slice(-end)}`;
}

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFields((prev) => ({ ...prev, [field]: true }));

    setTimeout(() => {
      setCopiedFields((prev) => ({ ...prev, [field]: false }));
    }, 2000);
  };
  const trpc = useTRPC();

  const {
    data: orderDetails,
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
  const { order, payments = [], items } = orderDetails ?? {};
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null,
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const orderMintTransactions = order?.metadata?.mintTransactions;

  const mintTransactionsList = useMemo(() => {
    if (!order || !Array.isArray(items) || items.length === 0) {
      return [] as Array<MintedItemSummary>;
    }
    const chainId = order.nftChainId ?? null;
    return items.reduce<Array<MintedItemSummary>>((acc, item) => {
      const mintTransaction =
        item.metadata?.mintTransaction ?? orderMintTransactions?.[item.id];
      if (!mintTransaction) {
        return acc;
      }
      const tokenId = getTokenIdFromDomainName(item.normalizedDomainName);
      if (!tokenId) {
        return acc;
      }
      acc.push({
        itemId: item.id,
        label: item.normalizedDomainName,
        tokenId,
        chainId,
      });
      return acc;
    }, []);
  }, [order, orderMintTransactions, items]);

  function humanizeItemType(t: string | null | undefined): string {
    switch (t) {
      case itemTypeSchema.enum.REGISTER:
        return 'Register';
      case itemTypeSchema.enum.IMPORT:
        return 'Import';
      case itemTypeSchema.enum.RENEW:
        return 'Renew';
      default:
        return t ?? '-';
    }
  }

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
  const singlePayment = payments.length === 1;

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column - Order + Payments */}
        <div className="space-y-4">
          <CartCard title="Order" className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-6 right-6 h-8 w-8"
              onClick={() => setIsTechModalOpen(true)}
              title="View order details"
            >
              <Info size={16} />
            </Button>
            <div className="relative flex flex-col gap-1 mt-2">
              <div className="flex items-center justify-between h-8">
                <span className="font-medium">Status</span>
                <div className="flex items-center">
                  {order.status ? (
                    <StatusBadge status={order.status} type="order" />
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between h-8">
                <span className="font-medium">Placed At</span>
                <span className="text-sm text-gray-500">
                  {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                </span>
              </div>

              <div className="flex items-center justify-between h-8">
                <span className="font-medium">NFT Wallet</span>
                <div className="flex items-center gap-2">
                  {!!order.nftChainId && (
                    <NetworkLogo
                      className="size-4"
                      network={order.nftChainId}
                    />
                  )}
                  <span className="text-sm text-gray-500">
                    {order.nftWalletAddress
                      ? getShortAddress(order.nftWalletAddress)
                      : '-'}
                  </span>
                  {!!order.nftWalletAddress && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild={true}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const walletAddress = order.nftWalletAddress;
                              if (!walletAddress) return;
                              copyToClipboard(
                                walletAddress,
                                'recipientWalletAddress',
                              );
                            }}
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
                              : 'Copy Wallet Address'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              <div className="my-2">
                <Separator className="opacity-50" />
              </div>
              <div className="font-medium mb-2">Payments</div>

              <div className="flex flex-col gap-3">
                {payments.map((payment, index) => (
                  <PaymentSummaryCard
                    key={payment.id}
                    payment={payment}
                    index={index}
                    singlePayment={singlePayment}
                    onClick={() => setSelectedPaymentId(payment.id)}
                  />
                ))}
              </div>
            </div>
          </CartCard>
        </div>

        {/* Right Column - Order Items */}
        <div className="h-fit">
          <CartCard title="Order Items">
            <div className="flex flex-col gap-3 mt-6">
              {items?.map((item) => {
                const mintTransaction =
                  item.metadata?.mintTransaction ??
                  orderMintTransactions?.[item.id];
                const tokenId = getTokenIdFromDomainName(
                  item.normalizedDomainName,
                );
                const chainId = order.nftChainId ?? null;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className="text-left rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium break-all">
                        {item.normalizedDomainName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded border border-blue-400/30 bg-blue-500/10 text-blue-300">
                          {humanizeItemType(item.type)}
                        </span>
                        {item.status ? (
                          <StatusBadge status={item.status} type="order" />
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-medium">
                          {formatAmountInUSD(item.amountInUSDCents, true)}
                        </span>
                      </div>
                      {mintTransaction && tokenId ? (
                        <MintTokenRow
                          label="Minted NFT"
                          chainId={chainId}
                          tokenId={tokenId}
                        />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-6">
              <Separator />
            </div>
            <div className="flex items-center justify-between pt-4">
              <span className="text-xl font-medium">Total</span>
              <span className="text-xl font-bold">
                {formatAmountInUSD(order.amountInUSDCents, true)}
              </span>
            </div>
          </CartCard>
        </div>
      </div>

      {/* Technical Details Modal */}
      <AlertDialog open={isTechModalOpen} onOpenChange={setIsTechModalOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Order details</AlertDialogTitle>
            <AlertDialogDescription>
              Copy any field by clicking the copy icon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {order ? (
            <div className="mt-2">
              <InfoRow
                label="Order ID"
                value={order.id}
                field="orderId-full"
                onCopy={(t) => navigator.clipboard.writeText(t)}
              />
              <InfoRow
                label="Status"
                value={order.status}
                field="orderStatus"
                onCopy={(t) => navigator.clipboard.writeText(t)}
              />
              <InfoRow
                label="Placed At"
                value={format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                field="orderPlacedAt"
                onCopy={(t) => navigator.clipboard.writeText(t)}
              />
              <InfoRow
                label="Total Amount"
                value={formatAmountInUSD(order.amountInUSDCents, true)}
                field="orderAmount"
                onCopy={() =>
                  navigator.clipboard.writeText(String(order.amountInUSDCents))
                }
              />
              <InfoRow
                label="NFT Wallet"
                value={order.nftWalletAddress}
                field="orderWallet"
                onCopy={(t) => navigator.clipboard.writeText(t)}
              />
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-sm text-muted-foreground">Network</span>
                <div className="flex items-center gap-2">
                  {!!order.nftChainId && (
                    <NetworkLogo
                      className="size-4"
                      network={order.nftChainId}
                    />
                  )}
                  <span className="text-sm break-all">
                    {order.nftChainId
                      ? getChain(order.nftChainId)?.name ||
                        `Chain ID ${order.nftChainId}`
                      : '-'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                      order.nftChainId &&
                      navigator.clipboard.writeText(String(order.nftChainId))
                    }
                  >
                    <ClipboardCopy size={14} />
                  </Button>
                </div>
              </div>
              <InfoRow
                label="# Payments"
                value={payments.length}
                field="orderPaymentsCount"
                onCopy={() =>
                  navigator.clipboard.writeText(String(payments.length))
                }
              />
              <InfoRow
                label="# Items"
                value={items?.length ?? 0}
                field="orderItemsCount"
                onCopy={() =>
                  navigator.clipboard.writeText(String(items?.length ?? 0))
                }
              />
              {mintTransactionsList.length > 0 ? (
                <>
                  <div className="my-2">
                    <Separator className="opacity-50" />
                  </div>
                  <div className="font-medium mb-2">Minted NFTs</div>
                  <div className="flex flex-col gap-2">
                    {mintTransactionsList.map(
                      ({ itemId, label, tokenId, chainId }) => (
                        <MintTokenRow
                          key={itemId}
                          label={label}
                          chainId={chainId}
                          tokenId={tokenId}
                          onCopyUrl={(text) =>
                            navigator.clipboard.writeText(text)
                          }
                        />
                      ),
                    )}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        paymentId={selectedPaymentId}
        onOpenChange={setSelectedPaymentId}
      />

      {/* Item Details Modal */}
      <ItemDetailsModal
        itemId={selectedItemId}
        items={items}
        orderMintTransactions={orderMintTransactions}
        chainId={order.nftChainId ?? null}
        onOpenChange={setSelectedItemId}
      />
    </div>
  );
}

function MintTokenRow({
  label,
  chainId,
  tokenId,
  onCopyUrl,
}: {
  label: string;
  chainId?: number | null;
  tokenId: string;
  onCopyUrl?: (url: string) => void;
}) {
  const explorerUrl = getNftExplorerUrl(chainId ?? null, tokenId);

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <MintTokenLink chainId={chainId} tokenId={tokenId} />
        {explorerUrl && onCopyUrl ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onCopyUrl(explorerUrl)}
                >
                  <ClipboardCopy size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy Explorer URL</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>
    </div>
  );
}

function MintTokenLink({
  chainId,
  tokenId,
  className,
}: {
  chainId?: number | null;
  tokenId: string;
  className?: string;
}) {
  const explorerUrl = getNftExplorerUrl(chainId, tokenId);
  const shortTokenId = getShortId(tokenId, 6, 6);
  if (!chainId) {
    return (
      <span
        className={`inline-flex items-center gap-2 text-muted-foreground ${className ?? ''}`}
      >
        <span className="font-mono text-xs">{shortTokenId}</span>
      </span>
    );
  }

  const chainName = getChain(chainId)?.name ?? `Chain ID ${chainId}`;
  const content = (
    <>
      <NetworkLogo className="size-4" network={chainId} />
      <span className="hidden sm:inline text-xs">{chainName}</span>
      <span className="font-mono text-xs">{shortTokenId}</span>
    </>
  );

  if (!explorerUrl) {
    return (
      <span
        className={`inline-flex items-center gap-2 text-muted-foreground ${className ?? ''}`}
      >
        {content}
      </span>
    );
  }

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className={`inline-flex items-center gap-2 text-primary hover:underline ${className ?? ''}`}
    >
      {content}
      <ExternalLink className="size-3" />
    </a>
  );
}

function PaymentSummaryCard({
  payment,
  index,
  singlePayment,
  onClick,
}: {
  payment: PaymentSelect;
  index: number;
  singlePayment: boolean;
  onClick: () => void;
}) {
  const trpc = useTRPC();
  const { isAuthenticated } = useAuth();
  const { data: method = { isOnChainPayment: false as const }, isLoading } =
    useQuery({
      ...trpc.orders.getPaymentMethodDetails.queryOptions({
        paymentId: payment.id,
      }),
      enabled: !!payment.id && isAuthenticated,
    });

  const rightLabel = useMemo(() => {
    if (isLoading) return '…';
    if (!method) return '-';
    if (method.isOnChainPayment) {
      return 'walletAddress' in method && method.walletAddress
        ? getShortAddress(method.walletAddress)
        : '-';
    }
    return 'last4' in method && method.last4
      ? `•••• ${method.last4}`
      : 'Credit Card';
  }, [isLoading, method]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.06] transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {!singlePayment ? `Payment ${index + 1}` : 'Payment'}
        </div>
        <StatusBadge status={payment.status} type="payment" />
      </div>
      <div className="mt-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Method</span>
          <span className="font-medium flex items-center gap-2">
            {payment.paymentProvider === 'STRIPE' ? (
              <>Credit Card</>
            ) : (
              <>
                {!!payment.nfscPaymentDetails?.chainId && (
                  <NetworkLogo
                    className="size-4"
                    network={payment.nfscPaymentDetails.chainId}
                  />
                )}
                NFSC
              </>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-medium">
            {formatAmountInUSD(payment.amountInUSDCents, true)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            {method?.isOnChainPayment ? 'Wallet' : 'Card'}
          </span>
          <span className="font-mono text-xs">{rightLabel}</span>
        </div>
      </div>
    </button>
  );
}

function InfoRow({
  label,
  value,
  field,
  onCopy,
}: {
  label: string;
  value: string | number | null | undefined;
  field: string;
  onCopy: (text: string, field: string) => void;
}) {
  const display = value ?? '-';
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm break-all">{display}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onCopy(String(display), field)}
        >
          <ClipboardCopy size={14} />
        </Button>
      </div>
    </div>
  );
}

function PaymentDetailsModal({
  paymentId,
  onOpenChange,
}: {
  paymentId: string | null;
  onOpenChange: (id: string | null) => void;
}) {
  const { isAuthenticated } = useAuth();
  const trpc = useTRPC();
  const { data: payment, isLoading } = useQuery({
    ...trpc.orders.getPaymentMethodDetails.queryOptions({
      // Reuse existing endpoint to fetch method details
      paymentId: paymentId ?? '',
    }),
    enabled: !!paymentId && isAuthenticated,
  });

  const { data: refunds = [], isLoading: refundsLoading } = useQuery({
    ...trpc.orders.getPaymentRefunds.queryOptions({
      paymentId: paymentId ?? '',
    }),
    enabled: !!paymentId && isAuthenticated,
  });

  return (
    <AlertDialog open={!!paymentId} onOpenChange={() => onOpenChange(null)}>
      <AlertDialogContent className="!max-w-2xl !w-full">
        <AlertDialogHeader>
          <AlertDialogTitle>Payment details</AlertDialogTitle>
          <AlertDialogDescription>
            Copy any field by clicking the copy icon.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="animate-spin" /> Loading…
          </div>
        ) : payment ? (
          <div className="mt-2 !w-full">
            <InfoRow
              label="Payment ID"
              value={paymentId ?? ''}
              field="modalPaymentId"
              onCopy={(t) => navigator.clipboard.writeText(t)}
            />
            <InfoRow
              label="Type"
              value={payment.isOnChainPayment ? 'On-chain' : 'Card'}
              field="modalPaymentType"
              onCopy={(t) => navigator.clipboard.writeText(t)}
            />
            {payment.isOnChainPayment ? (
              <>
                <InfoRow
                  label="Wallet"
                  value={payment.walletAddress}
                  field="walletAddress"
                  onCopy={(t) => navigator.clipboard.writeText(t)}
                />
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-sm text-muted-foreground">Network</span>
                  <div className="flex items-center gap-2">
                    {!!payment.chainId && (
                      <NetworkLogo
                        className="size-4"
                        network={payment.chainId}
                      />
                    )}
                    <span className="text-sm break-all">
                      {getChain(payment.chainId as number)?.name ||
                        `Chain ID ${payment.chainId}`}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        navigator.clipboard.writeText(String(payment.chainId))
                      }
                    >
                      <ClipboardCopy size={14} />
                    </Button>
                  </div>
                </div>
                <InfoRow
                  label="Tx Hash"
                  value={
                    payment.txHash ? getShortId(payment.txHash, 20, 20) : '-'
                  }
                  field="txHash"
                  onCopy={() =>
                    navigator.clipboard.writeText(payment.txHash ?? '')
                  }
                />
              </>
            ) : (
              <>
                <InfoRow
                  label="Brand"
                  value={payment.brand ?? '-'}
                  field="brand"
                  onCopy={(t) => navigator.clipboard.writeText(t)}
                />
                <InfoRow
                  label="Last4"
                  value={payment.last4 ?? '-'}
                  field="last4"
                  onCopy={(t) => navigator.clipboard.writeText(t)}
                />
              </>
            )}

            {/* Refunds section */}
            <div className="my-2">
              <Separator className="opacity-50" />
            </div>
            <div className="font-medium mb-2">Refunds</div>
            {refundsLoading ? (
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="animate-spin" /> Loading refunds…
              </div>
            ) : refunds.length === 0 ? (
              <div className="text-sm text-muted-foreground">No refunds</div>
            ) : (
              <div className="flex flex-col gap-2">
                {refunds.map((r, idx) => (
                  <div
                    key={r.refundId ?? idx}
                    className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Refund {idx + 1}
                      </span>
                      <StatusBadge status={r.status} type="payment" />
                    </div>
                    <div className="mt-2">
                      <InfoRow
                        label="Amount"
                        value={formatAmountInUSD(r.amountInUSDCents, true)}
                        field={`refundAmount-${idx}`}
                        onCopy={() =>
                          navigator.clipboard.writeText(
                            String(r.amountInUSDCents),
                          )
                        }
                      />
                      <div className="flex items-center justify-between gap-3 py-1">
                        <span className="text-sm text-muted-foreground">
                          Network
                        </span>
                        <div className="flex items-center gap-2">
                          {!!r.chainId && (
                            <NetworkLogo
                              className="size-4"
                              network={r.chainId}
                            />
                          )}
                          <span className="text-sm break-all">
                            {r.chainId
                              ? getChain(r.chainId)?.name ||
                                `Chain ID ${r.chainId}`
                              : '-'}
                          </span>
                          {r.chainId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                navigator.clipboard.writeText(String(r.chainId))
                              }
                            >
                              <ClipboardCopy size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                      <InfoRow
                        label="Refund Tx Hash"
                        value={r.txHash ? getShortId(r.txHash, 20, 20) : '-'}
                        field={`refundTxHash-${idx}`}
                        onCopy={() =>
                          navigator.clipboard.writeText(r.txHash ?? '')
                        }
                      />
                      {r.walletAddress && (
                        <InfoRow
                          label="Wallet"
                          value={r.walletAddress}
                          field={`refundWallet-${idx}`}
                          onCopy={(t) => navigator.clipboard.writeText(t)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ItemDetailsModal({
  itemId,
  items,
  orderMintTransactions,
  chainId,
  onOpenChange,
}: {
  itemId: string | null;
  items: OrderItemSelect[] | undefined;
  orderMintTransactions?: MintTransactionsByItemId;
  chainId: number | null;
  onOpenChange: (id: string | null) => void;
}) {
  const item = items?.find((it: OrderItemSelect) => it.id === itemId);
  const mintTransaction = item
    ? (item.metadata?.mintTransaction ?? orderMintTransactions?.[item.id])
    : undefined;
  const tokenId = item
    ? getTokenIdFromDomainName(item.normalizedDomainName)
    : null;
  return (
    <AlertDialog open={!!itemId} onOpenChange={() => onOpenChange(null)}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Item details</AlertDialogTitle>
          <AlertDialogDescription>
            Copy any field by clicking the copy icon.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {item ? (
          <div className="mt-2">
            <InfoRow
              label="Domain"
              value={item.normalizedDomainName}
              field="domain"
              onCopy={(t) => navigator.clipboard.writeText(t)}
            />
            <InfoRow
              label="Type"
              value={item.type}
              field="type"
              onCopy={(t) => navigator.clipboard.writeText(t)}
            />
            <InfoRow
              label="Amount"
              value={formatAmountInUSD(item.amountInUSDCents, true)}
              field="amount"
              onCopy={(t) => navigator.clipboard.writeText(t)}
            />
            <InfoRow
              label="Duration"
              value={`${item.durationInYears} year${
                item.durationInYears > 1 ? 's' : ''
              }`}
              field="duration"
              onCopy={(t) => navigator.clipboard.writeText(t)}
            />
            {/* Registrar intentionally hidden per request */}
            {item.encryptionKeyId && (
              <InfoRow
                label="Encryption Key ID"
                value={item.encryptionKeyId}
                field="encryptionKeyId"
                onCopy={(t) => navigator.clipboard.writeText(t)}
              />
            )}
            {mintTransaction && tokenId ? (
              <MintTokenRow
                label="Minted NFT"
                chainId={chainId}
                tokenId={tokenId}
                onCopyUrl={(text) => navigator.clipboard.writeText(text)}
              />
            ) : null}
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
