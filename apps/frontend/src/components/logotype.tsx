'use client';

import { LazyLottie } from '@/components/lazyLottie';
import { cn } from '@/lib/utils';
import type { LottieRefCurrentProps } from 'lottie-react';
import {
  type AnchorHTMLAttributes,
  type ForwardRefExoticComponent,
  type ForwardedRef,
  forwardRef,
  useRef,
} from 'react';
import animationData from '../../public/namefi_to_nfi.json';

export type LogotypeProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export const Logotype: ForwardRefExoticComponent<LogotypeProps> = forwardRef<
  HTMLAnchorElement,
  LogotypeProps
>(function Logotype(
  { className, ...rest }: LogotypeProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  const handleMouseEnter = () => {
    if (lottieRef.current) {
      lottieRef.current.setDirection(1);
      lottieRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (lottieRef.current) {
      lottieRef.current.setDirection(-1);
      lottieRef.current.play();
    }
  };

  return (
    <a
      ref={ref}
      className={cn('mr-6 flex items-center space-x-2', className)}
      {...rest}
      href="/"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <LazyLottie
        id="nfi-to-namefi"
        lottieRef={lottieRef}
        getJson={() => Promise.resolve(animationData)}
        loop={false}
        autoplay={false}
        style={{ width: 80, height: 24 }}
      />
    </a>
  );
});

Logotype.displayName = 'Logotype';
