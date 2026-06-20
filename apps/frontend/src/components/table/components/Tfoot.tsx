'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import { type HTMLAttributes, forwardRef } from 'react';
import { Consumer, type Context, TABLE_TESTID_ROOT } from '../utils';

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
              data-testid={`${data.testId ?? TABLE_TESTID_ROOT}.foot`}
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
