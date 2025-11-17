import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/shadcn/carousel';
import { NftDomainCard, type NftDomainCardProps } from '../nft-domain-card';
import type { OriginInfo } from '@/lib/origin';
import { Skeleton } from '../ui/shadcn/skeleton';

export const NftCarousel = ({
  items,
  origin,
  isCompletedOrder,
}: {
  items: Array<NftDomainCardProps['item'] & { hasMintedNft: boolean }>;
  origin: OriginInfo;
  isCompletedOrder: boolean;
}) => {
  if (items.length === 0) {
    return (
      <div className="mb-6 flex flex-wrap justify-center gap-4">
        {Array.from({
          length: 2,
        }).map((_, index) => (
          <Skeleton
            key={`order-domain-skeleton-${index}`}
            className="h-[260px] w-full max-w-sm rounded-2xl sm:w-3/4 md:w-1/2 lg:w-1/3"
          />
        ))}
      </div>
    );
  }

  if (items.length < 3) {
    return (
      <div className="mb-6 flex flex-wrap justify-center gap-4">
        {items.map((item, index) => (
          <NftDomainCard
            key={index}
            item={item}
            origin={origin}
            isCompleted={isCompletedOrder}
            canViewNft={isCompletedOrder && item.hasMintedNft}
            className="p-4 w-full sm:w-3/4 md:w-1/2 lg:w-1/3 max-w-sm"
          />
        ))}
      </div>
    );
  }

  return (
    <Carousel className="mb-6">
      <CarouselContent className="-ml-2 md:-ml-4">
        {items.map((item, index) => (
          <CarouselItem
            key={index}
            className="md:basis-1/2 lg:basis-1/3 pl-2 md:pl-4"
          >
            <NftDomainCard
              item={item}
              origin={origin}
              isCompleted={isCompletedOrder}
              canViewNft={isCompletedOrder && item.hasMintedNft}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
};
