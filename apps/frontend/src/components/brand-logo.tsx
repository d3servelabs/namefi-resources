'use client';

import { LazyLottie } from '@/components/lazy-lottie';
import { useOrigin } from '@/components/providers/origin';
import { shouldBypassImageOptimization } from '@/lib/image-src';
import { cn } from '@namefi-astra/ui/lib/cn';
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
import { useSidebar } from '@namefi-astra/ui/components/shadcn/sidebar';

export type BrandLogoProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
>;

export const BrandLogo: ForwardRefExoticComponent<BrandLogoProps> = forwardRef<
  HTMLAnchorElement,
  BrandLogoProps
>(function BrandLogo(
  { className, ...rest }: BrandLogoProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const originInfo = useOrigin();
  const { state: sidebarState, isMobile } = useSidebar();
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const logo = originInfo.config.logo;
  const shouldBypassLogoOptimization =
    logo.type === 'image' &&
    typeof logo.image === 'string' &&
    shouldBypassImageOptimization(logo.image);

  useEffect(() => {
    if (lottieRef.current && logo?.type === 'lottie') {
      lottieRef.current.setDirection(sidebarState === 'collapsed' ? -1 : 1);
      lottieRef.current.play();
    }
  }, [sidebarState, logo]);

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
      <div
        className={cn(
          'relative flex shrink-0 items-center',
          logo.type === 'image'
            ? 'h-7 w-7 justify-center'
            : 'h-7 justify-start',
        )}
      >
        {logo.type === 'image' ? (
          <Image
            src={logo.image}
            alt={logo.alt}
            title={logo.title}
            width={28}
            height={28}
            className="size-full rounded-md object-contain"
            unoptimized={shouldBypassLogoOptimization}
          />
        ) : logo.type === 'lottie' ? (
          <LazyLottie
            id={`brand-logo-${originInfo.thirdPartyHostname || 'default'}`}
            lottieRef={lottieRef}
            getJson={getJson}
            style={{
              width: logo.width,
              height: logo.height,
            }}
            loop={false}
            autoplay={false}
          />
        ) : null}
      </div>

      {(sidebarState !== 'collapsed' || isMobile) && logo.title ? (
        <span className="text-xl font-semibold transition-opacity duration-200 ease-in-out">
          {logo.title}
        </span>
      ) : null}
    </Link>
  );
});

BrandLogo.displayName = 'BrandLogo';
