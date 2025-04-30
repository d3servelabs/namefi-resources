'use client';

import { AuthRequired } from '@/components/auth-required';
import { CartCard } from '@/components/cart-card';
import { NamefiButton } from '@/components/namefi-button';
import { NftDomainCard } from '@/components/nft-domain-card';
import { useOrigin } from '@/components/providers/originProvider';
import { Button } from '@/components/ui/shadcn/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/shadcn/carousel';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, getShortAddress } from '@/lib/utils';
import { useTRPC } from '@/utils/trpc';
import { orderStatusSchema } from '@namefi-astra/db/types';
import {
  getChain,
  getSubDomainAndParentDomainFromNormalizedDomainName,
} from '@namefi-astra/utils';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo } from 'react';
import {
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  TwitterIcon,
  TwitterShareButton,
} from 'react-share';

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderPage({ params }: OrderPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  const { data: order, isLoading: isOrderLoading } = useQuery({
    ...trpc.orders.getOrder.queryOptions({ orderId: id }),
    enabled: !!id && isAuthenticated,
    refetchInterval: (query) => {
      const currentStatus = query.state.data?.status;

      if (
        !currentStatus ||
        currentStatus === orderStatusSchema.Values.PROCESSING ||
        currentStatus === orderStatusSchema.Values.CREATED
      ) {
        return 5000;
      }

      return false;
    },
  });

  const {
    data: paymentMethodDetails,
    isLoading: arePaymentMethodDetailsLoading,
  } = useQuery({
    ...trpc.orders.getOrderPaymentMethodDetails.queryOptions({ orderId: id }),
    enabled: !!id && isAuthenticated,
  });

  const isFailedOrder = useMemo(() => {
    return (
      order?.status === orderStatusSchema.Values.FAILED ||
      order?.status === orderStatusSchema.Values.CANCELLED
    );
  }, [order?.status]);

  const isCompletedOrder = useMemo(() => {
    return (
      order?.status === orderStatusSchema.Values.SUCCEEDED ||
      order?.status === orderStatusSchema.Values.PARTIALLY_COMPLETED
    );
  }, [order?.status]);

  useEffect(() => {
    if (isFailedOrder) {
      router.replace(`/orders/${id}/details`);
    }
  }, [isFailedOrder, id, router]);

  const orderItems = useMemo(() => {
    if (!order?.items) {
      return [];
    }
    return order.items
      .filter(
        (item) =>
          item.status !== orderStatusSchema.Values.FAILED &&
          item.status !== orderStatusSchema.Values.CANCELLED,
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
  }, [order?.items]);

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

    if (!order?.payment.nfscPaymentDetails) {
      return '-';
    }

    return `(${getChain(order.payment.nfscPaymentDetails.chainId)?.name}) ${getShortAddress(order.payment.nfscPaymentDetails.walletAddress)}`;
  }, [isCreditCardPayment, order?.payment]);

  if (!(isAuthLoading || isAuthenticated)) {
    return (
      <AuthRequired
        title="Sign in required"
        description="Please sign in to view your order details"
      />
    );
  }

  if (isAuthLoading || isOrderLoading || origin.isLoading) {
    return (
      <div className="container mx-auto py-8 px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-[400px] mx-auto" />
          </div>

          <Carousel className="mb-6">
            <CarouselContent className="-ml-2 md:-ml-4">
              {[1, 2, 3].map((index) => (
                <CarouselItem
                  key={index}
                  className="md:basis-1/2 lg:basis-1/3 pl-2 md:pl-4"
                >
                  <CartCard className="p-4">
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
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>

          <CartCard
            title="Share"
            className="mb-6 bg-black/[0.03] border-white/10"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-24" />
              <div className="flex gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-9 w-9 rounded-md" />
                ))}
              </div>
            </div>
          </CartCard>

          <CartCard
            title="Order Details"
            className="mb-6 bg-black/[0.03] border-white/10"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </CartCard>

          <div className="flex gap-4 mb-8">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>

          <div className="text-center">
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
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

  if (!isCompletedOrder) {
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
                      origin={origin.originInfo}
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
                  origin={origin.originInfo}
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
                    origin={origin.originInfo}
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
                origin={origin.originInfo}
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
                url={`https://${origin.originInfo.thirdPartyHostname}`}
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
                url={`https://${origin.originInfo.thirdPartyHostname}`}
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
                url={`https://${origin.originInfo.thirdPartyHostname}`}
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
              <span>${order.totalAmountInUSDCents / 100} USD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment</span>
              {isCreditCardPayment ? (
                isAuthLoading || arePaymentMethodDetailsLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <span>{creditCardPreviewText}</span>
                )
              ) : (
                <span>{onChainPaymentPreviewText}</span>
              )}
            </div>
          </div>
        </CartCard>

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
