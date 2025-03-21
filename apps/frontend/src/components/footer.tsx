'use client';

import { cn } from '@/lib/utils';
import {
  type ForwardRefExoticComponent,
  type ForwardedRef,
  type HTMLAttributes,
  forwardRef,
} from 'react';

export type FooterProps = HTMLAttributes<HTMLDivElement>;

export const Footer: ForwardRefExoticComponent<FooterProps> = forwardRef<
  HTMLDivElement,
  FooterProps
>(function Footer(
  { className, children, ...rest }: FooterProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <footer ref={ref} className={cn('', className)} {...rest}>
      {children}
    </footer>
  );
});

Footer.displayName = 'Footer';
