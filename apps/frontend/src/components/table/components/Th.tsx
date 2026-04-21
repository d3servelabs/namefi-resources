'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import { type ThHTMLAttributes, forwardRef } from 'react';
import { Consumer, type Context } from '../utils';

type Props = ThHTMLAttributes<HTMLTableCellElement>;

export const Th = forwardRef<HTMLTableCellElement, Props>(
  ({ className, children, ...rest }, ref) => {
    return (
      <Consumer>
        {(data: Context) => (
          <th
            ref={ref}
            data-testid="th"
            className={cn('', data.classes?.th, className)}
            {...rest}
          >
            {children}
          </th>
        )}
      </Consumer>
    );
  },
);

Th.displayName = 'Th';
