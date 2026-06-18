import { CartCard } from '@/components/cart-card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  TwitterIcon,
  LinkedinIcon,
  FacebookIcon,
  TwitterShareButton,
  LinkedinShareButton,
  FacebookShareButton,
} from 'react-share';
import type { OriginInfo } from '@/lib/origin';
import { useTranslations } from 'next-intl';

export const ShareOrder = ({
  origin,
  shareMessage,
}: {
  origin: OriginInfo;
  shareMessage: string;
}) => {
  const t = useTranslations('orders');
  return (
    <CartCard className="mb-6 bg-black/[0.03] border-white/10">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">{t('share.shareOn')}</span>
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
  );
};
