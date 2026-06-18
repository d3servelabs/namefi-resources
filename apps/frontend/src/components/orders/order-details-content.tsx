'use client';

import { StatusBadge } from '@/components/status-badge';
import { CartCard } from '@/components/cart-card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Separator } from '@namefi-astra/ui/components/shadcn/separator';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { itemTypeSchema } from '@namefi-astra/common/shared-schemas';
import { toUnicodeDomainName } from '@namefi-astra/registrars/data/validations';
import type {
  OrderMintTransactionMetadata,
  OrderItemMetadata,
  OrderItemSelect,
  PaymentSelect,
} from '@namefi-astra/common/contract/entity-schemas';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type FormEvent, useMemo, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogTrigger,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@namefi-astra/ui/components/shadcn/alert';
import { NetworkLogo } from '@/components/network-logo';
import { useLinkedWalletAddresses } from '@/hooks/use-user-wallet-addresses';
import { formatDuration, intervalToDuration, addSeconds } from 'date-fns';
import { cn } from '@namefi-astra/ui/lib/cn';
import { PasswordInput } from '@/components/password-input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { toast } from 'sonner';

type OrdersTranslator = ReturnType<typeof useTranslations<'orders'>>;

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
  const t = useTranslations('orders');
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
  // Actual in-flight NFT ops per item domain — used to gate the optimistic
  // "Minting…" / "Updating expiration…" rows so legacy items (whose tx simply
  // hasn't been backfilled) don't show a perpetual pending state.
  const pendingNftStatesByDomain = orderDetails?.pendingNftStatesByDomain;
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
  const orderExtendTransactions = order?.metadata?.extendTransactions;

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

  function humanizeItemType(type: string | null | undefined): string {
    switch (type) {
      case itemTypeSchema.enum.REGISTER:
        return t('itemType.register');
      case itemTypeSchema.enum.IMPORT:
        return t('itemType.import');
      case itemTypeSchema.enum.RENEW:
        return t('itemType.renew');
      default:
        return type ?? '-';
    }
  }

  if (isLoading) {
    return (
      <>
        <h1 className="text-4xl font-bold my-2 font-mono">
          {t('details.heading')}
        </h1>
        <CartCard className="mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between h-8">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="flex items-center justify-between h-8">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex items-center justify-between h-8">
              <Skeleton className="h-6 w-24" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </div>
        </CartCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Order Items Skeleton */}
          <CartCard title={t('details.orderItems')}>
            <div className="flex flex-col gap-3 mt-2">
              {[1, 2].map((_, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-48" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Separator />
            </div>
            <div className="flex items-center justify-between pt-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CartCard>

          {/* Payments Skeleton */}
          <CartCard title={t('details.payments')}>
            <div className="flex flex-col gap-3 mt-2">
              {[1].map((_, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="mt-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CartCard>
        </div>
      </>
    );
  }
  if (
    error &&
    error instanceof TRPCClientError &&
    error.data?.code === 'UNAUTHORIZED'
  ) {
    return <Unauthorized description={t('details.unauthorized')} />;
  }
  if (!order) {
    return (
      <CartCard
        title={t('notFound.title')}
        description={t('notFound.description')}
        footer={
          <Button onClick={() => router.push('/orders')}>
            {t('notFound.backToOrders')}
          </Button>
        }
      />
    );
  }
  const singlePayment = payments.length === 1;

  return (
    <>
      {requiredActionItems.length > 0 && items ? (
        <Alert
          variant="default"
          className="w-full border border-amber-500/30 bg-amber-800/20 mb-4"
        >
          <AlertTitle className="font-semibold">
            {' '}
            {t('details.actionRequiredTitle')}
          </AlertTitle>
          <AlertDescription>
            <div className="w-full flex flex-row flex-wrap justify-between items-start ">
              <div>
                {requiredActionItems.length === items?.length ? (
                  requiredActionItems.length === 1 ? (
                    <p>
                      <span>
                        {t.rich('details.actionRequiredSingle', {
                          domain: safeToUnicode(
                            requiredActionItems[0].normalizedDomainName,
                          ),
                          highlight: (chunks) => (
                            <span className="font-semibold">{chunks}</span>
                          ),
                        })}
                      </span>
                      <br />
                      <span className="mt-2">
                        {requiredActionItems[0].metadata?.requiredAction
                          ? getRequiredActionText(
                              t,
                              requiredActionItems[0].metadata.requiredAction,
                            )
                          : ''}
                      </span>
                    </p>
                  ) : (
                    t('details.actionRequiredAll')
                  )
                ) : (
                  t('details.actionRequiredSome', {
                    count: requiredActionItems.length,
                    total: items?.length ?? 0,
                  })
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
                    <AlertDialogTitle>
                      {t('details.actionRequiredDialogTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('details.actionRequiredDialogDescription')}
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
                      <AlertDialogCancel>
                        {t('details.cancel')}
                      </AlertDialogCancel>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Top - Order Details header */}
      <h1 className="text-4xl font-bold my-2 font-mono">
        {t('details.heading')}
      </h1>
      <CartCard className="relative mb-8" gradient="minimal">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-6 z-10 h-8 w-8"
          onClick={() => setIsTechModalOpen(true)}
          title={t('details.viewOrderDetails')}
          aria-label={t('details.viewTechnicalDetails')}
        >
          <Info size={16} />
        </Button>
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <div className="flex items-center justify-between h-8">
            <span className="font-medium">{t('details.status')}</span>
            <div className="flex items-center">
              {order.status ? (
                <StatusBadge status={order.status} type="order" />
              ) : (
                <span>-</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between h-8">
            <span className="font-medium">{t('details.placedAt')}</span>
            <span className="text-sm text-gray-500">
              {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
            </span>
          </div>

          <div className="flex items-center justify-between h-8">
            <span className="font-medium">{t('details.nftWallet')}</span>

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
                      <p>{t('details.walletNotLinked')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {!!order.nftChainId && (
                <NetworkLogo className="size-4" network={order.nftChainId} />
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
                          aria-label={
                            copiedFields.recipientWalletAddress
                              ? t('details.walletAddressCopied')
                              : t('details.copyWalletAddress')
                          }
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
                          ? t('details.copied')
                          : t('details.copyWalletAddressTooltip')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </CartCard>

      {/* Two-column - Order Items left, Payments right */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
        <CartCard
          title={t('details.orderItems')}
          className="h-fit lg:col-span-2"
          gradient="default"
        >
          <div className="flex flex-col gap-3 mt-2">
            {items?.map((item) => {
              const mintTransaction =
                item.metadata?.mintTransaction ??
                orderMintTransactions?.[item.id];
              const extendTransaction =
                item.metadata?.extendTransaction ??
                orderExtendTransactions?.[item.id];
              const tokenId = getTokenIdFromDomainName(
                item.normalizedDomainName,
              );
              const itemPendingNftStates =
                pendingNftStatesByDomain?.[item.normalizedDomainName] ?? [];
              const hasInFlightMint = itemPendingNftStates.includes('MINTING');
              const hasInFlightExtend = itemPendingNftStates.includes(
                'CHANGING_EXPIRATION',
              );
              const requiredAction = item.metadata?.requiredAction;
              const failureDetailsText =
                item.status === 'FAILED'
                  ? getFailureDetailsText(t, item.metadata?.failureDetails)
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
                        <StatusBadge status={'REQUIRES_ACTION'} type="order" />
                      ) : item.status ? (
                        <StatusBadge status={item.status} type="order" />
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t('details.amount')}
                      </span>
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
                        label={t('details.mintedNft')}
                        chainId={chainId}
                        tokenId={tokenId}
                      />
                    ) : tokenId &&
                      (item.type === 'REGISTER' || item.type === 'IMPORT') &&
                      hasInFlightMint ? (
                      // Deferred mint actually in flight: registrar step done, the
                      // on-chain mint hasn't landed yet. (Legacy items without an
                      // in-flight tx show nothing until their tx is backfilled.)
                      <div className="flex items-center justify-between gap-3 py-1">
                        <span className="text-sm text-muted-foreground">
                          {t('details.nft')}
                        </span>
                        <span className="inline-flex items-center gap-2 text-xs text-amber-300">
                          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                          {t('details.minting')}
                        </span>
                      </div>
                    ) : null}
                    {item.type === 'RENEW' && extendTransaction && tokenId ? (
                      <MintTokenRow
                        label={t('details.renewalTx')}
                        chainId={chainId}
                        tokenId={tokenId}
                      />
                    ) : item.type === 'RENEW' &&
                      tokenId &&
                      hasInFlightExtend ? (
                      // Deferred expiration update actually in flight. (Legacy
                      // renew items without an in-flight tx show nothing until
                      // their tx is backfilled.)
                      <div className="flex items-center justify-between gap-3 py-1">
                        <span className="text-sm text-muted-foreground">
                          {t('details.nft')}
                        </span>
                        <span className="inline-flex items-center gap-2 text-xs text-amber-300">
                          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                          {t('details.updatingExpiration')}
                        </span>
                      </div>
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
            <span className="text-xl font-medium">{t('details.total')}</span>
            <span className="text-xl font-bold">
              {formatAmountInUSD(order.amountInUSDCents, true)}
            </span>
          </div>
        </CartCard>

        <CartCard
          title={t('details.payments')}
          className="h-fit"
          gradient="minimal-reverse"
        >
          <div className="flex flex-col gap-3 mt-2">
            {payments.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {t('details.noPayments')}
              </div>
            ) : (
              payments.map((payment, index) => (
                <PaymentSummaryCard
                  key={payment.id}
                  payment={payment}
                  index={index}
                  singlePayment={singlePayment}
                  onClick={() => setSelectedPaymentId(payment.id)}
                />
              ))
            )}
          </div>
        </CartCard>
      </div>

      {/* Technical Details Modal */}
      <AlertDialog open={isTechModalOpen} onOpenChange={setIsTechModalOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('details.techDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('details.techDialogDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {order ? (
            <div className="mt-2">
              <InfoRow
                label={t('details.orderId')}
                value={order.id}
                field="orderId-full"
                onCopy={(text) => navigator.clipboard.writeText(text)}
              />
              <InfoRow
                label={t('details.status')}
                value={order.status}
                field="orderStatus"
                onCopy={(text) => navigator.clipboard.writeText(text)}
              />
              <InfoRow
                label={t('details.placedAt')}
                value={format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                field="orderPlacedAt"
                onCopy={(text) => navigator.clipboard.writeText(text)}
              />
              <InfoRow
                label={t('details.totalAmount')}
                value={formatAmountInUSD(order.amountInUSDCents, true)}
                field="orderAmount"
                onCopy={() =>
                  navigator.clipboard.writeText(String(order.amountInUSDCents))
                }
              />
              <InfoRow
                label={t('details.nftWallet')}
                value={order.nftWalletAddress}
                field="orderWallet"
                onCopy={(text) => navigator.clipboard.writeText(text)}
              />
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-sm text-muted-foreground">
                  {t('details.network')}
                </span>
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
                        t('details.chainIdLabel', { chainId: order.nftChainId })
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
                label={t('details.paymentsCount')}
                value={payments.length}
                field="orderPaymentsCount"
                onCopy={() =>
                  navigator.clipboard.writeText(String(payments.length))
                }
              />
              <InfoRow
                label={t('details.itemsCount')}
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
                  <div className="font-medium mb-2">
                    {t('details.mintedNfts')}
                  </div>
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
            <AlertDialogCancel>{t('details.close')}</AlertDialogCancel>
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
    </>
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
  const t = useTranslations('orders');
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
              <TooltipContent>{t('details.copyExplorerUrl')}</TooltipContent>
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
  const t = useTranslations('orders');
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

  const chainName =
    getChain(chainId)?.name ?? t('details.chainIdLabel', { chainId });
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
  const t = useTranslations('orders');
  const trpc = useTRPC();
  const { isAuthenticated } = useAuth();
  const { data: method = { isOnChainPayment: false as const }, isLoading } =
    useQuery({
      ...trpc.orders.getPaymentMethodDetails.queryOptions({
        paymentId: payment.id,
      }),
      enabled: !!payment.id && isAuthenticated,
    });

  const { data: refunds = [] } = useQuery({
    ...trpc.orders.getPaymentRefunds.queryOptions({
      paymentId: payment.id,
    }),
    enabled: !!payment.id && isAuthenticated,
  });

  const { refundedAmountCents, pendingRefundCents } = useMemo(() => {
    let succeeded = 0;
    let pending = 0;
    for (const refund of refunds) {
      if (refund.status === 'SUCCEEDED') {
        succeeded += refund.amountInUSDCents;
      } else if (
        refund.status === 'CREATED' ||
        refund.status === 'PROCESSING' ||
        refund.status === 'REQUIRES_ACTION'
      ) {
        pending += refund.amountInUSDCents;
      }
    }
    return { refundedAmountCents: succeeded, pendingRefundCents: pending };
  }, [refunds]);

  const totalAmountCents = payment.amountInUSDCents - refundedAmountCents;
  const hasRefund = refundedAmountCents > 0 || pendingRefundCents > 0;

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
      : t('details.creditCard');
  }, [isLoading, method, t]);
  const paymentMethodDisplay = useMemo(() => {
    if (payment.paymentProvider === 'STRIPE') {
      return <>{t('details.creditCard')}</>;
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
  }, [payment, isX402Payment, t]);
  const walletLabel = useMemo(() => {
    if (payment.paymentProvider === 'STRIPE') {
      return t('details.card');
    }
    return t('details.wallet');
  }, [payment.paymentProvider, t]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.06] transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {!singlePayment
            ? t('details.paymentLabel', { index: index + 1 })
            : t('details.payment')}
        </div>
        <StatusBadge status={payment.status} type="payment" />
      </div>
      <div className="mt-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t('details.method')}</span>
          <span className="font-medium flex items-center gap-2">
            {paymentMethodDisplay}
          </span>
        </div>
        {hasRefund ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t('details.charged')}
              </span>
              <span className="font-medium">
                {formatAmountInUSD(payment.amountInUSDCents, true)}
              </span>
            </div>
            {refundedAmountCents > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t('details.refunded')}
                </span>
                <span className="font-medium text-amber-400">
                  -{formatAmountInUSD(refundedAmountCents, true)}
                </span>
              </div>
            )}
            {pendingRefundCents > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t('details.refundPending')}
                </span>
                <span className="text-xs text-amber-300">
                  {formatAmountInUSD(pendingRefundCents, true)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-white/10 mt-2 pt-2">
              <span className="text-muted-foreground">
                {t('details.total')}
              </span>
              <span className="font-semibold">
                {formatAmountInUSD(totalAmountCents, true)}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('details.amount')}</span>
            <span className="font-medium">
              {formatAmountInUSD(payment.amountInUSDCents, true)}
            </span>
          </div>
        )}
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
  const t = useTranslations('orders');
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
          <AlertDialogTitle>
            {t('details.paymentDetailsTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('details.techDialogDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="animate-spin" /> {t('details.loading')}
          </div>
        ) : payment ? (
          <div className="mt-2 !w-full">
            <InfoRow
              label={t('details.paymentId')}
              value={paymentId ?? ''}
              field="modalPaymentId"
              onCopy={(text) => navigator.clipboard.writeText(text)}
            />
            <InfoRow
              label={t('details.type')}
              value={
                'isX402Payment' in payment && payment.isX402Payment
                  ? t('details.typeX402')
                  : payment.isOnChainPayment
                    ? t('details.typeOnChain')
                    : t('details.typeCard')
              }
              field="modalPaymentType"
              onCopy={(text) => navigator.clipboard.writeText(text)}
            />
            {'isX402Payment' in payment && payment.isX402Payment ? (
              <>
                <InfoRow
                  label={t('details.buyerWallet')}
                  value={payment.buyerWalletAddress}
                  field="buyerWalletAddress"
                  onCopy={(text) => navigator.clipboard.writeText(text)}
                />
                {payment.receiverWalletAddress && (
                  <InfoRow
                    label={t('details.receiverWallet')}
                    value={payment.receiverWalletAddress}
                    field="receiverWalletAddress"
                    onCopy={(text) => navigator.clipboard.writeText(text)}
                  />
                )}
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-sm text-muted-foreground">
                    {t('details.network')}
                  </span>
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
                      {t('details.settlementTx')}
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
                  label={t('details.wallet')}
                  value={payment.walletAddress}
                  field="walletAddress"
                  onCopy={(text) => navigator.clipboard.writeText(text)}
                />
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-sm text-muted-foreground">
                    {t('details.network')}
                  </span>
                  <div className="flex items-center gap-2">
                    {!!payment.chainId && (
                      <NetworkLogo
                        className="size-4"
                        network={payment.chainId}
                      />
                    )}
                    <span className="text-sm break-all">
                      {getChain(payment.chainId as number)?.name ||
                        t('details.chainIdLabel', { chainId: payment.chainId })}
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
                    label={t('details.txHash')}
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
                  label={t('details.brand')}
                  value={payment.brand ?? '-'}
                  field="brand"
                  onCopy={(text) => navigator.clipboard.writeText(text)}
                />
                <InfoRow
                  label={t('details.last4')}
                  value={payment.last4 ?? '-'}
                  field="last4"
                  onCopy={(text) => navigator.clipboard.writeText(text)}
                />
              </>
            ) : null}

            {/* Refunds section */}
            <div className="my-2">
              <Separator className="opacity-50" />
            </div>
            <div className="font-medium mb-2">{t('details.refunds')}</div>
            {refundsLoading ? (
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="animate-spin" />{' '}
                {t('details.loadingRefunds')}
              </div>
            ) : refunds.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {t('details.noRefunds')}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {refunds.map((r, idx) => (
                  <div
                    key={r.refundId ?? idx}
                    className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t('details.refundLabel', { index: idx + 1 })}
                      </span>
                      <StatusBadge status={r.status} type="payment" />
                    </div>
                    <div className="mt-2">
                      <InfoRow
                        label={t('details.amount')}
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
                          {t('details.network')}
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
                                t('details.chainIdLabel', {
                                  chainId: r.chainId,
                                })
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
                        label={t('details.refundTxHash')}
                        value={r.txHash ? getShortId(r.txHash, 20, 20) : '-'}
                        field={`refundTxHash-${idx}`}
                        onCopy={() =>
                          navigator.clipboard.writeText(r.txHash ?? '')
                        }
                      />
                      {r.walletAddress && (
                        <InfoRow
                          label={t('details.wallet')}
                          value={r.walletAddress}
                          field={`refundWallet-${idx}`}
                          onCopy={(text) => navigator.clipboard.writeText(text)}
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
          <AlertDialogCancel>{t('details.close')}</AlertDialogCancel>
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
  const t = useTranslations('orders');
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
        toast.success(t('details.toastAuthCodeUpdated'));
        await queryClient.invalidateQueries({
          queryKey: trpc.orders.getOrder.queryKey({ orderId }),
        });
      },
      onError: (error) => {
        toast.error(error.message || t('details.toastAuthCodeFailed'));
      },
    }),
  );

  const confirmUnlockMutation = useMutation(
    trpc.orders.confirmDomainUnlocked.mutationOptions({
      onSuccess: async () => {
        toast.success(t('details.toastUnlockConfirmed'));
        await queryClient.invalidateQueries({
          queryKey: trpc.orders.getOrder.queryKey({ orderId }),
        });
      },
      onError: (error) => {
        toast.error(error.message || t('details.toastUnlockFailed'));
      },
    }),
  );

  const cancelRequiredActionMutation = useMutation(
    trpc.orders.cancelRequiredActionOrderItem.mutationOptions({
      onSuccess: async () => {
        toast.success(t('details.toastItemCancelled'));
        await queryClient.invalidateQueries({
          queryKey: trpc.orders.getOrder.queryKey({ orderId }),
        });
      },
      onError: (error) => {
        toast.error(error.message || t('details.toastCancelFailed'));
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
      toast.error(t('details.toastEnterAuthCode'));
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
          <AlertDialogTitle>{t('details.itemDetailsTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('details.techDialogDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {item ? (
          <div className="mt-2">
            <InfoRow
              label={t('details.domain')}
              value={item.normalizedDomainName}
              field="domain"
              onCopy={(text) => navigator.clipboard.writeText(text)}
            />
            <InfoRow
              label={t('details.type')}
              value={item.type}
              field="type"
              onCopy={(text) => navigator.clipboard.writeText(text)}
            />
            <InfoRow
              label={t('details.amount')}
              value={formatAmountInUSD(item.amountInUSDCents, true)}
              field="amount"
              onCopy={(text) => navigator.clipboard.writeText(text)}
            />
            <InfoRow
              label={t('details.durationLabel')}
              value={t('details.duration', { count: item.durationInYears })}
              field="duration"
              onCopy={(text) => navigator.clipboard.writeText(text)}
            />
            {item.metadata?.requiredAction && (
              <InfoRow
                label={t('details.requiredAction')}
                labelClassName="font-semibold text-amber-700"
                value={getRequiredActionText(t, item.metadata?.requiredAction)}
                field="requiredAction"
                onCopy={(text) => navigator.clipboard.writeText(text)}
              />
            )}
            {mintTransaction && tokenId ? (
              <MintTokenRow
                label={t('details.mintedNft')}
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
                    {t('details.domainUnlockRequiredTitle')}
                  </AlertTitle>
                  <AlertDescription>
                    {t('details.domainUnlockRequiredDescription')}
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
                      {t('details.confirming')}
                    </>
                  ) : (
                    t('details.iUnlockedDomain')
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
                    {t('details.authCodeRequiredTitle')}
                  </AlertTitle>
                  <AlertDescription>
                    {t('details.authCodeRequiredDescription')}
                  </AlertDescription>
                </Alert>
                <form className="space-y-3" onSubmit={handleAuthCodeSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="order-auth-code">
                      {t('details.authCode')}
                    </Label>
                    <PasswordInput
                      id="order-auth-code"
                      value={authCode}
                      onChange={(event) => setAuthCode(event.target.value)}
                      placeholder={t('details.authCodePlaceholder')}
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
                        {t('details.updating')}
                      </>
                    ) : (
                      t('details.updateAuthCode')
                    )}
                  </Button>
                </form>
              </div>
            ) : null}
            {hasRequiredAction ? (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 space-y-2">
                <div className="text-sm font-semibold">
                  {t('details.cancelThisItem')}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('details.cancelThisItemDescription')}
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
                      {t('details.canceling')}
                    </>
                  ) : (
                    t('details.cancelItem')
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{t('details.close')}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
function getRequiredActionText(
  t: OrdersTranslator,
  requiredAction?: string | null,
) {
  switch (requiredAction) {
    case 'EPP_AUTH_CODE_UPDATE_REQUIRED':
      return t('details.requiredActionAuthCode');
    case 'EPP_UNLOCK_REQUIRED':
      return t('details.requiredActionUnlock');
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
  t: OrdersTranslator,
  failureDetails?: OrderItemMetadata['failureDetails'] | null,
) {
  if (!failureDetails) return null;

  const { requiredAction, resolution, actor, timeoutMs } = failureDetails;
  const isAuthCodeRequired = requiredAction === 'EPP_AUTH_CODE_UPDATE_REQUIRED';
  const duration = formatFailureDuration(timeoutMs);

  if (resolution === 'TIMEOUT') {
    if (duration) {
      return isAuthCodeRequired
        ? t('details.failureTimeoutAuthCodeDuration', { duration })
        : t('details.failureTimeoutLockedDuration', { duration });
    }
    return isAuthCodeRequired
      ? t('details.failureTimeoutAuthCode')
      : t('details.failureTimeoutLocked');
  }

  if (actor === 'ADMIN') {
    return isAuthCodeRequired
      ? t('details.failureAdminAuthCode')
      : t('details.failureAdminLocked');
  }

  return isAuthCodeRequired
    ? t('details.failureUserAuthCode')
    : t('details.failureUserLocked');
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
