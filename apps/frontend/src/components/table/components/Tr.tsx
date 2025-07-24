'use client';

import { cn } from '@/lib/cn';
import { type HTMLAttributes, forwardRef } from 'react';
import { Consumer } from '../utils';
import { TrInner } from './TrInner';

type Props = HTMLAttributes<HTMLTableRowElement>;

export const Tr = forwardRef<HTMLTableRowElement, Props>(
  ({ className, ...rest }, ref) => {
    return (
      <Consumer>
        {(data) => (
          <TrInner
            ref={ref}
            className={cn('', data.classes?.tr, className)}
            data={data}
            {...rest}
          />
        )}
      </Consumer>
    );
  },
);

Tr.displayName = 'Tr';
