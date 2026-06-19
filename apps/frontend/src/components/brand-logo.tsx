'use client';

import { ExpandingLottieMark } from '@/components/expanding-lottie-mark';
import { useOrigin } from '@/components/providers/origin';
import { shouldBypassImageOptimization } from '@/lib/image-src';
import { cn } from '@namefi-astra/ui/lib/cn';
import Image from 'next/image';
import Link from 'next/link';
import {
  type AnchorHTMLAttributes,
  type ForwardRefExoticComponent,
  type ForwardedRef,
  forwardRef,
  useCallback,
} from 'react';
import { useSidebar } from '@namefi-astra/ui/components/shadcn/sidebar';

export type BrandLogoProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
>;

/**
 * Width (px) the collapsed rail clips the Lottie to. The "nfi" mark sits at the
 * left of the 66px canvas and its rendered content ends at ~27px (measured by
 * pixel-scanning the collapsed frame); clip just past that so the mark is framed
 * tightly with no dead space, giving a clear shrink from the ~66px wordmark.
 */
const LOTTIE_MARK_COLLAPSED_WIDTH = 28;

/**
 * Width-transition timing matched to the `namefi_to_nfi.json` morph so the box
 * grows/shrinks in lockstep with the Lottie over the SAME 1001ms playback. The
 * comp is 30 frames @ 29.97fps; the "amefi" layer holds for frames 0→20 then
 * slides over frames 20→30 with easing handles out=(0.167,0) in=(0.5,1).
 *
 * Rather than approximate with one cubic-bezier + a separate delay (which drifts
 * and jitters against the Lottie clock), these `linear()` curves sample that
 * motion at 14 points across the full timeline — flat through the hold, then the
 * eased slide — so the box edge tracks the wordmark tightly. Sampled from the
 * keyframe handles above; regenerate if the asset's timing/easing changes.
 */
const MORPH_DURATION_MS = 1001;
const MORPH_EASE_EXPAND =
  'linear(0 0%, 0 66.67%, 0.0440 69.05%, 0.1362 71.43%, 0.2463 73.81%, 0.3609 76.19%, 0.4728 78.57%, 0.5779 80.95%, 0.6736 83.33%, 0.7585 85.71%, 0.8314 88.10%, 0.8917 90.48%, 0.9389 92.86%, 0.9728 95.24%, 0.9932 97.62%, 1 100%)';
const MORPH_EASE_COLLAPSE =
  'linear(0 0%, 0.0440 2.38%, 0.1362 4.76%, 0.2463 7.14%, 0.3609 9.52%, 0.4728 11.90%, 0.5779 14.29%, 0.6736 16.67%, 0.7585 19.05%, 0.8314 21.43%, 0.8917 23.81%, 0.9389 26.19%, 0.9728 28.57%, 0.9932 30.95%, 1 33.33%, 1 100%)';

export const BrandLogo: ForwardRefExoticComponent<BrandLogoProps> = forwardRef<
  HTMLAnchorElement,
  BrandLogoProps
>(function BrandLogo(
  { className, ...rest }: BrandLogoProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const originInfo = useOrigin();
  const { state: sidebarState, isMobile } = useSidebar();
  const logo = originInfo.config.logo;
  // The desktop rail is the only state that shows the compact mark; expanded
  // and the mobile sheet always show the full lockup.
  const isRailCollapsed = sidebarState === 'collapsed' && !isMobile;
  const shouldBypassLogoOptimization =
    logo.type === 'image' &&
    typeof logo.image === 'string' &&
    shouldBypassImageOptimization(logo.image);

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
      {logo.type === 'image' ? (
        <div className="relative flex h-7 w-7 shrink-0 items-center justify-center">
          <Image
            src={logo.image}
            alt={logo.alt}
            title={logo.title}
            width={28}
            height={28}
            className="size-full rounded-md object-contain"
            unoptimized={shouldBypassLogoOptimization}
          />
        </div>
      ) : logo.type === 'lottie' ? (
        <ExpandingLottieMark
          cacheId={`brand-logo-${originInfo.thirdPartyHostname || 'default'}`}
          getJson={getJson}
          width={logo.width}
          height={logo.height}
          collapsedWidth={LOTTIE_MARK_COLLAPSED_WIDTH}
          // Show the full wordmark when expanded or on the mobile sheet; the
          // collapsed desktop rail shows the compact mark.
          expanded={!isRailCollapsed}
          durationMs={MORPH_DURATION_MS}
          expandEasing={MORPH_EASE_EXPAND}
          collapseEasing={MORPH_EASE_COLLAPSE}
        />
      ) : null}

      {(sidebarState !== 'collapsed' || isMobile) && logo.title ? (
        <span className="text-xl font-semibold transition-opacity duration-200 ease-in-out">
          {logo.title}
        </span>
      ) : null}
    </Link>
  );
});

BrandLogo.displayName = 'BrandLogo';
