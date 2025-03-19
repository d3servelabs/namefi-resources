'use client';

import { cn } from '@/lib/utils';
import {
  type ForwardRefExoticComponent,
  type ForwardedRef,
  type HTMLAttributes,
  forwardRef,
} from 'react';

export type WithForwardRefProps = HTMLAttributes<HTMLDivElement>;

export const WithForwardRef: ForwardRefExoticComponent<WithForwardRefProps> =
  forwardRef<HTMLDivElement, WithForwardRefProps>(function WithForwardRef(
    { className, ...rest }: WithForwardRefProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    return (
      <div ref={ref} className={cn('', className)} {...rest}>
        WithForwardRef
      </div>
    );
  });

WithForwardRef.displayName = 'WithForwardRef';
