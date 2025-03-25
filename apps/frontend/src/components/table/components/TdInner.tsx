'use client';

import { cn } from '@/lib/utils';
import { type TdHTMLAttributes, forwardRef } from 'react';
import { useMediaQuery } from 'react-responsive';
import type { Context } from '../utils';

interface Props extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'data'> {
  data: Context;
  column?: string;
}

export const TdInner = forwardRef<HTMLTableCellElement, Props>(
  ({ data, column, className, children, colSpan, ...rest }, ref) => {
    const mobile = useMediaQuery({ query: `(max-width: ${data.screen}px)` });

    if (colSpan) {
      return (
        <td
          ref={ref}
          data-testid="td"
          colSpan={colSpan}
          className={cn('', className)}
          {...rest}
        >
          {children}
        </td>
      );
    }

    return (
      <td
        ref={ref}
        data-testid="td"
        className={cn('pivoted', className)}
        {...rest}
      >
        {mobile && data.hasPivot && (
          <div
            data-testid="td-before"
            {...data.pivot}
            className={cn(
              'td-before hidden',
              data.classes.pivot,
              data.pivot?.className,
            )}
          >
            {typeof column !== 'undefined' && data.headers[column]}
          </div>
        )}
        {children ?? <div>&nbsp;</div>}
      </td>
    );
  },
);

TdInner.displayName = 'TdInner';
