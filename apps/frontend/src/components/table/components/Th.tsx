'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import { type ThHTMLAttributes, forwardRef } from 'react';
import { Consumer, type Context, TABLE_TESTID_ROOT } from '../utils';

type Props = ThHTMLAttributes<HTMLTableCellElement>;

export const Th = forwardRef<HTMLTableCellElement, Props>(
  ({ className, children, ...rest }, ref) => {
    return (
      <Consumer>
        {(data: Context) => (
          <th
            ref={ref}
            data-testid={`${data.testId ?? TABLE_TESTID_ROOT}.col`}
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
