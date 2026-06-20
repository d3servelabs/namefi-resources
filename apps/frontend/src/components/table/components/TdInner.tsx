'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import { type TdHTMLAttributes, forwardRef } from 'react';
import { useMediaQuery } from 'react-responsive';
import { type Context, TABLE_TESTID_ROOT } from '../utils';

interface Props extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'data'> {
  data: Context;
  column?: string;
}

export const TdInner = forwardRef<HTMLTableCellElement, Props>(
  ({ data, column, className, children, colSpan, ...rest }, ref) => {
    const mobile = useMediaQuery({ query: `(max-width: ${data.screen}px)` });
    const root = data.testId ?? TABLE_TESTID_ROOT;

    if (colSpan) {
      return (
        <td
          ref={ref}
          data-testid={`${root}.cell`}
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
        data-testid={`${root}.cell`}
        className={cn('pivoted', className)}
        {...rest}
      >
        {mobile && data.hasPivot && (
          <div
            data-testid={`${root}.cell-label`}
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
