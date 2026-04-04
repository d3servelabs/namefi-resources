'use client';

import { StatusBadge } from '@/components/status-badge';
import { CartCard } from '@/components/cart-card';
import { Button } from '@/components/ui/shadcn/button';
import { Separator } from '@/components/ui/shadcn/separator';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { itemTypeSchema } from '@namefi-astra/common/shared-schemas';
import { toUnicodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type {
  PaymentSelect,
  OrderMintTransactionMetadata,
  OrderItemMetadata,
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
import { getChain } from '@namefi-astra/utils/chains';
import {
  getNftExplorerUrl,
  getTokenIdFromDomainName,
} from '@namefi-astra/utils/nft-hash';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { format } from 'date-fns';
import {
  Check,
  ClipboardCopy,
  Loader2,
  Info,
  ExternalLink,
  InfoIcon,
  XCircleIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogTrigger,
} from '@/components/ui/shadcn/alert-dialog';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/shadcn/alert';
import { NetworkLogo } from '@/components/network-logo';
import type { OrderItemSelect } from '@namefi-astra/db';
import { PageShell } from '@/components/page-shell';
import { useLinkedWalletAddresses } from '@/hooks/use-user-wallet-addresses';
import { formatDuration, intervalToDuration, addSeconds } from 'date-fns';
import { cn } from '@/lib/cn';
import { PasswordInput } from '@/components/password-input';
import { Label } from '@/components/ui/shadcn/label';
import { toast } from 'sonner';

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

function safeToUnicode(domain: string): string {
  try {
    return toUnicodeDomainName(domain);
  } catch {
    return domain;
  }
}

export function OrderDetailsContent({ id }: { id: string }) {
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
  const { linkedWalletAddresses, linkedWalletsReady } =
    useLinkedWalletAddresses();

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
  const recipientWalletAddress = order?.nftWalletAddress ?? null;
  const isRecipientLinked = useMemo(() => {
    if (!recipientWalletAddress) {
      return true;
    }
    if (!linkedWalletsReady) {
      return true;
    }
    const normalizedRecipient = recipientWalletAddress.toLowerCase();
    return linkedWalletAddresses.some(
      (address) => address.toLowerCase() === normalizedRecipient,
    );
  }, [linkedWalletAddresses, linkedWalletsReady, recipientWalletAddress]);
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null,
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const orderMintTransactions = order?.metadata?.mintTransactions;

  const requiredActionItems = useMemo(() => {
    if (!items || items.length === 0) return [] as OrderItemSelect[];
    return items.filter((item) => item.metadata?.requiredAction);
  }, [items]);

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
      <PageShell>
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
      </PageShell>
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
      <PageShell>
        <CartCard
          title="Order not found"
          description="The order you are looking for could not be found. Please check the order ID and try again."
          footer={
            <Button onClick={() => router.push('/orders')}>
              Back to Orders
            </Button>
          }
        />
      </PageShell>
    );
  }
  const singlePayment = payments.length === 1;

  return (
    <PageShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {requiredActionItems.length > 0 && items ? (
          <Alert
            variant="default"
            className="w-full border border-amber-500/30 bg-amber-800/20 col-span-full"
          >
            <AlertTitle className="font-semibold"> Action required</AlertTitle>
            <AlertDescription>
              <div className="w-full flex flex-row flex-wrap justify-between items-start ">
                <div>
                  {requiredActionItems.length === items?.length ? (
                    requiredActionItems.length === 1 ? (
                      <p>
                        <span>
                          The domain{' '}
                          <span className="font-semibold">
                            {safeToUnicode(
                              requiredActionItems[0].normalizedDomainName,
                            )}
                          </span>{' '}
                          requires further action from your side.
                        </span>
                        <br />
                        <span className="mt-2">
                          {requiredActionItems[0].metadata?.requiredAction
                            ? getRequiredActionText(
                                requiredActionItems[0].metadata.requiredAction,
                              )
                            : ''}
                        </span>
                      </p>
                    ) : (
                      'All items in this order require further action from your side.'
                    )
                  ) : (
                    `${requiredActionItems.length} of ${items?.length} items in this order require further action from your side.`
                  )}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger
                    onClick={
                      requiredActionItems.length === items?.length &&
                      requiredActionItems.length === 1
                        ? (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setSelectedItemId(requiredActionItems[0].id);
                          }
                        : undefined
                    }
                  >
                    <InfoIcon className="h-4 w-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Action Required</AlertDialogTitle>
                      <AlertDialogDescription>
                        Some items in this order require action. Please review
                        the details and take necessary actions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                      <div className="flex flex-col gap-2 py-3">
                        {requiredActionItems?.map((item) => {
                          return (
                            <button
                              type="button"
                              key={item.id}
                              onClick={() => setSelectedItemId(item.id)}
                              className="w-full text-left rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.06] transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-base font-medium break-all">
                                  {safeToUnicode(item.normalizedDomainName)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-0.5 rounded border border-blue-400/30 bg-blue-500/10 text-blue-300">
                                    {humanizeItemType(item.type)}
                                  </span>
                                  <StatusBadge
                                    status={'REQUIRES_ACTION'}
                                    type="order"
                                  />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-row justify-end w-full">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}
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
                  {recipientWalletAddress && !isRecipientLinked && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600" />
                          }
                        >
                          <Info className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This wallet isn't linked to your account.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {!!order.nftChainId && (
                    <NetworkLogo
                      className="size-4"
                      network={order.nftChainId}
                    />
                  )}
                  <span className="text-sm text-gray-500">
                    {recipientWalletAddress
                      ? getShortAddress(recipientWalletAddress)
                      : '-'}
                  </span>

                  {!!recipientWalletAddress && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                if (!recipientWalletAddress) return;
                                copyToClipboard(
                                  recipientWalletAddress,
                                  'recipientWalletAddress',
                                );
                              }}
                            />
                          }
                        >
                          {copiedFields.recipientWalletAddress ? (
                            <Check size={16} />
                          ) : (
                            <ClipboardCopy size={16} />
                          )}
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
                const requiredAction = item.metadata?.requiredAction;
                const failureDetailsText =
                  item.status === 'FAILED'
                    ? getFailureDetailsText(item.metadata?.failureDetails)
                    : null;
                const chainId = order.nftChainId ?? null;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className="text-left rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-base font-medium break-all">
                          {safeToUnicode(item.normalizedDomainName)}
                        </span>
                        {safeToUnicode(item.normalizedDomainName) !==
                          item.normalizedDomainName && (
                          <span className="block text-xs text-muted-foreground break-all">
                            {item.normalizedDomainName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded border border-blue-400/30 bg-blue-500/10 text-blue-300">
                          {humanizeItemType(item.type)}
                        </span>
                        {requiredAction ? (
                          <StatusBadge
                            status={'REQUIRES_ACTION'}
                            type="order"
                          />
                        ) : item.status ? (
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
                      {failureDetailsText ? (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {failureDetailsText}
                        </div>
                      ) : null}
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
        key={selectedItemId}
        itemId={selectedItemId}
        items={items}
        orderMintTransactions={orderMintTransactions}
        chainId={order.nftChainId ?? null}
        onOpenChange={setSelectedItemId}
        orderId={order.id}
      />
    </PageShell>
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
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onCopyUrl(explorerUrl)}
                  />
                }
              >
                <ClipboardCopy size={14} />
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

  const isX402Payment = payment.paymentProvider === 'X402';
  const rightLabel = useMemo(() => {
    if (isLoading) return '…';
    if (!method) return '-';
    // Handle x402 payments
    if ('isX402Payment' in method && method.isX402Payment) {
      return method.buyerWalletAddress
        ? getShortAddress(method.buyerWalletAddress)
        : '-';
    }
    if (method.isOnChainPayment) {
      return 'walletAddress' in method && method.walletAddress
        ? getShortAddress(method.walletAddress)
        : '-';
    }
    return 'last4' in method && method.last4
      ? `•••• ${method.last4}`
      : 'Credit Card';
  }, [isLoading, method]);
  const paymentMethodDisplay = useMemo(() => {
    if (payment.paymentProvider === 'STRIPE') {
      return <>Credit Card</>;
    }
    if (isX402Payment && payment.x402PaymentDetails) {
      const networkName = getNetworkName(payment.x402PaymentDetails.network);
      return (
        <>
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
            {networkName}
          </span>
          x402 (USDC)
        </>
      );
    }
    // NFSC payment
    return (
      <>
        {!!payment.nfscPaymentDetails?.chainId && (
          <NetworkLogo
            className="size-4"
            network={payment.nfscPaymentDetails.chainId}
          />
        )}
        NFSC
      </>
    );
  }, [payment, isX402Payment]);
  const walletLabel = useMemo(() => {
    if (payment.paymentProvider === 'STRIPE') {
      return 'Card';
    }
    return 'Wallet';
  }, [payment.paymentProvider]);

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
            {paymentMethodDisplay}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-medium">
            {formatAmountInUSD(payment.amountInUSDCents, true)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{walletLabel}</span>
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
  labelClassName,
}: {
  label: string;
  value: string | number | null | undefined;
  field: string;
  onCopy: (text: string, field: string) => void;
  labelClassName?: string;
}) {
  const display = value ?? '-';
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className={cn('text-sm text-muted-foreground', labelClassName)}>
        {label}
      </span>
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
              value={
                'isX402Payment' in payment && payment.isX402Payment
                  ? 'x402 (USDC)'
                  : payment.isOnChainPayment
                    ? 'On-chain (NFSC)'
                    : 'Card'
              }
              field="modalPaymentType"
              onCopy={(t) => navigator.clipboard.writeText(t)}
            />
            {'isX402Payment' in payment && payment.isX402Payment ? (
              <>
                <InfoRow
                  label="Buyer Wallet"
                  value={payment.buyerWalletAddress}
                  field="buyerWalletAddress"
                  onCopy={(t) => navigator.clipboard.writeText(t)}
                />
                {payment.receiverWalletAddress && (
                  <InfoRow
                    label="Receiver Wallet"
                    value={payment.receiverWalletAddress}
                    field="receiverWalletAddress"
                    onCopy={(t) => navigator.clipboard.writeText(t)}
                  />
                )}
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-sm text-muted-foreground">Network</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm break-all">
                      {getNetworkName(payment.network)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        navigator.clipboard.writeText(payment.network)
                      }
                    >
                      <ClipboardCopy size={14} />
                    </Button>
                  </div>
                </div>
                {payment.settlementTxHash && (
                  <div className="flex items-center justify-between gap-3 py-1">
                    <span className="text-sm text-muted-foreground">
                      Settlement Tx
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm break-all font-mono">
                        {getShortId(payment.settlementTxHash, 20, 20)}
                      </span>
                      {(() => {
                        const explorerUrl = getBlockExplorerUrl(
                          payment.network,
                          payment.settlementTxHash,
                        );
                        return explorerUrl ? (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <ExternalLink size={14} />
                          </a>
                        ) : null;
                      })()}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            payment.settlementTxHash ?? '',
                          )
                        }
                      >
                        <ClipboardCopy size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : payment.isOnChainPayment &&
              'walletAddress' in payment &&
              'chainId' in payment ? (
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
                {'txHash' in payment && (
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
                )}
              </>
            ) : 'brand' in payment ? (
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
            ) : null}

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
  orderId,
}: {
  itemId: string | null;
  items: OrderItemSelect[] | undefined;
  orderMintTransactions?: MintTransactionsByItemId;
  chainId: number | null;
  onOpenChange: (id: string | null) => void;
  orderId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [authCode, setAuthCode] = useState('');
  const item = items?.find((it: OrderItemSelect) => it.id === itemId);
  const mintTransaction = item
    ? (item.metadata?.mintTransaction ?? orderMintTransactions?.[item.id])
    : undefined;
  const tokenId = item
    ? getTokenIdFromDomainName(item.normalizedDomainName)
    : null;
  const requiredAction = item?.metadata?.requiredAction;
  const isAuthCodeUpdateRequired =
    item?.type === itemTypeSchema.enum.IMPORT &&
    requiredAction === 'EPP_AUTH_CODE_UPDATE_REQUIRED';
  const isUnlockRequired = requiredAction === 'EPP_UNLOCK_REQUIRED';
  const hasRequiredAction = Boolean(requiredAction);

  const updateAuthCodeMutation = useMutation(
    trpc.orders.updateImportAuthCode.mutationOptions({
      onSuccess: async () => {
        setAuthCode('');
        toast.success('Auth code updated. We are resuming your import.');
        await queryClient.invalidateQueries({
          queryKey: trpc.orders.getOrder.queryKey({ orderId }),
        });
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update auth code');
      },
    }),
  );

  const confirmUnlockMutation = useMutation(
    trpc.orders.confirmDomainUnlocked.mutationOptions({
      onSuccess: async () => {
        toast.success('Unlock confirmed. We are resuming the request.');
        await queryClient.invalidateQueries({
          queryKey: trpc.orders.getOrder.queryKey({ orderId }),
        });
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to confirm unlock');
      },
    }),
  );

  const cancelRequiredActionMutation = useMutation(
    trpc.orders.cancelRequiredActionOrderItem.mutationOptions({
      onSuccess: async () => {
        toast.success('Item cancelled. We are stopping the request.');
        await queryClient.invalidateQueries({
          queryKey: trpc.orders.getOrder.queryKey({ orderId }),
        });
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to cancel item');
      },
    }),
  );

  const isActionPending =
    updateAuthCodeMutation.isPending ||
    cancelRequiredActionMutation.isPending ||
    confirmUnlockMutation.isPending;

  const handleAuthCodeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!item) return;
    const trimmedAuthCode = authCode.trim();
    if (!trimmedAuthCode) {
      toast.error('Enter the auth code to continue.');
      return;
    }
    updateAuthCodeMutation.mutate({
      orderId,
      orderItemId: item.id,
      eppAuthorizationCode: trimmedAuthCode,
    });
  };

  const handleCancelRequiredAction = () => {
    if (!item) return;
    cancelRequiredActionMutation.mutate({
      orderId,
      orderItemId: item.id,
    });
  };

  const handleConfirmUnlock = () => {
    if (!item) return;
    confirmUnlockMutation.mutate({
      orderId,
      orderItemId: item.id,
    });
  };

  return (
    <AlertDialog open={!!itemId} onOpenChange={() => onOpenChange(null)}>
      <AlertDialogContent className="!max-w-xl">
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
            {item.metadata?.requiredAction && (
              <InfoRow
                label="Required Action"
                labelClassName="font-semibold text-amber-700"
                value={getRequiredActionText(item.metadata?.requiredAction)}
                field="requiredAction"
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

            {isUnlockRequired ? (
              <div className="mt-4 space-y-3">
                <Alert
                  variant="default"
                  className="border border-amber-500/30 bg-amber-800/20"
                >
                  <AlertTitle className="font-semibold">
                    Domain unlock required
                  </AlertTitle>
                  <AlertDescription>
                    Unlock the domain at your registrar, then confirm here so we
                    can continue.
                  </AlertDescription>
                </Alert>
                <Button
                  type="button"
                  onClick={handleConfirmUnlock}
                  disabled={isActionPending}
                >
                  {confirmUnlockMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming…
                    </>
                  ) : (
                    'I unlocked the domain'
                  )}
                </Button>
              </div>
            ) : null}
            {isAuthCodeUpdateRequired ? (
              <div className="mt-4 space-y-3">
                <Alert
                  variant="default"
                  className="border border-amber-500/30 bg-amber-800/20"
                >
                  <AlertTitle className="font-semibold">
                    Auth code required
                  </AlertTitle>
                  <AlertDescription>
                    Enter the new auth code from your registrar to continue the
                    import.
                  </AlertDescription>
                </Alert>
                <form className="space-y-3" onSubmit={handleAuthCodeSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="order-auth-code">Auth code</Label>
                    <PasswordInput
                      id="order-auth-code"
                      value={authCode}
                      onChange={(event) => setAuthCode(event.target.value)}
                      placeholder="Enter auth code"
                      autoComplete="off"
                      disabled={isActionPending}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isActionPending || !authCode.trim()}
                  >
                    {updateAuthCodeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating…
                      </>
                    ) : (
                      'Update auth code'
                    )}
                  </Button>
                </form>
              </div>
            ) : null}
            {hasRequiredAction ? (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 space-y-2">
                <div className="text-sm font-semibold">Cancel this item</div>
                <p className="text-sm text-muted-foreground">
                  If you no longer want to proceed, canceling will stop
                  processing this item.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleCancelRequiredAction}
                  disabled={isActionPending}
                >
                  {cancelRequiredActionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Canceling…
                    </>
                  ) : (
                    'Cancel item'
                  )}
                </Button>
              </div>
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
function getRequiredActionText(requiredAction?: string | null) {
  switch (requiredAction) {
    case 'EPP_AUTH_CODE_UPDATE_REQUIRED':
      return 'Provide a new auth code to continue the import.';
    case 'EPP_UNLOCK_REQUIRED':
      return 'Confirm the domain is unlocked at your current registrar.';
    default:
      return null;
  }
}

function formatFailureDuration(timeoutMs?: number | null) {
  if (!timeoutMs || timeoutMs <= 0) return null;
  const now = new Date();
  const interval = { start: now, end: addSeconds(now, timeoutMs / 1000) };
  const duration = intervalToDuration(interval);
  return formatDuration(duration, {
    format: ['days', 'hours', 'minutes'],
    zero: true,
  });
}

function getFailureDetailsText(
  failureDetails?: OrderItemMetadata['failureDetails'] | null,
) {
  if (!failureDetails) return null;

  const { requiredAction, resolution, actor, timeoutMs } = failureDetails;
  const isAuthCodeRequired = requiredAction === 'EPP_AUTH_CODE_UPDATE_REQUIRED';
  const duration = formatFailureDuration(timeoutMs);

  if (resolution === 'TIMEOUT') {
    if (duration) {
      return isAuthCodeRequired
        ? `Auth code was not updated for ${duration}, so the order item was canceled.`
        : `Domain stayed locked for ${duration}, so the order item was canceled.`;
    }
    return isAuthCodeRequired
      ? 'Auth code update timed out, so the order item was canceled.'
      : 'Domain stayed locked too long, so the order item was canceled.';
  }

  if (actor === 'ADMIN') {
    return isAuthCodeRequired
      ? 'Auth code update required and support canceled the request.'
      : 'Domain was locked and support canceled the request.';
  }

  return isAuthCodeRequired
    ? 'Auth code update required and you canceled the request.'
    : 'Domain was locked and you canceled the request.';
}

/**
 * Get block explorer URL for a given network and transaction hash
 */
function getBlockExplorerUrl(network: string, txHash: string): string | null {
  if (network === 'eip155:8453') {
    return `https://basescan.org/tx/${txHash}`;
  }
  if (network === 'eip155:84532') {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  }
  return null;
}

/**
 * Get network display name from CAIP-2 format
 */
function getNetworkName(network: string): string {
  if (network === 'eip155:8453') {
    return 'Base';
  }
  if (network === 'eip155:84532') {
    return 'Base Sepolia';
  }
  return network;
}
