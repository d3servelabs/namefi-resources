'use client';

import { cn } from '@/lib/utils';
import {
  type CSSProperties,
  type FC,
  type ForwardedRef,
  type HTMLAttributes,
  forwardRef,
  useEffect,
  useMemo,
  useState,
} from 'react';
import styled, { css, keyframes } from 'styled-components';

const animation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const LoaderRing = styled.div<{
  speed: number;
}>`
  animation: ${({ speed }) => css`
    ${animation} ${speed}s cubic-bezier(0.5, 0, 0.5, 1) infinite
  `};

  &:nth-child(1) {
    animation-delay: -0.45s;
  }
  &:nth-child(2) {
    animation-delay: -0.3s;
  }
  &:nth-child(3) {
    animation-delay: -0.15s;
  }
`;

export interface PreloaderProps extends HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  size?: number; // Diameter of the loader
  color?: string; // Primary color of the loader
  thickness?: number; // Thickness of the border
  speed?: number; // Animation speed in seconds
  delay?: number; // Delay in milliseconds
}

export const Preloader: FC<PreloaderProps> = forwardRef(
  (
    {
      disabled = false,
      size = 80,
      color = '#ffffff',
      thickness = 8,
      speed = 1.2,
      delay = 500,
      className,
      ...rest
    }: PreloaderProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    const [loaded, setLoaded] = useState(false);

    const keys = useMemo(
      () => [...new Array(4)].map(() => crypto.randomUUID()),
      [],
    );

    const parentStyle = useMemo<CSSProperties>(
      () => ({ width: `${size}px`, height: `${size}px` }),
      [size],
    );

    const childStyle = useMemo<CSSProperties>(
      () => ({
        width: size - 2 * thickness,
        height: size - 2 * thickness,
        margin: thickness,
        border: `${thickness}px solid ${color}`,
        borderColor: `${color} transparent transparent transparent`,
      }),
      [color, size, thickness],
    );

    useEffect(() => {
      const timer = setTimeout(() => {
        setLoaded(true);
      }, delay);

      return () => clearTimeout(timer);
    }, [delay]);

    if (loaded) {
      return null;
    }

    return (
      <div
        className={cn([
          'fixed inset-0 z-50 flex items-center justify-center bg-black text-white',
          disabled && 'cursor-not-allowed',
          className,
        ])}
        ref={ref}
        role="alert"
        aria-live="assertive"
        aria-label="Loading content, please wait"
        {...rest}
      >
        <div className="relative flex" style={parentStyle}>
          {keys.map((key) => (
            <LoaderRing
              key={key}
              speed={speed}
              style={childStyle}
              className="absolute box-border block rounded-full"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    );
  },
);

Preloader.displayName = 'Preloader';
