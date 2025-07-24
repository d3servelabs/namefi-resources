'use client';

import { cn } from '@/lib/cn';
import { type HTMLAttributes, forwardRef } from 'react';
import { Consumer, type Context } from '../utils';

type Props = HTMLAttributes<HTMLTableSectionElement>;

export const Tfoot = forwardRef<HTMLTableSectionElement, Props>(
  ({ className, children, ...rest }, ref) => {
    return (
      <Consumer>
        {(data: Context) =>
          data.hasFooter && (
            <tfoot
              ref={ref}
              className={cn('', data.classes?.tfoot, className)}
              data-testid="tfoot"
              {...rest}
            >
              {children}
            </tfoot>
          )
        }
      </Consumer>
    );
  },
);

Tfoot.displayName = 'Tfoot';
