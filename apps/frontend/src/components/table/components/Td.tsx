'use client';

import { cn } from '@/lib/cn';
import { type TdHTMLAttributes, forwardRef } from 'react';
import { Consumer, type Context } from '../utils';
import { TdInner } from './TdInner';

interface Props
  extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'headers'> {
  column?: string;
}

export const Td = forwardRef<HTMLTableCellElement, Props>(
  ({ className, ...rest }, ref) => (
    <Consumer>
      {(data: Context) => (
        <TdInner
          ref={ref}
          className={cn('', data.classes?.td, className)}
          {...rest}
          data={data}
        />
      )}
    </Consumer>
  ),
);

Td.displayName = 'Td';
