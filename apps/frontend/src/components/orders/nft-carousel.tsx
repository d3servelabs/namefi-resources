import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@namefi-astra/ui/components/shadcn/carousel';
import { NftDomainCard, type NftDomainCardProps } from '../nft-domain-card';
import type { OriginInfo } from '@/lib/origin';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';

// Thin, full-height side controls (desktop only) overlaid on the carousel
// edges. Overrides the default round button: square-ish, tall, translucent.
// Mobile relies on swipe, so the buttons are hidden there.
const SIDE_BUTTON_CLASS =
  'hidden h-auto w-7 translate-y-0 rounded-md border-white/10 bg-black/40 text-zinc-200 hover:bg-black/70 sm:flex';

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
        {['skeleton-a', 'skeleton-b'].map((key) => (
          <Skeleton
            key={key}
            className="h-[260px] w-full max-w-sm rounded-2xl sm:w-3/4 md:w-1/2 lg:w-1/3"
          />
        ))}
      </div>
    );
  }

  if (items.length < 3) {
    return (
      <div className="mb-6 flex flex-wrap justify-center gap-4">
        {items.map((item) => (
          <NftDomainCard
            key={item.fullDomain}
            item={item}
            origin={origin}
            isCompleted={isCompletedOrder}
            canViewNft={false}
            showViewDomainButton={false}
            className="w-full max-w-sm p-4 sm:w-3/4 md:w-1/2 lg:w-1/3"
          />
        ))}
      </div>
    );
  }

  // 3+ domains: the standard carousel — drag/swipe everywhere, plus thin tall
  // prev/next controls on desktop. Cards themselves are display-only.
  return (
    <Carousel className="mb-6" opts={{ align: 'start' }}>
      <CarouselContent className="-ms-2 md:-ms-4">
        {items.map((item) => (
          <CarouselItem
            key={item.fullDomain}
            className="basis-4/5 ps-2 sm:basis-1/2 md:ps-4 lg:basis-1/3"
          >
            <NftDomainCard
              item={item}
              origin={origin}
              isCompleted={isCompletedOrder}
              canViewNft={false}
              showViewDomainButton={false}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious
        className={`top-1 bottom-1 start-1 ${SIDE_BUTTON_CLASS}`}
      />
      <CarouselNext className={`top-1 end-1 bottom-1 ${SIDE_BUTTON_CLASS}`} />
    </Carousel>
  );
};
