'use client';

import { cn } from '@/lib/utils';
import type { FC, HTMLAttributes } from 'react';

export type WithoutForwardRefProps = HTMLAttributes<HTMLDivElement>;

export const WithoutForwardRef: FC<WithoutForwardRefProps> = ({
  className,
  ...rest
}: WithoutForwardRefProps) => {
  return (
    <div className={cn('', className)} {...rest}>
      WithoutForwardRef
    </div>
  );
};

WithoutForwardRef.displayName = 'WithoutForwardRef';
