'use client';

import { LazyLottie } from '@/components/lazyLottie';
import { cn } from '@/lib/utils';
import type { LottieRefCurrentProps } from 'lottie-react';
import {
  type AnchorHTMLAttributes,
  type ForwardRefExoticComponent,
  type ForwardedRef,
  forwardRef,
  useCallback,
  useRef,
} from 'react';
import animationData from '../../public/namefi_to_nfi.json';

export type LogotypeProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  autoplay?: boolean;
};

export const Logotype: ForwardRefExoticComponent<LogotypeProps> = forwardRef<
  HTMLAnchorElement,
  LogotypeProps
>(function Logotype(
  { autoplay, className, ...rest }: LogotypeProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  const handleMouseEnter = useCallback(() => {
    if (lottieRef.current) {
      lottieRef.current.setDirection(1);
      lottieRef.current.play();
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (lottieRef.current) {
      lottieRef.current.setDirection(-1);
      lottieRef.current.play();
    }
  }, []);

  const getJson = useCallback(() => Promise.resolve(animationData), []);

  return (
    <a
      ref={ref}
      className={cn('flex items-center space-x-2', className)}
      {...rest}
      href="/"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <LazyLottie
        id="nfi-to-namefi"
        lottieRef={lottieRef}
        getJson={getJson}
        loop={false}
        autoplay={autoplay}
        style={{ width: 80, height: 24 }}
      />
    </a>
  );
});

Logotype.displayName = 'Logotype';
