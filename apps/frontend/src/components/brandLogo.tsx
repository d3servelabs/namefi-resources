'use client';

import { LazyLottie } from '@/components/lazyLottie';
import { useOrigin } from '@/components/providers/originProvider';
import { cn } from '@/lib/utils';
import type { LottieRefCurrentProps } from 'lottie-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  type AnchorHTMLAttributes,
  type ForwardRefExoticComponent,
  type ForwardedRef,
  forwardRef,
  useCallback,
  useRef,
} from 'react';

export type BrandLogoProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  collapsed?: boolean;
};

export const BrandLogo: ForwardRefExoticComponent<BrandLogoProps> = forwardRef<
  HTMLAnchorElement,
  BrandLogoProps
>(function BrandLogo(
  { collapsed = false, className, ...rest }: BrandLogoProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const { isLoading, originInfo } = useOrigin();
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const brandLogo = isLoading ? null : originInfo.config.brandLogo;

  const getJson = useCallback(async () => {
    if (brandLogo?.type === 'lottie') {
      try {
        const response = await fetch(brandLogo.lottie);
        return response.json();
      } catch {
        throw new Error('Failed to load Lottie animation');
      }
    }
    throw new Error('No Lottie animation data available');
  }, [brandLogo]);

  const handleMouseEnter = useCallback(() => {
    if (lottieRef.current && brandLogo?.type === 'lottie' && !collapsed) {
      lottieRef.current.setDirection(1);
      lottieRef.current.play();
    }
  }, [brandLogo, collapsed]);

  const handleMouseLeave = useCallback(() => {
    if (lottieRef.current && brandLogo?.type === 'lottie' && !collapsed) {
      lottieRef.current.setDirection(-1);
      lottieRef.current.play();
    }
  }, [brandLogo, collapsed]);

  if (isLoading || !brandLogo) {
    return null;
  }

  return (
    <Link
      ref={ref}
      href="/"
      className={cn(
        'flex items-center gap-3 transition-all duration-300 ease-in-out overflow-hidden',
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      <div className="relative flex shrink-0 items-center justify-center">
        {brandLogo.type === 'image' ? (
          <Image
            src={brandLogo.logo}
            alt={brandLogo.alt}
            title={brandLogo.title}
            width={26}
            height={26}
            className="rounded-md object-contain h-6.5 w-6.5"
            priority={true}
          />
        ) : brandLogo.type === 'lottie' ? (
          <LazyLottie
            id={`brand-logo-${originInfo.thirdPartyOrigin || 'default'}`}
            lottieRef={lottieRef}
            getJson={getJson}
            style={{ width: brandLogo.width, height: brandLogo.height }}
            loop={false}
            autoplay={false}
          />
        ) : null}
      </div>

      {!collapsed && (
        <span className="text-xl font-semibold transition-opacity duration-200 ease-in-out">
          {brandLogo.title}
        </span>
      )}
    </Link>
  );
});

BrandLogo.displayName = 'BrandLogo';
