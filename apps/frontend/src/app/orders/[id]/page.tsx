'use client';

import { AutoStartProgressBar } from '@/components/auto-start-progress-bar';
import { AuthRequired } from '@/components/auth-required';
import { CartCard } from '@/components/cart-card';
import { NamefiButton } from '@/components/buttons/namefi-button';
import { NftDomainCard } from '@/components/nft-domain-card';
import { useOrigin } from '@/components/providers/origin';
import { Button } from '@/components/ui/shadcn/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/shadcn/carousel';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Unauthorized } from '@/components/unauthorized';
import { useCartContext } from '@/components/providers/cart';
import { useAuth } from '@/hooks/use-auth';
import { formatDate, getShortAddress } from '@/lib/string';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { orderStatusSchema, type PaymentSelect } from '@namefi-astra/db/types';
import {
  getChain,
  getSubDomainAndParentDomainFromNormalizedDomainName,
} from '@namefi-astra/utils';
import { useQuery } from '@tanstack/react-query';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TRPCClientError } from '@trpc/client';
import { Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useRef } from 'react';
import {
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  TwitterIcon,
  TwitterShareButton,
} from 'react-share';
import { useDebounceValue } from 'usehooks-ts';
import { StatusBadge } from '@/components/status-badge';

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderPage({ params }: OrderPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  const { refetchCart } = useCartContext();

  useEffect(() => {
    refetchCart();
  }, [refetchCart]);

  const {
    data: orderDetails,
    isLoading: isOrderLoading,
    error,
  } = useQuery({
    ...trpc.orders.getOrder.queryOptions({ orderId: id }),
    enabled: !!id && isAuthenticated,
    refetchInterval: (query) => {
      const currentStatus = query.state.data?.order?.status;

      if (
        !currentStatus ||
        currentStatus === orderStatusSchema.enum.PROCESSING ||
        currentStatus === orderStatusSchema.enum.CREATED
      ) {
        return 5000;
      }

      return false;
    },
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
  const domainsRaw = (items || [])
    .map((it) => it.normalizedDomainName)
    .filter(Boolean);
  const uniqueDomains: NamefiNormalizedDomain[] = Array.from(
    new Set(domainsRaw),
  ) as NamefiNormalizedDomain[];
  const { data: bulkInternal } = useQuery({
    ...trpc.ai.getInternalGenerationsByDomains.queryOptions({
      domains: uniqueDomains,
    }),
    enabled: uniqueDomains.length > 0,
  });

  const isFailedOrder = useMemo(() => {
    return (
      order?.status === orderStatusSchema.enum.FAILED ||
      order?.status === orderStatusSchema.enum.CANCELLED
    );
  }, [order?.status]);

  const isCompletedOrder = useMemo(() => {
    return (
      order?.status === orderStatusSchema.enum.SUCCEEDED ||
      order?.status === orderStatusSchema.enum.PARTIALLY_COMPLETED
    );
  }, [order?.status]);

  useEffect(() => {
    if (isFailedOrder) {
      router.replace(`/orders/${id}/details`);
    }
  }, [isFailedOrder, id, router]);

  const orderItems = useMemo(() => {
    if (!items) {
      return [];
    }
    return items
      .filter(
        (item) =>
          item.status !== orderStatusSchema.enum.FAILED &&
          item.status !== orderStatusSchema.enum.CANCELLED,
      )
      .map((item) => {
        const { subdomain, parentDomain } =
          getSubDomainAndParentDomainFromNormalizedDomainName(
            item.normalizedDomainName,
          );
        return {
          subdomain,
          parentDomain,
          fullDomain: item.normalizedDomainName,
        };
      });
  }, [items]);

  const origin = useOrigin();

  // Show carousel only when we have 3 or more domains, otherwise center cards in a flex row
  const showCarousel = orderItems.length > 2;

  const shareMessage = useMemo(() => {
    if (orderItems?.length === 0) {
      return '';
    }

    const domainList = orderItems.map((item) => item.fullDomain).join(', ');

    return orderItems.length > 1
      ? `Great I've just got ${domainList} from 0x.city (#PoweredByNamefi), come check it out!`
      : `Great I've just got ${orderItems[0].fullDomain} from 0x.city (#PoweredByNamefi), come check it out`;
  }, [orderItems]);

  const progressBarRef = useRef<AutoStartProgressBar>(null);

  useEffect(() => {
    if (isCompletedOrder) {
      progressBarRef.current?.finish();
    }
  }, [isCompletedOrder]);
  const [debouncedIsCompletedOrder] = useDebounceValue(isCompletedOrder, 3000);

  const progressBar = useMemo(() => {
    return (
      <div className="flex items-center justify-center py-4">
        <AutoStartProgressBar key={'progress-bar'} ref={progressBarRef} />
      </div>
    );
  }, []);

  if (!(isAuthLoading || isAuthenticated)) {
    return (
      <AuthRequired description="Please sign in to view your order details" />
    );
  }

  if (isAuthLoading || isOrderLoading) {
    return (
      <div className="container mx-auto py-8 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            Great! We are ready to secure your domain
          </h1>
          <p className="text-muted-foreground text-lg mb-8 flex items-center justify-center gap-2">
            Hang on tight...
            <Loader2 className="h-5 w-5 animate-spin" />
          </p>
          {progressBar}

          <div className="mb-6 flex justify-center">
            <CartCard className="p-4 w-full sm:w-3/4 md:w-1/2 lg:w-1/3 max-w-sm">
              <div className="relative w-full aspect-square overflow-hidden rounded-md bg-black/[0.03] border-1 border-brand-primary">
                <Skeleton className="h-full w-full" />
                <div className="absolute top-4.5 left-4.5">
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-3 py-4 bg-gradient-to-t from-black/90 via-black/10 to-transparent">
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              <Skeleton className="h-10 w-full mt-4" />
            </CartCard>
          </div>

          <div className="flex justify-center mb-8">
            <Skeleton className="h-10 w-[180px]" />
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
  if (!orderDetails || !order) {
    return (
      <div className="container mx-auto py-8 px-8">
        <div className="max-w-2xl mx-auto">
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
      </div>
    );
  }

  if (!debouncedIsCompletedOrder) {
    return (
      <div className="container mx-auto py-8 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            Great! We are ready to secure your domain
          </h1>
          <p className="text-muted-foreground text-lg mb-8 flex items-center justify-center gap-2">
            Hang on tight...
            <Loader2 className="h-5 w-5 animate-spin" />
          </p>
          {progressBar}

          {showCarousel ? (
            <Carousel className="mb-6">
              <CarouselContent className="-ml-2 md:-ml-4">
                {orderItems.map((item, index) => (
                  <CarouselItem
                    key={index}
                    className="md:basis-1/2 lg:basis-1/3 pl-2 md:pl-4"
                  >
                    <NftDomainCard
                      item={item}
                      origin={origin}
                      isCompleted={isCompletedOrder}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          ) : (
            <div className="mb-6 flex flex-wrap justify-center gap-4">
              {orderItems.map((item, index) => (
                <NftDomainCard
                  key={index}
                  item={item}
                  origin={origin}
                  isCompleted={isCompletedOrder}
                  className="p-4 w-full sm:w-3/4 md:w-1/2 lg:w-1/3 max-w-sm"
                />
              ))}
            </div>
          )}

          <div className="flex gap-4 mb-8 justify-center">
            <NamefiButton asChild={true}>
              <Link href={`/orders/${id}/details`}>View order details</Link>
            </NamefiButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Congratulations!</h1>
          <p className="text-muted-foreground text-lg">
            You've got your {orderItems.length > 1 ? 'domains' : 'domain'} and
            here {orderItems.length > 1 ? 'are the NFTs' : 'is the NFT'}
          </p>
        </div>

        {showCarousel ? (
          <Carousel className="mb-6">
            <CarouselContent className="-ml-2 md:-ml-4">
              {orderItems.map((item, index) => (
                <CarouselItem
                  key={index}
                  className="md:basis-1/2 lg:basis-1/3 pl-2 md:pl-4"
                >
                  <NftDomainCard
                    item={item}
                    origin={origin}
                    isCompleted={isCompletedOrder}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        ) : (
          <div className="mb-6 flex flex-wrap justify-center gap-4">
            {orderItems.map((item, index) => (
              <NftDomainCard
                key={index}
                item={item}
                origin={origin}
                isCompleted={isCompletedOrder}
                className="p-4 w-full sm:w-3/4 md:w-1/2 lg:w-1/3 max-w-sm"
              />
            ))}
          </div>
        )}

        <CartCard className="mb-6 bg-black/[0.03] border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Share on</span>
            <div className="flex gap-4">
              <TwitterShareButton
                url={`https://${origin.thirdPartyHostname}`}
                title={shareMessage}
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent border-none rounded-sm overflow-hidden cursor-pointer p-0"
                >
                  <TwitterIcon className="size-9" />
                </Button>
              </TwitterShareButton>

              <LinkedinShareButton
                url={`https://${origin.thirdPartyHostname}`}
                title={shareMessage}
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent border-none rounded-sm overflow-hidden cursor-pointer p-0"
                >
                  <LinkedinIcon className="size-9" />
                </Button>
              </LinkedinShareButton>

              <FacebookShareButton
                url={`https://${origin.thirdPartyHostname}`}
                title={shareMessage}
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent border-none rounded-sm overflow-hidden cursor-pointer p-0"
                >
                  <FacebookIcon className="size-9" />
                </Button>
              </FacebookShareButton>
            </div>
          </div>
        </CartCard>

        <CartCard
          title="Order Details"
          className="mb-6 bg-black/[0.03] border-white/10"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Date</span>
              <span>{formatDate(new Date(order.createdAt))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Grand total</span>
              <span>${order.amountInUSDCents / 100} USD</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">
                Payments ({payments.length === 1 ? 'Single' : 'Multiple'})
              </span>
              <PaymentMethodsDetails orderId={id} payments={payments} />
            </div>
          </div>
        </CartCard>

        {/* AI Brand Starters - Per Domain */}
        {uniqueDomains.length > 0 && (
          <CartCard className="mb-6 bg-black/[0.03] border-white/10">
            <Link
              href="/ai-brand-generator"
              className="inline-flex items-center gap-2 text-white underline underline-offset-4 text-xl font-semibold"
            >
              <ExternalLink className="h-5 w-5" />
              Just AIng by Namefi™
            </Link>

            <p className="text-sm text-muted-foreground mt-2">
              While your order was processing, we prepared a logo preview for
              your brand(s). Explore more styles and marketing images in Just
              AIng.
            </p>

            <div className="mt-4 mb-2 flex flex-wrap justify-center gap-4">
              {uniqueDomains.map((domain) => {
                const gens = (bulkInternal?.[domain] ?? []) as Array<{
                  type: 'logo' | 'marketing';
                  url: string;
                }>;
                const logo = gens.find((g) => g.type === 'logo');
                return (
                  <div
                    key={`ai-starter-${domain}`}
                    className="p-4 w-full sm:w-3/4 md:w-1/2 lg:w-1/3 max-w-sm"
                  >
                    <div className="relative w-full aspect-square overflow-hidden rounded-md bg-black/[0.03] border border-white/10">
                      {logo ? (
                        // biome-ignore lint/performance/noImgElement: using plain img for remote asset
                        <img
                          src={logo.url}
                          alt={`${domain} logo`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No preview
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-center text-sm truncate">
                      {domain}
                    </div>
                  </div>
                );
              })}
            </div>
          </CartCard>
        )}
        <div className="flex gap-4 mb-8">
          <NamefiButton
            variant="outline"
            className="flex-1 bg-black/[0.03] border-white/10 hover:bg-white/5"
            asChild={true}
          >
            <Link href={`/orders/${id}/details`}>View full details</Link>
          </NamefiButton>
          <NamefiButton className="flex-1" asChild={true}>
            <Link href="/">Back to home</Link>
          </NamefiButton>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodsDetails({
  orderId,
  payments,
}: {
  orderId: string;
  payments: PaymentSelect[];
}) {
  const trpc = useTRPC();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const { data: paymentMethods, isLoading: arePaymentMethodDetailsLoading } =
    useQuery({
      ...trpc.orders.getOrderPaymentMethodsDetails.queryOptions({ orderId }),
      enabled: !!orderId && isAuthenticated,
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

  const paymentMethodDetailsMap = useMemo(() => {
    return new Map(
      paymentMethods?.map((payment) => [payment.paymentId, payment]) ?? [],
    );
  }, [paymentMethods]);

  if (arePaymentMethodDetailsLoading || isAuthLoading) {
    return <Loader2 className="animate-spin" />;
  }

  if (!paymentMethodDetailsMap) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      {payments.map((payment) => (
        <SinglePaymentMethodDetails
          key={payment.id}
          payment={payment}
          paymentMethodDetails={
            paymentMethodDetailsMap.get(payment.id) ?? {
              paymentId: payment.id,
              isOnChainPayment: false,
              brand: undefined,
              last4: undefined,
            }
          }
        />
      ))}
    </div>
  );
}

type PaymentMethodDetails =
  AppRouterOutput['orders']['getOrderPaymentMethodsDetails'][number];

export function SinglePaymentMethodDetails({
  payment,
  paymentMethodDetails,
}: {
  payment: PaymentSelect;
  paymentMethodDetails: PaymentMethodDetails;
}) {
  const isCreditCardPayment = useMemo(
    () => payment.paymentProvider === 'STRIPE',
    [payment.paymentProvider],
  );
  const primaryPaymentMethod = paymentMethodDetails;
  const creditCardPreviewText = useMemo(() => {
    if (!isCreditCardPayment || !primaryPaymentMethod) {
      return '-';
    }

    if (
      !(
        !primaryPaymentMethod.isOnChainPayment &&
        primaryPaymentMethod.brand &&
        primaryPaymentMethod.last4
      )
    ) {
      return 'Credit Card';
    }

    return `${primaryPaymentMethod.brand.toLocaleUpperCase()}(${primaryPaymentMethod.last4})`;
  }, [isCreditCardPayment, primaryPaymentMethod]);

  const onChainPaymentPreviewText = useMemo(() => {
    if (isCreditCardPayment) {
      return '';
    }

    if (!payment.nfscPaymentDetails) {
      return '-';
    }

    const chain = getChain(payment.nfscPaymentDetails.chainId);
    const chainName =
      chain?.name || `Chain ID ${payment.nfscPaymentDetails.chainId}`;
    return `(${chainName}) ${getShortAddress(payment.nfscPaymentDetails.walletAddress)}`;
  }, [isCreditCardPayment, payment.nfscPaymentDetails]);

  return (
    <div className="flex flex-row gap-2 items-center">
      {isCreditCardPayment ? (
        <span className="font-medium text-muted-foreground text-sm">
          {creditCardPreviewText}
        </span>
      ) : (
        <span className="font-medium text-muted-foreground text-sm">
          {onChainPaymentPreviewText}
        </span>
      )}
      {payment.status && (
        <div className="scale-90">
          <StatusBadge status={payment.status} type="payment" />
        </div>
      )}
      <span className="w-[8ch] text-end whitespace-pre">
        ${payment.amountInUSDCents / 100}{' '}
        {isCreditCardPayment ? '  USD' : 'NFSC'}
      </span>
    </div>
  );
}
