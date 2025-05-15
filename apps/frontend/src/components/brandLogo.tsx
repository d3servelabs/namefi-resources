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
  useEffect,
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
  const logo = isLoading ? null : originInfo.config.logo;

  useEffect(() => {
    if (lottieRef.current && logo?.type === 'lottie') {
      lottieRef.current.setDirection(collapsed ? -1 : 1);
      lottieRef.current.play();
    }
  }, [collapsed, logo]);

  const getJson = useCallback(async () => {
    if (logo?.type === 'lottie') {
      try {
        const response = await fetch(logo.lottie);
        return response.json();
      } catch {
        throw new Error('Failed to load Lottie animation');
      }
    }
    throw new Error('No Lottie animation data available');
  }, [logo]);

  if (isLoading || !logo) {
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
      {...rest}
    >
      <div className="relative flex shrink-0 items-center justify-center">
        {logo.type === 'image' ? (
          <Image
            src={logo.image}
            alt={logo.alt}
            title={logo.title}
            width={26}
            height={26}
            className="rounded-md object-contain h-6.5 w-6.5"
            priority={true}
          />
        ) : logo.type === 'lottie' ? (
          <LazyLottie
            id={`brand-logo-${originInfo.thirdPartyHostname || 'default'}`}
            lottieRef={lottieRef}
            getJson={getJson}
            style={{ width: logo.width, height: logo.height }}
            loop={false}
            autoplay={false}
          />
        ) : null}
      </div>

      {!collapsed && (
        <span className="text-xl font-semibold transition-opacity duration-200 ease-in-out">
          {logo.title}
        </span>
      )}
    </Link>
  );
});

BrandLogo.displayName = 'BrandLogo';
